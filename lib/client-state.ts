"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aiActionId, aiSummaryInsightId } from "@/lib/review-count";
export { aiActionId, aiSummaryInsightId } from "@/lib/review-count";
import type {
  ActionFact,
  InsightKind,
  MeetingInsight,
  MeetingRecord,
  ReviewState,
} from "@/lib/types";

export type SummaryTemplate = "overview" | "project-update";

export interface SavedMoment {
  id: string;
  meetingId: string;
  meetingTitle: string;
  label: string;
  startSeconds: number;
  endSeconds: number;
  createdAt: string;
  shared: boolean;
  sharePath?: string;
}

export interface AiDraftAction {
  title: string;
  owner: string | null;
  due: string | null;
  condition: string | null;
  recipient: string | null;
  sourceSegmentId: string | null;
  sourceNote: string;
}

export interface AiDraftInsight {
  kind: InsightKind;
  title: string;
  detail: string | null;
  previousValue: string | null;
  currentValue: string | null;
  sourceSegmentId: string | null;
  sourceNote: string;
}

export interface AiDraft {
  generatedAt: string;
  model: string;
  summary: string[];
  actions: AiDraftAction[];
  insights?: AiDraftInsight[];
}

export interface AiSummaryDraft {
  format: SummaryTemplate;
  generatedAt: string;
  model: string;
  insights: AiDraftInsight[];
}

type ActionOverride = Partial<
  Pick<ActionFact, "title" | "owner" | "due" | "condition" | "recipient" | "reviewState" | "completed">
> & { beforeDismiss?: ReviewState };

type InsightOverride = Partial<Pick<MeetingInsight, "reviewState">> & { beforeDismiss?: ReviewState };

export interface PersistedMeetingState {
  actionOverrides: Record<string, ActionOverride>;
  insightOverrides: Record<string, InsightOverride>;
  moments: SavedMoment[];
  summaryTemplate: SummaryTemplate;
  summaryDrafts: Partial<Record<SummaryTemplate, AiSummaryDraft>>;
  aiDraft: AiDraft | null;
}

export interface AccordState {
  version: 1;
  meetings: Record<string, PersistedMeetingState>;
}

const STORAGE_KEY = "accord:review:v1";
const STATE_EVENT = "accord:state";

export function blankMeetingState(): PersistedMeetingState {
  return {
    actionOverrides: {},
    insightOverrides: {},
    moments: [],
    summaryTemplate: "overview",
    summaryDrafts: {},
    aiDraft: null,
  };
}

export function readAccordState(): AccordState {
  if (typeof window === "undefined") return { version: 1, meetings: {} };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, meetings: {} };
    const parsed = JSON.parse(raw) as AccordState;
    if (parsed.version !== 1 || !parsed.meetings) return { version: 1, meetings: {} };
    for (const state of Object.values(parsed.meetings)) {
      state.summaryTemplate = state.summaryTemplate === "project-update" ? "project-update" : "overview";
      if (!state.summaryDrafts || typeof state.summaryDrafts !== "object" || Array.isArray(state.summaryDrafts)) state.summaryDrafts = {};
    }
    return parsed;
  } catch {
    return { version: 1, meetings: {} };
  }
}

function writeMeetingState(meetingId: string, state: PersistedMeetingState) {
  const accord = readAccordState();
  accord.meetings[meetingId] = state;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accord));
  window.dispatchEvent(new Event(STATE_EVENT));
}

