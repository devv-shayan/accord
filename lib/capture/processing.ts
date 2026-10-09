import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { MeetingRecord } from "@/lib/types";
import type { PersistedMeetingState } from "@/lib/client-state";
import { generateMeetingDraft } from "@/lib/ai-draft";
import { audioDuration, normalizeAudio } from "./audio";
import { MAX_DURATION_SECONDS } from "./config";
import { assembleAudio } from "./service";
import { listDocuments, loadBlob, readDocument, saveBlob, withLock, writeDocument } from "./store";
import { transcribeAudio } from "./transcription";
import type { CaptureSession } from "./types";

export async function processCapture(id: string) {
  const lease = randomUUID();
  const claimed = await withLock(id, async () => {
    const stored = await readDocument<CaptureSession>("capture", id);
    if (!stored || stored.data.status === "ready" || stored.data.status === "recording") return null;
    if (["transcribing", "summarizing"].includes(stored.data.status) && Date.now() - Date.parse(stored.data.processingStartedAt || "") < 10 * 60_000) return null;
    const next: CaptureSession = { ...stored.data, status: "transcribing", error: undefined, processingStartedAt: new Date().toISOString(), lease };
    await writeDocument("capture", id, stored.owner_id, next);
    return next;
  });
  if (!claimed) return;
  const directory = await mkdtemp(path.join(os.tmpdir(), "accord-audio-"));
  const update = async (patch: Partial<CaptureSession>) => withLock(id, async () => {
    const current = await readDocument<CaptureSession>("capture", id);
    if (!current || current.data.lease !== lease) throw new Error("The recording job has been replaced.");
    const next = { ...current.data, ...patch };
    await writeDocument("capture", id, next.ownerId, next);
    return next;
  });
  try {
    const filename = path.join(directory, "recording.webm");
    if (claimed.audioPath) await writeFile(filename, await loadBlob(claimed.audioPath));
    else {
      const raw = path.join(directory, "raw-audio");
      await writeFile(raw, await assembleAudio(claimed));
      await normalizeAudio(raw, filename);
      await saveBlob(`${claimed.ownerId}/${id}/recording.webm`, await readFile(filename), "audio/webm");
      await update({ audioPath: `${claimed.ownerId}/${id}/recording.webm`, mimeType: "audio/webm" });
    }
    const duration = await audioDuration(filename);
    if (duration < 0.5 || duration > MAX_DURATION_SECONDS + 10) throw new Error("The audio file has an invalid duration.");
    const transcript = await transcribeAudio(filename, "audio/webm", duration, id);
    await update({ status: "summarizing", durationSeconds: duration });
    const speakers = [...new Set(transcript.map((segment) => segment.speakerLabel))];
    const draft = transcript.length ? await generateMeetingDraft({ title: claimed.title, sourceLabel: "Recorded from Google Meet", transcript }) :
      { generatedAt: new Date().toISOString(), model: "gemini-3.8-flash", summary: [], insights: [], actions: [] };
    const source = new Map(transcript.map((segment) => [segment.id, segment]));
    const record: MeetingRecord = { id, title: claimed.title, recordedDate: new Date(claimed.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
      durationSeconds: duration, durationLabel: `${Math.round(duration / 60) || 1} min`, description: draft.summary.join(" ") || "No speech was detected in this recording.",
      sourceKind: "recording", sourceLabel: "Google Meet recording · AI speaker labels and approximate audio times",
      audioSrc: `/api/recordings/${id}/audio`, transcriptTiming: "approximate", transcript, speakers, summary: draft.summary,
      insights: (draft.insights || []).map((note, index) => ({ ...note, id: `${id}-insight-${index}`, sourceStartSeconds: source.get(note.sourceSegmentId || "")?.startSeconds ?? null,
        reviewState: note.kind === "open-question" || note.kind === "proposal" ? "open" : "needs-review", origin: "ai", aiGeneratedAt: draft.generatedAt })),
      actions: draft.actions.map((action, index) => ({ ...action, id: `${id}-action-${index}`, sourceStartSeconds: source.get(action.sourceSegmentId || "")?.startSeconds ?? null,
        reviewState: "needs-review", origin: "ai", aiGeneratedAt: draft.generatedAt })), reviewCount: draft.actions.length + (draft.insights?.length || 0) };
    const reviewState: PersistedMeetingState = { actionOverrides: {}, insightOverrides: {}, summaryTemplate: "overview", aiDraft: null,
      summaryDrafts: { overview: { format: "overview", generatedAt: draft.generatedAt, model: draft.model, insights: draft.insights || [] } },
      moments: claimed.markers.map((marker, index) => ({ id: `${id}-mark-${index}`, meetingId: id, meetingTitle: claimed.title, label: marker.label,
        startSeconds: Math.max(0, Math.min(duration - 1, marker.seconds - 10)), endSeconds: Math.min(duration, marker.seconds + 20), createdAt: claimed.createdAt, shared: false })) };
    await update({ status: "ready", record, reviewState, error: undefined, lease: undefined });
  } catch (error) {
    console.error("Accord audio processing failed", error instanceof Error ? error.name : "Unknown error");
    await update({ status: "error", error: "The audio is saved. Transcript or notes could not finish. Retry processing.", lease: undefined }).catch(() => undefined);
  } finally { await rm(directory, { recursive: true, force: true }); }
}
export async function queuedCaptures() {
  const captures = await listDocuments<CaptureSession>("capture");
  return captures.map((item) => item.data).filter((capture) => capture.status === "queued" ||
    (["transcribing", "summarizing"].includes(capture.status) && Date.now() - Date.parse(capture.processingStartedAt || "") > 10 * 60_000));
}
