import type { AiDraft, AiSummaryDraft, PersistedMeetingState, SavedMoment, SummaryTemplate } from "@/lib/client-state";
import type { TranscriptSegment } from "@/lib/types";
import { validateAiDraft } from "@/lib/validate-ai-draft";
import { HttpError } from "./auth";

const fail = () => new HttpError(400, "Invalid meeting changes.");
const reviewStates = new Set(["needs-review", "accepted", "open", "dismissed"]);
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw fail();
  return value as Record<string, unknown>;
}
function metadata(value: unknown) {
  const data = object(value);
  if (typeof data.model !== "string" || data.model.length > 160 || typeof data.generatedAt !== "string" ||
      data.generatedAt.length > 50 || !Number.isFinite(Date.parse(data.generatedAt))) throw fail();
  return { model: data.model, generatedAt: data.generatedAt };
}
function overrides(value: unknown, actions: boolean) {
  const entries = Object.entries(object(value));
  if (entries.length > 512) throw fail();
  return Object.fromEntries(entries.map(([id, value]) => {
    if (!id || id.length > 240) throw fail();
    const item = object(value), result: Record<string, unknown> = {};
    for (const field of ["reviewState", "beforeDismiss"]) {
      if (item[field] !== undefined) {
        if (!reviewStates.has(item[field] as string)) throw fail();
        result[field] = item[field];
      }
    }
    if (actions) {
      for (const field of ["title", "owner", "due", "condition", "recipient"]) {
        const text = item[field];
        if (text === undefined) continue;
        if ((text === null && field === "title") || (text !== null && (typeof text !== "string" || text.length > 4000))) throw fail();
        result[field] = text;
      }
      if (item.completed !== undefined) {
        if (typeof item.completed !== "boolean") throw fail();
        result.completed = item.completed;
      }
    }
    return [id, result];
  }));
}
export function validReview(value: unknown, meetingId: string, duration: number, transcript: TranscriptSegment[] = []): PersistedMeetingState {
  try {
    const data = object(value);
    if (!["overview", "project-update"].includes(data.summaryTemplate as string) || !Array.isArray(data.moments) || data.moments.length > 100) throw fail();
    const moments = data.moments.map(moment => validateMoment(moment, meetingId, duration));
    if (new Set(moments.map(moment => moment.id)).size !== moments.length) throw fail();
    const summaryDrafts: PersistedMeetingState["summaryDrafts"] = {};
    for (const [format, value] of Object.entries(object(data.summaryDrafts))) {
      if (!["overview", "project-update"].includes(format)) throw fail();
      const draft = object(value);
      if (draft.format !== format || !Array.isArray(draft.insights) || draft.insights.length > 250) throw fail();
      summaryDrafts[format as SummaryTemplate] = { ...metadata(draft), format,
        insights: validateAiDraft({ summary: [], actions: [], insights: draft.insights }, transcript).insights } as AiSummaryDraft;
    }
    let aiDraft: AiDraft | null = null;
    if (data.aiDraft !== null) {
      const draft = object(data.aiDraft);
      if (!Array.isArray(draft.actions) || draft.actions.length > 250 || !Array.isArray(draft.summary) || draft.summary.length > 30 ||
          (draft.insights !== undefined && (!Array.isArray(draft.insights) || draft.insights.length > 250))) throw fail();
      aiDraft = { ...metadata(draft), ...validateAiDraft({ ...draft, insights: draft.insights ?? [] }, transcript) };
    }
    return { actionOverrides: overrides(data.actionOverrides, true), insightOverrides: overrides(data.insightOverrides, false),
      moments, summaryTemplate: data.summaryTemplate as SummaryTemplate, summaryDrafts, aiDraft } as PersistedMeetingState;
  } catch (error) { if (error instanceof HttpError) throw error; throw fail(); }
}
export function validateMoment(value: unknown, meetingId: string, duration: number): SavedMoment {
  const moment = value as SavedMoment;
  if (!moment || typeof moment.id !== "string" || !/^[A-Za-z0-9:_-]{1,160}$/.test(moment.id) || moment.meetingId !== meetingId ||
      typeof moment.meetingTitle !== "string" || moment.meetingTitle.length > 180 || typeof moment.createdAt !== "string" || moment.createdAt.length > 50 || !Number.isFinite(Date.parse(moment.createdAt)) ||
      typeof moment.shared !== "boolean" || typeof moment.label !== "string" || !moment.label.trim() || moment.label.length > 120 || typeof moment.startSeconds !== "number" || !Number.isFinite(moment.startSeconds) ||
      typeof moment.endSeconds !== "number" || !Number.isFinite(moment.endSeconds) || moment.startSeconds < 0 || moment.endSeconds - moment.startSeconds < 0.5 || moment.endSeconds > duration) {
    throw new HttpError(400, "Choose a valid moment within this recording.");
  }
  return moment;
}