export function subscribeAccordState(listener: () => void) {
  window.addEventListener(STATE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(STATE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function clipHref(moment: SavedMoment) {
  if (moment.sharePath?.startsWith("/share/")) return moment.sharePath;
  const params = new URLSearchParams({
    start: moment.startSeconds.toFixed(3),
    end: moment.endSeconds.toFixed(3),
    label: moment.label,
  });
  return `/clips/${moment.meetingId}?${params.toString()}`;
}

export function aiInsightId(meetingId: string, draft: AiDraft, index: number) {
  return `ai-insight:${meetingId}:${draft.generatedAt}:${index}`;
}

function sourceStart(meeting: MeetingRecord, segmentId: string | null) {
  if (!segmentId) return null;
  return meeting.transcript.find((segment) => segment.id === segmentId)?.startSeconds ?? null;
}

/** Save the result to its requested format, even if another format is now selected. */
export function withSummaryDraft(state: PersistedMeetingState, meetingId: string, format: SummaryTemplate, draft: AiSummaryDraft): PersistedMeetingState {
  if (draft.format !== format) throw new Error("The summary format does not match the request.");
  return {
    ...state,
    summaryDrafts: { ...state.summaryDrafts, [format]: draft },
    insightOverrides: Object.fromEntries(Object.entries(state.insightOverrides)
      .filter(([id]) => !id.startsWith(`ai-summary:${meetingId}:${format}:`))),
  };
}

export function resolveSummaryInsights(meeting: MeetingRecord, state: PersistedMeetingState): MeetingInsight[] {
  const draft = state.summaryDrafts[state.summaryTemplate];
  if (!draft) return [];
  return draft.insights.map((insight, index) => {
    const id = aiSummaryInsightId(meeting.id, draft, index);
    return {
      id, ...insight, reviewState: "needs-review", origin: "ai",
      sourceStartSeconds: sourceStart(meeting, insight.sourceSegmentId),
      aiGeneratedAt: draft.generatedAt,
      ...(state.insightOverrides[id] ?? {}),
    };
  });
}

export function resolveMeetingActions(meeting: MeetingRecord, state: PersistedMeetingState): ActionFact[] {
  if (!state.aiDraft) return meeting.actions.map((action) => ({
    ...action,
    origin: action.origin ?? "source",
    completed: action.completed ?? false,
    ...(state.actionOverrides[action.id] ?? {}),
  }));

  return state.aiDraft.actions.map((action, index) => {
    const id = aiActionId(meeting.id, state.aiDraft!, index);
    return {
      id, title: action.title, owner: action.owner, due: action.due,
      condition: action.condition, recipient: action.recipient,
      reviewState: "needs-review", completed: false,
      sourceStartSeconds: sourceStart(meeting, action.sourceSegmentId),
      sourceNote: action.sourceNote, origin: "ai", aiGeneratedAt: state.aiDraft!.generatedAt,
      ...(state.actionOverrides[id] ?? {}),
    };
  });
}

export function useMeetingState(meeting: MeetingRecord) {
  const privateRecording = meeting.sourceKind === "recording";
  const [state, setState] = useState<PersistedMeetingState>(() => meeting.initialReviewState ?? blankMeetingState());
  const [hydrated, setHydrated] = useState(privateRecording);
  const [storageError, setStorageError] = useState<string | null>(null);
  const currentState = useRef(state);
  const storageFailed = useRef(false);
  const pendingSave = useRef<Promise<void>>(Promise.resolve());

  const savePrivate = useCallback((next: PersistedMeetingState) => {
    const work = pendingSave.current.catch(() => undefined).then(async () => {
      const response = await fetch(`/api/recordings/${meeting.id}/state`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: next }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Changes could not be saved. Keep this page open and select Retry save.");
      setStorageError(null);
      window.dispatchEvent(new Event(STATE_EVENT));
    });
    pendingSave.current = work;
    void work.catch((error) => setStorageError(error instanceof Error ? error.message : "Changes could not be saved."));
    return work;
  }, [meeting.id]);

  useEffect(() => {
    if (privateRecording) return;
    const refresh = () => {
      const stored = readAccordState().meetings[meeting.id];
      currentState.current = stored ? { ...blankMeetingState(), ...stored } : blankMeetingState();
      setState(currentState.current);
      setHydrated(true);
    };
    refresh();
    return subscribeAccordState(refresh);
  }, [meeting.id, privateRecording]);

  const updateState = useCallback((update: (current: PersistedMeetingState) => PersistedMeetingState) => {
    if (privateRecording) {
      const next = update(currentState.current);
      currentState.current = next; setState(next);
      void savePrivate(next);
      return;
    }
    const stored = readAccordState().meetings[meeting.id];
    const current = storageFailed.current ? currentState.current : { ...blankMeetingState(), ...stored };
    const next = update(current);
    currentState.current = next;
    setState(next);
    try {
      writeMeetingState(meeting.id, next);
      storageFailed.current = false;
      setStorageError(null);
    } catch {
      storageFailed.current = true;
      setStorageError("This browser could not save your changes. Keep this page open and allow browser storage.");
    }
  }, [meeting.id, privateRecording, savePrivate]);

  const actions = useMemo(() => resolveMeetingActions(meeting, state), [meeting, state]);

  const insights = useMemo(() => resolveSummaryInsights(meeting, state), [meeting, state]);
  const setSummaryDraft = useCallback((format: SummaryTemplate, draft: AiSummaryDraft) =>
    updateState((current) => withSummaryDraft(current, meeting.id, format, draft)), [meeting.id, updateState]);

  const patchAction = (id: string, patch: ActionOverride) => {
    updateState((current) => ({
      ...current,
      actionOverrides: {
        ...current.actionOverrides,
        [id]: { ...(current.actionOverrides[id] ?? {}), ...patch },
      },
    }));
  };

  const setReviewState = (id: string, reviewState: ReviewState) => {
    const action = actions.find((item) => item.id === id);
    if (reviewState === "dismissed") patchAction(id, { reviewState, beforeDismiss: action?.reviewState ?? "needs-review" });
    else patchAction(id, { reviewState: action?.reviewState === "dismissed" && reviewState === "needs-review" ? state.actionOverrides[id]?.beforeDismiss ?? "needs-review" : reviewState });
  };

  const setInsightReviewState = (id: string, reviewState: ReviewState) => {
    const insight = insights.find((item) => item.id === id);
    updateState((current) => ({
      ...current,
      insightOverrides: {
        ...current.insightOverrides,
        [id]: {
          ...(current.insightOverrides[id] ?? {}),
          ...(reviewState === "dismissed" ? { beforeDismiss: insight?.reviewState ?? "needs-review" } : {}),
          reviewState: insight?.reviewState === "dismissed" && reviewState === "needs-review" ? current.insightOverrides[id]?.beforeDismiss ?? "needs-review" : reviewState,
        },
      },
    }));
  };

  const saveMoment = (moment: Omit<SavedMoment, "id" | "createdAt" | "shared">) => {
    const saved: SavedMoment = {
      ...moment,
      id: `${meeting.id}-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      shared: false,
    };
    updateState((current) => ({ ...current, moments: [saved, ...current.moments] }));
    return saved;
  };

  const setMomentShared = (id: string, shared: boolean) => {
    updateState((current) => ({
      ...current,
      moments: current.moments.map((moment) => (moment.id === id ? { ...moment, shared } : moment)),
    }));
  };

  const shareMoment = async (id: string): Promise<string> => {
    const moment = currentState.current.moments.find((item) => item.id === id);
    if (!moment) throw new Error("The moment was removed.");
    if (!privateRecording) { setMomentShared(id, true); return clipHref(moment); }
    await pendingSave.current;
    const response = await fetch(`/api/recordings/${meeting.id}/share`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moment }) });
    const payload = await response.json();
    if (!response.ok || !payload.sharePath) throw new Error(payload.error || "The clip could not be created. Try again.");
    updateState((current) => ({ ...current, moments: current.moments.map((item) => item.id === id ? { ...item, shared: true, sharePath: payload.sharePath } : item) }));
    return payload.sharePath;
  };

  const removeMoment = (id: string) => {
    updateState((current) => ({
      ...current,
      moments: current.moments.filter((moment) => moment.id !== id),
    }));
  };

  return {
    actions,
    insights,
    hydrated,
    storageError,
    retrySave: () => { if (privateRecording) void savePrivate(currentState.current); },
    moments: state.moments,
    summaryTemplate: state.summaryTemplate,
    summaryDrafts: state.summaryDrafts,
    summaryDraft: state.summaryDrafts[state.summaryTemplate] ?? null,
    setSummaryDraft,
    aiDraft: state.aiDraft,
    patchAction,
    setReviewState,
    setCompleted: (id: string, completed: boolean) => patchAction(id, { completed }),
    setInsightReviewState,
    saveMoment,
    setMomentShared,
    shareMoment,
    removeMoment,
    restoreMoment: (moment: SavedMoment) => updateState((current) => ({
      ...current,
      moments: [moment, ...current.moments.filter((item) => item.id !== moment.id)],
    })),
    editMoment: (id: string, patch: Pick<SavedMoment, "label" | "startSeconds" | "endSeconds">) =>
      updateState((current) => ({ ...current, moments: current.moments.map((moment) => moment.id === id ? { ...moment, ...patch, shared: false, sharePath: undefined } : moment) })),
    setSummaryTemplate: (summaryTemplate: SummaryTemplate) =>
      updateState((current) => ({ ...current, summaryTemplate })),
    setAiDraft: (aiDraft: AiDraft | null) =>
      updateState((current) => ({
        ...current,
        aiDraft,
        actionOverrides: Object.fromEntries(
          Object.entries(current.actionOverrides).filter(([id]) => !id.startsWith(`ai-action:${meeting.id}:`))
        ),
        insightOverrides: Object.fromEntries(
          Object.entries(current.insightOverrides).filter(([id]) => !id.startsWith(`ai-insight:${meeting.id}:`))
        ),
      })),
  };
}
