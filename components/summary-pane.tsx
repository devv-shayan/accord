"use client";

import { useMemo } from "react";
import { ArrowRightIcon, CheckIcon, PlayIcon, SparklesIcon, XIcon } from "lucide-react";
import { NotesExportControls } from "@/components/notes-export-controls";
import { LocalTime } from "@/components/local-time";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AiSummaryDraft, SummaryTemplate } from "@/lib/client-state";
import { formatTime } from "@/lib/format";
import { buildMeetingNotes, outcomeGroups, summaryFormats } from "@/lib/meeting-notes";
import type { MeetingInsight, MeetingRecord, ReviewState } from "@/lib/types";

interface SummaryPaneProps {
  meeting: MeetingRecord;
  insights: MeetingInsight[];
  template: SummaryTemplate;
  onTemplateChange: (template: SummaryTemplate) => void;
  draft: AiSummaryDraft | null;
  onListen: (insight: MeetingInsight) => void;
  onInsightReviewState: (id: string, reviewState: ReviewState) => void;
  generating: boolean;
  generationError: string | null;
  onGenerate: () => void;
  onCancelGeneration: () => void;
}

function InsightRow({ insight, meeting, onListen, onReview }: {
  insight: MeetingInsight; meeting: MeetingRecord;
  onListen: SummaryPaneProps["onListen"]; onReview: SummaryPaneProps["onInsightReviewState"];
}) {
  const canListen = insight.sourceStartSeconds !== null && meeting.transcriptTiming !== "unverified";
  return (
    <div className="group flex items-start gap-2 border-b border-border py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <button type="button" className="source-row w-full text-left"
          onClick={() => onListen(insight)} aria-label={`${canListen ? "Listen to" : "Check"} source for ${insight.title}`}>
          <span className="block text-[15px] font-medium leading-6">{insight.title}</span>
          {insight.detail ? <span className="mt-1 block text-sm leading-6 text-muted-foreground">{insight.detail}</span> : null}
          {insight.previousValue && insight.currentValue ? (
            <span className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground line-through">{insight.previousValue}</span>
              <ArrowRightIcon className="size-3.5 text-primary" aria-hidden="true" />
              <span className="font-medium text-primary">{insight.currentValue}</span>
            </span>
          ) : null}
        </button>
        {!canListen ? <p className="mt-2 text-xs text-muted-foreground">Source not linked</p> : null}
        {canListen ? <button type="button" className="source-time mt-2" onClick={() => onListen(insight)}
          aria-label={`Play source at ${formatTime(insight.sourceStartSeconds!)}`}>
          <PlayIcon className="size-3 fill-current" aria-hidden="true" />
          {meeting.transcriptTiming === "approximate" ? "≈ " : ""}{formatTime(insight.sourceStartSeconds!)}
        </button> : null}
      </div>
      {insight.origin === "ai" ? <div className="flex shrink-0 gap-1">
        {insight.reviewState === "needs-review" ? <Button variant="ghost" size="icon-sm" aria-label={`Accept ${insight.title}`} onClick={() => onReview(insight.id, "accepted")}><CheckIcon aria-hidden="true" /></Button> : null}
        <Button variant="ghost" size="icon-sm" aria-label={`Dismiss ${insight.title}`} onClick={() => onReview(insight.id, "dismissed")}><XIcon aria-hidden="true" /></Button>
      </div> : null}
    </div>
  );
}

export function SummaryPane({ meeting, insights, template, onTemplateChange, draft, onListen,
  onInsightReviewState, generating, generationError, onGenerate, onCancelGeneration }: SummaryPaneProps) {
  const formatLabel = summaryFormats.find((item) => item.value === template)!.label;
  const waiting = generating || (!draft && !generationError);
  const groups = outcomeGroups(insights, template);
  const removed = insights.filter((insight) => insight.reviewState === "dismissed");
  const notes = useMemo(() => buildMeetingNotes(meeting, template, [], insights),
    [meeting, template, insights]);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <Select items={summaryFormats} value={template} onValueChange={(value) => { if (value) onTemplateChange(value as SummaryTemplate); }}>
          <SelectTrigger className="w-40" aria-label="Summary format"><SelectValue /></SelectTrigger>
          <SelectContent><SelectGroup>{summaryFormats.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
        <div className="flex flex-wrap items-center gap-1">
          <NotesExportControls key={`${template}:${draft?.generatedAt}`} disabled={!draft} content={notes} fileName={`${meeting.id}-${template}-notes.md`} kind="summary" />
          <Button variant="outline" size="sm" disabled={waiting} onClick={onGenerate}><SparklesIcon data-icon="inline-start" aria-hidden="true" />{waiting ? "Generating…" : generationError ? "Retry" : "Regenerate"}</Button>
        </div>
      </div>
      {waiting ? <Alert className="mt-4" role="status"><AlertTitle>Generating {formatLabel}</AlertTitle><AlertDescription>You can use the other tabs while Gemini prepares this summary.{generating ? <Button size="sm" variant="ghost" onClick={onCancelGeneration}>Cancel</Button> : null}</AlertDescription></Alert> : null}
      {generationError ? <Alert className="mt-4"><AlertTitle>{formatLabel} unavailable</AlertTitle><AlertDescription>{generationError}{draft ? " Your saved summary is shown below." : ""}</AlertDescription></Alert> : null}
      {draft ? <p className="mt-4 text-xs text-muted-foreground">Gemini summary · <LocalTime value={draft.generatedAt} /> · Select a note to hear its source.</p> : null}
      {!draft && waiting ? <div className="mt-7 space-y-6" aria-hidden="true">{[0, 1, 2].map((index) => <div key={index} className="space-y-3"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></div>)}</div> : null}
      {groups.length ? groups.map((group) => <section key={group.title} className="mt-7">
          <h2 className="border-b border-border pb-2 text-base font-semibold">{group.title}</h2>
          {group.items.map((insight) => <InsightRow key={insight.id} insight={insight} meeting={meeting} onListen={onListen} onReview={onInsightReviewState} />)}
        </section>) : draft ? <p className="mt-7 text-sm text-muted-foreground">{insights.length ? "No notes remain in this review." : "No summary notes were found in this transcript."}</p> : null
      }
      {removed.length ? <details className="mt-5 text-sm"><summary className="cursor-pointer text-muted-foreground">Removed notes ({removed.length})</summary>
        {removed.map((insight) => <div key={insight.id} className="mt-3 flex items-center justify-between gap-3"><span>{insight.title}</span><Button size="xs" variant="outline" onClick={() => onInsightReviewState(insight.id, "needs-review")}>Restore</Button></div>)}
      </details> : null}
    </div>
  );
}
