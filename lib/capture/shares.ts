import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import type { SavedMoment } from "@/lib/client-state";
import { HttpError } from "./auth";
import { cropAudio } from "./audio";
import { digest, opaqueToken } from "./crypto";
import { deleteDocument, listDocuments, loadBlob, readDocument, removeBlob, saveBlob, writeDocument } from "./store";
import type { CaptureSession } from "./types";

export interface SharedAudio { captureId: string; momentId: string; ownerId: string; audioPath: string; label: string; title: string; recordedDate: string; duration: number; expiresAt: number; }
export async function sharedAudio(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const stored = await readDocument<SharedAudio>("share", digest(token));
  if (!stored || stored.data.expiresAt <= Date.now()) return null;
  return stored.data;
}
export async function createShare(capture: CaptureSession, moment: SavedMoment) {
  if (!capture.audioPath || !capture.record) throw new HttpError(409, "Wait for this recording to finish processing.");
  if (moment.sharePath) {
    const previous = await sharedAudio(moment.sharePath.split("/").pop() || "");
    if (previous?.ownerId === capture.ownerId && previous.captureId === capture.id && previous.momentId === moment.id) return moment.sharePath;
  }
  const token = opaqueToken();
  const id = digest(token);
  const directory = await mkdtemp(path.join(os.tmpdir(), "accord-clip-"));
  const audioPath = `${capture.ownerId}/${capture.id}/clips/${id}.webm`;
  try {
    const input = path.join(directory, "recording.webm");
    const output = path.join(directory, "clip.webm");
    await writeFile(input, await loadBlob(capture.audioPath));
    await cropAudio(input, output, moment.startSeconds, moment.endSeconds);
    await saveBlob(audioPath, await readFile(output), "audio/webm");
    await writeDocument("share", id, capture.ownerId, { captureId: capture.id, momentId: moment.id, ownerId: capture.ownerId, audioPath,
      title: capture.title, label: moment.label, recordedDate: capture.record.recordedDate, duration: moment.endSeconds - moment.startSeconds,
      expiresAt: Date.now() + 7 * 86400_000 } satisfies SharedAudio);
    return `/share/${token}`;
  } finally { await rm(directory, { recursive: true, force: true }); }
}
export async function invalidateShares(capture: CaptureSession, moments: SavedMoment[]) {
  const shares = await listDocuments<SharedAudio>("share", capture.ownerId, { captureId: capture.id });
  for (const share of shares) {
    const old = capture.reviewState?.moments.find((moment) => moment.id === share.data.momentId);
    const next = moments.find((moment) => moment.id === share.data.momentId);
    if (!next || !old || old.startSeconds !== next.startSeconds || old.endSeconds !== next.endSeconds || old.label !== next.label) {
      await deleteDocument("share", share.id);
      await removeBlob(share.data.audioPath);
    }
  }
}
