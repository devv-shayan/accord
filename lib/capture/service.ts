import { randomUUID } from "node:crypto";
import { HttpError } from "./auth";
import { MAX_CHUNK_BYTES, MAX_CHUNKS, MAX_DURATION_SECONDS, MAX_RECORDING_BYTES } from "./config";
import { digest } from "./crypto";
import { meetAddress } from "./calendar";
import { listDocuments, loadBlob, readDocument, saveBlob, withLock, writeDocument } from "./store";
import type { CaptureSession, CaptureUser, UploadChunk } from "./types";

export const audioTypes = new Set(["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"]);
function cleanText(value: unknown, fallback: string, max = 160) { return typeof value === "string" ? value.trim().slice(0, max) || fallback : fallback; }
export async function ownedCapture(user: Pick<CaptureUser, "id">, id: string) {
  if (!/^rec-[a-f0-9-]{36}$/.test(id)) throw new HttpError(404, "Recording not found.");
  const stored = await readDocument<CaptureSession>("capture", id);
  if (!stored || stored.owner_id !== user.id) throw new HttpError(404, "Recording not found.");
  return stored.data;
}
export async function startCapture(user: CaptureUser, body: Record<string, unknown>) {
  const meetUrl = meetAddress(body.meetUrl);
  if (!meetUrl) throw new HttpError(400, "Open a Google Meet call to record it.");
  const mimeType = cleanText(body.mimeType, "audio/webm").split(";")[0];
  if (!audioTypes.has(mimeType)) throw new HttpError(400, "Choose a supported audio format.");
  const previous = await listDocuments<CaptureSession>("capture", user.id);
  if (previous.filter((item) => item.data.status === "recording" && Date.now() - Date.parse(item.data.createdAt) < 3 * 3600_000).length >= 3) {
    throw new HttpError(409, "Finish your current recordings before you start another.");
  }
  const session: CaptureSession = { id: `rec-${randomUUID()}`, ownerId: user.id, title: cleanText(body.title, "Google Meet"), meetUrl,
    createdAt: new Date().toISOString(), durationSeconds: 0, mimeType, status: "recording", chunkCount: null, participants: [], markers: [] };
  await writeDocument("capture", session.id, user.id, session);
  return session;
}
export async function captureChunks(capture: CaptureSession) {
  return (await listDocuments<UploadChunk>("chunk", capture.ownerId, { captureId: capture.id })).map((item) => item.data).sort((a, b) => a.index - b.index);
}
export function completeChunks(chunks: UploadChunk[], count: number) {
  return chunks.length === count && chunks.every((chunk, index) => chunk.index === index);
}
export async function uploadChunk(user: CaptureUser, id: string, index: number, bytes: Uint8Array) {
  if (!Number.isInteger(index) || index < 0 || index >= MAX_CHUNKS) throw new HttpError(400, "Invalid recording part.");
  if (!bytes.byteLength || bytes.byteLength > MAX_CHUNK_BYTES) throw new HttpError(413, "This recording part is too large.");
  return withLock(id, async () => {
    const capture = await ownedCapture(user, id);
    const chunkId = `${id}-${index}`;
    const hash = digest(bytes);
    const previous = await readDocument<UploadChunk>("chunk", chunkId);
    if (previous) {
      if (previous.data.hash !== hash) throw new HttpError(409, "This recording part already has different audio.");
      return { saved: true, duplicate: true };
    }
    if (capture.status !== "recording") throw new HttpError(409, "This recording is already saved.");
    const chunks = await captureChunks(capture);
    if (chunks.reduce((total, chunk) => total + chunk.bytes, 0) + bytes.byteLength > MAX_RECORDING_BYTES) throw new HttpError(413, "The recording has reached its size limit.");
    const blobPath = `${user.id}/${id}/chunks/${index}`;
    await saveBlob(blobPath, bytes, "application/octet-stream");
    await writeDocument("chunk", chunkId, user.id, { id: chunkId, captureId: id, index, path: blobPath, bytes: bytes.byteLength, hash } satisfies UploadChunk);
    return { saved: true, duplicate: false };
  });
}
export async function finishCapture(user: CaptureUser, id: string, body: Record<string, unknown>) {
  const count = body.chunkCount;
  const duration = body.durationSeconds;
  if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || count > MAX_CHUNKS || typeof duration !== "number" ||
      !Number.isFinite(duration) || duration < 0.5 || duration > MAX_DURATION_SECONDS + 10) throw new HttpError(400, "The recording length or part count is not valid.");
  return withLock(id, async () => {
    const capture = await ownedCapture(user, id);
    if (capture.status !== "recording") return capture;
    const chunks = await captureChunks(capture);
    if (!completeChunks(chunks, count)) throw new HttpError(409, "Some audio parts have not uploaded. Retry the upload.");
    const markers = Array.isArray(body.markers) ? body.markers.flatMap((item) => {
      if (!item || typeof item !== "object" || typeof item.seconds !== "number" || !Number.isFinite(item.seconds) || item.seconds < 0 || item.seconds > duration) return [];
      return [{ seconds: item.seconds, label: cleanText(item.label, "Marked during call", 120) }];
    }).slice(0, 100) : [];
    const next: CaptureSession = { ...capture, chunkCount: count, durationSeconds: duration, status: "queued", markers,
      participants: Array.isArray(body.participants) ? body.participants.filter((name): name is string => typeof name === "string").map((name) => name.slice(0, 100)).slice(0, 100) : [] };
    await writeDocument("capture", id, user.id, next);
    return next;
  });
}
export async function assembleAudio(capture: CaptureSession) {
  const chunks = await captureChunks(capture);
  if (!capture.chunkCount || !completeChunks(chunks, capture.chunkCount)) throw new Error("Audio parts are incomplete.");
  const parts: Buffer[] = [];
  for (const chunk of chunks) {
    const bytes = await loadBlob(chunk.path);
    if (digest(bytes) !== chunk.hash) throw new Error("An audio part is damaged.");
    parts.push(bytes);
  }
  return Buffer.concat(parts);
}
export function publicCapture(capture: CaptureSession) {
  return { id: capture.id, title: capture.title, meetUrl: capture.meetUrl, createdAt: capture.createdAt, durationSeconds: capture.durationSeconds,
    status: capture.status, error: capture.error, processingStartedAt: capture.processingStartedAt, participantCount: capture.participants.length };
}
