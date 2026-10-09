import type { ActionFact, MeetingInsight, MeetingRecord } from "@/lib/types";
import type { SummaryTemplate } from "@/lib/client-state";
import { formatTime } from "@/lib/format";

export const summaryFormats = [
  { value: "overview", label: "Outcome" },
  { value: "project-update", label: "Brief" },
];

export function actionLine(action: ActionFact) {
  const meta = [action.owner, action.due].filter(Boolean).join(" · ");
  return `${action.title}${meta ? ` · ${meta}` : ""}${action.recipient ? ` · To ${action.recipient}` : ""}${action.condition ? ` — ${action.condition}` : ""}`;
}

export function outcomeGroups(insights: MeetingInsight[], template: SummaryTemplate) {
  const visible = insights.filter((item) => item.reviewState !== "dismissed");
  if (template === "project-update") {
    return [
      { title: "Key points", items: visible.filter((item) => !["open-question", "proposal"].includes(item.kind)) },
      { title: "Still open", items: visible.filter((item) => ["open-question", "proposal"].includes(item.kind)) },
    ].filter((group) => group.items.length > 0);
  }
  return [
    { title: "What changed", items: visible.filter((item) => ["correction", "condition", "rejection"].includes(item.kind)) },
    { title: "Settled", items: visible.filter((item) => ["fact", "decision"].includes(item.kind)) },
    { title: "Still open", items: visible.filter((item) => ["open-question", "proposal"].includes(item.kind)) },
  ].filter((group) => group.items.length > 0);
}

export function buildMeetingNotes(meeting: MeetingRecord, template: SummaryTemplate, summary: string[], insights: MeetingInsight[]) {
  const groups = outcomeGroups(insights, template);
  const hasInsights = groups.some((group) => group.items.length > 0);
  const notes = [`# ${meeting.title}`, "", `${meeting.recordedDate} · ${meeting.durationLabel}`, `Format: ${summaryFormats.find((item) => item.value === template)?.label}`, ""];
  if (hasInsights) {
    for (const group of groups) {
      notes.push(`## ${group.title}`, ...group.items.map((item) => {
        const change = item.previousValue && item.currentValue ? ` (${item.previousValue} → ${item.currentValue})` : "";
        const time = item.sourceStartSeconds === null ? "" : ` [${formatTime(item.sourceStartSeconds)}${meeting.transcriptTiming === "approximate" ? ", approx." : ""}]`;
        return `- ${item.title}${change}${item.detail ? ` — ${item.detail}` : ""}${time}`;
      }), "");
    }
  } else if (!insights.length) notes.push("## Summary", ...(template === "project-update" ? summary.slice(0, 3) : summary).map((item) => `- ${item}`), "");
  else notes.push("No notes remain in this review.", "");
  notes.push(`Source: ${meeting.sourceLabel}`);
  if (meeting.attribution) notes.push(meeting.attribution);
  return notes.join("\n");
}

export function buildActionNotes(meeting: MeetingRecord, actions: ActionFact[]) {
  const notes = [`# ${meeting.title}`, "", `${meeting.recordedDate} · ${meeting.durationLabel}`, "Format: Action items", ""];
  const visibleActions = actions.filter((action) => action.reviewState !== "dismissed");
  const tasks = visibleActions.filter((action) => action.reviewState !== "open");
  const questions = visibleActions.filter((action) => action.reviewState === "open");
  notes.push("## Actions", ...(tasks.length ? tasks.map((action) => `- [${action.completed ? "x" : " "}] ${actionLine(action)}`) : ["No actions."]), "");
  if (questions.length) notes.push("## Open questions", ...questions.map((action) => `- ${actionLine(action)}`), "");
  notes.push(`Source: ${meeting.sourceLabel}`);
  if (meeting.attribution) notes.push(meeting.attribution);
  return notes.join("\n");
}
