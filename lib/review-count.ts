import type { AiDraft, AiSummaryDraft, PersistedMeetingState } from "./client-state";
import type { MeetingCatalogItem } from "./types";

export function aiActionId(meetingId: string, draft: AiDraft, index: number) {
  return `ai-action:${meetingId}:${draft.generatedAt}:${index}`;
}

export function aiSummaryInsightId(meetingId: string, draft: AiSummaryDraft, index: number) {
  return `ai-summary:${meetingId}:${draft.format}:${draft.generatedAt}:${index}`;
}

/** Count the same active summary and task revisions that the meeting page shows. */
export function meetingReviewCount(meeting: Pick<MeetingCatalogItem, "id" | "actionStates">, saved?: PersistedMeetingState) {
  const draft = saved?.aiDraft;
  const actions = draft
    ? draft.actions.map((_, index) => saved?.actionOverrides[aiActionId(meeting.id, draft, index)]?.reviewState ?? "needs-review")
    : meeting.actionStates.map((action) => saved?.actionOverrides[action.id]?.reviewState ?? action.reviewState);
  const summary = saved?.summaryDrafts[saved.summaryTemplate];
  const insights = summary?.insights.map((_, index) => saved?.insightOverrides[aiSummaryInsightId(meeting.id, summary, index)]?.reviewState ?? "needs-review") ?? [];
  return [...actions, ...insights].filter((state) => state === "needs-review").length;
}
