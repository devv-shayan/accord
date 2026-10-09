"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftIcon, CheckCheckIcon, ListTodoIcon, PlayIcon, SparklesIcon, TextIcon } from "lucide-react";
import { ActionList } from "@/components/action-list";
import { ActionReviewSheet } from "@/components/action-review-sheet";
import { MomentManager } from "@/components/moment-manager";
import { NotesExportControls } from "@/components/notes-export-controls";
import { PlaybackControls } from "@/components/playback-controls";
import { SummaryPane } from "@/components/summary-pane";
import { TranscriptPane } from "@/components/transcript-pane";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAudioPlayback } from "@/hooks/use-audio-playback";
import { useAiSummary } from "@/hooks/use-ai-summary";
import { useMeetingState, type AiDraft } from "@/lib/client-state";
import { formatTime } from "@/lib/format";
import { buildActionNotes } from "@/lib/meeting-notes";
import type { ActionFact, MeetingInsight, MeetingRecord } from "@/lib/types";

export function MeetingReview({ meeting, initialTime, initialQuery = "" }: { meeting: MeetingRecord; initialTime: number | null; initialQuery?: string }) {
  const review = useMeetingState(meeting);
  const { audioRef, playback } = useAudioPlayback({ src: meeting.audioSrc, duration: meeting.durationSeconds, initialTime: initialTime ?? 0 });
  const [tab, setTab] = useState(initialTime !== null || initialQuery ? "transcript" : meeting.insights.length ? "summary" : meeting.actions.length ? "actions" : "transcript");
  const summaryGeneration = useAiSummary({ meetingId: meeting.id, active: tab === "summary", hydrated: review.hydrated,
    format: review.summaryTemplate, drafts: review.summaryDrafts, onSave: review.setSummaryDraft });
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const generationRequest = useRef<AbortController | null>(null);
  useEffect(() => () => { generationRequest.current?.abort(); }, []);
  const selectedAction = review.actions.find((action) => action.id === selectedActionId);
  const selectedInsight = review.insights.find((insight) => insight.id === selectedInsightId);
  const editingAction = review.actions.find((action) => action.id === editingActionId) ?? null;
  const activeActions = review.actions.filter((action) => action.reviewState !== "dismissed");
  const completedCount = activeActions.filter((action) => action.completed && action.reviewState !== "open").length;
  const actionNotes = useMemo(() => buildActionNotes(meeting, review.actions), [meeting, review.actions]);
  const clearSelection = () => { setSelectedActionId(null); setSelectedInsightId(null); setSelectedTranscriptId(null); };
  const listenToInsight = (insight: MeetingInsight) => {
    clearSelection(); setSelectedInsightId(insight.id); setSelectedTranscriptId(insight.sourceSegmentId);
    if (insight.sourceStartSeconds !== null) playback.listenAt(insight.sourceStartSeconds);
  };
  const listenToAction = (action: ActionFact) => {
    clearSelection(); setSelectedActionId(action.id);
    if (action.sourceStartSeconds !== null) playback.listenAt(action.sourceStartSeconds);
  };
  const sourceTime = selectedAction?.sourceStartSeconds ?? selectedInsight?.sourceStartSeconds ?? playback.currentTime;
  const sourceSegment = (selectedAction || selectedInsight) && (selectedAction?.sourceStartSeconds ?? selectedInsight?.sourceStartSeconds) == null ? undefined :
    meeting.transcript.find((segment) => segment.id === selectedTranscriptId) ??
    meeting.transcript.find((segment) => segment.startSeconds !== null && segment.endSeconds !== null &&
      sourceTime >= segment.startSeconds && sourceTime < segment.endSeconds);
  const sourceNote = selectedAction?.sourceNote ?? selectedInsight?.sourceNote;
  const actionList = {
    actions: review.actions, onListen: listenToAction, onEdit: setEditingActionId,
    onComplete: review.setCompleted, onReview: review.setReviewState,
  };
  const generate = async () => {
    if (generationRequest.current) return;
    const controller = new AbortController();
    generationRequest.current = controller;
    setGenerating(true); setGenerationError(null);
    try {
      const response = await fetch("/api/ai/draft", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id }), signal: controller.signal,
      });
      const payload = await response.json() as { draft?: AiDraft; error?: string };
      if (!response.ok || !payload.draft) throw new Error(payload.error || "The draft could not load. Try again.");
      review.setAiDraft(payload.draft);
      clearSelection();
    } catch (error) {
      if (!controller.signal.aborted) setGenerationError(error instanceof Error ? error.message : "The draft could not load. Try again.");
    } finally {
      if (generationRequest.current === controller) { generationRequest.current = null; setGenerating(false); }
    }
  };
  const player = <PlaybackControls {...playback}
    start={playback.preview?.start} end={playback.preview?.end} clip={!!playback.preview}
    onSeek={(seconds) => { clearSelection(); playback.seek(seconds); }} onToggle={playback.toggle}
    onSpeed={playback.setPlaybackSpeed} onMute={playback.toggleMute} onRetry={playback.retry} />;
  return (
    <div className="min-h-svh">
      <audio ref={audioRef} src={meeting.audioSrc} preload="metadata" />
      <header className="border-b border-border px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/meetings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" aria-hidden="true" />Back to meetings
        </Link>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">{meeting.title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{meeting.recordedDate} · {meeting.durationLabel} · {meeting.speakers.length} {meeting.sourceKind === "controlled-test" ? "script roles" : meeting.sourceKind === "recording" ? "AI voice labels" : "speakers"}</p>
      </header>
      {review.storageError ? <Alert className="mx-4 mt-4 w-auto"><AlertTitle>Changes are not saved</AlertTitle><AlertDescription>{review.storageError}{meeting.sourceKind === "recording" ? <Button size="sm" variant="outline" onClick={review.retrySave}>Retry save</Button> : null}</AlertDescription></Alert> : null}
      <div className="px-4 pt-5 sm:px-6 lg:hidden">{player}</div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label="Meeting notes" className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
            <TabsList variant="line" className="w-full justify-start gap-0 sm:gap-2">
              <TabsTrigger value="summary"><SparklesIcon className="hidden sm:block" aria-hidden="true" />Summary</TabsTrigger>
              <TabsTrigger value="actions"><ListTodoIcon className="hidden sm:block" aria-hidden="true" />Action items {activeActions.length ? <span className="text-xs tabular-nums text-muted-foreground">{activeActions.length}</span> : null}</TabsTrigger>
              <TabsTrigger value="transcript"><TextIcon className="hidden sm:block" aria-hidden="true" />Transcript</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="pt-5">
              <SummaryPane meeting={meeting} insights={review.insights} template={review.summaryTemplate}
                onTemplateChange={(format) => { clearSelection(); review.setSummaryTemplate(format); }} draft={review.summaryDraft} onListen={listenToInsight}
                onInsightReviewState={review.setInsightReviewState} generating={summaryGeneration.generating} generationError={summaryGeneration.error}
                onGenerate={summaryGeneration.generate} onCancelGeneration={summaryGeneration.cancel} />
            </TabsContent>
            <TabsContent value="actions" className="pt-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold">Action items</h2>
                  {completedCount ? <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCheckIcon className="size-4" aria-hidden="true" />{completedCount} completed</span> : null}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <NotesExportControls content={actionNotes} fileName={`${meeting.id}-actions.md`} kind="actions" />
                  <Button variant="outline" size="sm" disabled={generating} onClick={() => void generate()}><SparklesIcon data-icon="inline-start" aria-hidden="true" />{generating ? "Generating…" : review.aiDraft ? "Regenerate action items" : "Generate action items"}</Button>
                </div>
              </div>
              {generating ? <Alert className="mb-4" role="status"><AlertTitle>Generating action items</AlertTitle><AlertDescription>You can use the other tabs while Gemini prepares the tasks.<Button size="sm" variant="ghost" onClick={() => generationRequest.current?.abort()}>Cancel</Button></AlertDescription></Alert> : null}
              {generationError ? <Alert className="mb-4"><AlertTitle>Action items unavailable</AlertTitle><AlertDescription>{generationError}</AlertDescription></Alert> : null}
              <ActionList {...actionList} />
            </TabsContent>
            <TabsContent value="transcript" className="pt-5">
              {meeting.transcriptTiming !== "exact" ? <p className="mb-5 text-xs leading-5 text-muted-foreground">
                {meeting.transcriptTiming === "approximate" ? "These transcript passages have approximate audio times. Listen to check each source." : "This transcript has no verified audio times."}
              </p> : null}
              <TranscriptPane initialQuery={initialQuery} segments={meeting.transcript} speakers={meeting.speakers} timing={meeting.transcriptTiming} currentTime={playback.currentTime}
                onSeek={(seconds, id) => { clearSelection(); setSelectedTranscriptId(id); playback.listenAt(seconds); }} />
            </TabsContent>
          </Tabs>
        </section>
        <aside className="border-t border-border bg-card/30 px-4 py-6 sm:px-6 lg:sticky lg:top-0 lg:max-h-svh lg:self-start lg:overflow-y-auto lg:border-t-0 lg:border-l lg:px-5">
          <div className="hidden lg:block">{player}</div>
          {playback.preview ? <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Preview {formatTime(playback.preview.start)}–{formatTime(playback.preview.end)}</span>
            <Button size="xs" variant="ghost" onClick={playback.clearPreview}>Full recording</Button>
          </div> : null}
          <section className="mt-6 border-b border-border pb-6">
            <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Source</h2>
              {sourceSegment?.startSeconds !== null && sourceSegment?.startSeconds !== undefined ? <span className="font-mono text-xs text-muted-foreground">{meeting.transcriptTiming === "approximate" ? "≈ " : ""}{formatTime(sourceSegment.startSeconds)}</span> : null}
            </div>
            {sourceSegment ? <>
              <p className="mt-3 text-xs font-medium text-primary">{sourceSegment.speakerLabel}</p>
              <blockquote className="mt-2 text-sm leading-6 text-foreground/90">{sourceSegment.text}</blockquote>
            </> : <p className="mt-3 text-sm leading-6 text-muted-foreground">{sourceNote || "Select a note or transcript passage to hear its source."}</p>}
            {(selectedAction || selectedInsight || sourceSegment) && meeting.transcriptTiming !== "unverified" ? <div className="mt-4 flex flex-wrap gap-2">
              {sourceSegment ? <Button size="sm" variant="outline" onClick={() => playback.listenAt(sourceSegment.startSeconds ?? sourceTime)}><PlayIcon aria-hidden="true" />Listen again</Button> : null}
              <Button size="sm" variant="ghost" onClick={() => { setTab("transcript"); }}>View transcript</Button>
            </div> : null}
          </section>
          <div className="mt-6"><MomentManager meetingId={meeting.id} meetingTitle={meeting.title} duration={playback.duration} currentTime={playback.currentTime}
            moments={review.moments} onSave={review.saveMoment} onEdit={review.editMoment} onRestore={review.restoreMoment}
            onPreview={(start, end) => { clearSelection(); playback.listenRange(start, end); }} onShare={review.shareMoment} onRemove={review.removeMoment} /></div>
          <p className="mt-7 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">{meeting.sourceLabel}</p>
          {meeting.attribution ? <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{meeting.attribution}</p> : null}
        </aside>
      </div>
      <ActionReviewSheet action={editingAction} open={editingAction !== null} onOpenChange={(open) => { if (!open) setEditingActionId(null); }} onSave={review.patchAction} />
    </div>
  );
}
