import type { AiDraftAction, AiDraftInsight } from "@/lib/client-state";
import type { InsightKind, TranscriptSegment } from "@/lib/types";

const kinds = new Set<InsightKind>(["fact", "correction", "decision", "condition", "rejection", "open-question", "proposal"]);

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid draft item.");
  return value as Record<string, unknown>;
}

function text(value: unknown, required = false): string {
  if (typeof value !== "string" || (required && !value.trim())) throw new Error("Invalid draft text.");
  return value.trim();
}

function nullableText(value: unknown): string | null {
  if (value === null) return null;
  return text(value) || null;
}

/** A model reference can select a supplied passage. It cannot create a new audio anchor. */
export function validateAiDraft(value: unknown, transcript: TranscriptSegment[]) {
  const draft = record(value);
  if (!Array.isArray(draft.summary) || !Array.isArray(draft.insights) || !Array.isArray(draft.actions)) {
    throw new Error("Invalid draft shape.");
  }
  const segmentIds = new Set(transcript.map((segment) => segment.id));
  const source = (item: Record<string, unknown>) => {
    const reference = nullableText(item.sourceSegmentId);
    const valid = reference !== null && segmentIds.has(reference);
    const note = text(item.sourceNote);
    return {
      sourceSegmentId: valid ? reference : null,
      sourceNote: reference && !valid ? `${note}${note ? " " : ""}The supplied source reference does not match this transcript.` : note,
    };
  };
  const insights: AiDraftInsight[] = draft.insights.map((value) => {
    const item = record(value);
    if (!kinds.has(item.kind as InsightKind)) throw new Error("Invalid insight kind.");
    return {
      kind: item.kind as InsightKind,
      title: text(item.title, true), detail: nullableText(item.detail),
      previousValue: nullableText(item.previousValue), currentValue: nullableText(item.currentValue),
      ...source(item),
    };
  });
  const actions: AiDraftAction[] = draft.actions.map((value) => {
    const item = record(value);
    return {
      title: text(item.title, true), owner: nullableText(item.owner), due: nullableText(item.due),
      condition: nullableText(item.condition), recipient: nullableText(item.recipient),
      ...source(item),
    };
  });
  return { summary: draft.summary.map((value) => text(value, true)), insights, actions };
}
