import { getMeeting, getMeetingCatalog } from "@/lib/meeting-data";
import type { MeetingRecord, MeetingCatalogItem } from "@/lib/types";
import { meetingReviewCount } from "@/lib/review-count";
import { listDocuments, readDocument } from "./store";
import type { CaptureSession, CaptureUser } from "./types";

export async function accessibleMeeting(id: string, user: CaptureUser | null): Promise<MeetingRecord | null> {
  const example = getMeeting(id);
  if (example) return example;
  if (!user || !/^rec-[a-f0-9-]{36}$/.test(id)) return null;
  const capture = await readDocument<CaptureSession>("capture", id);
  if (!capture || capture.owner_id !== user.id || !capture.data.record) return null;
  return { ...capture.data.record, initialReviewState: capture.data.reviewState };
}
export async function userCaptures(user: CaptureUser | null) {
  return user ? (await listDocuments<CaptureSession>("capture", user.id)).map((item) => item.data).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
}
export async function meetingCatalog(user: CaptureUser | null): Promise<MeetingCatalogItem[]> {
  const captures = await userCaptures(user);
  return [...captures.flatMap((capture) => capture.record ? [{ id: capture.id, title: capture.title, recordedDate: capture.record.recordedDate,
    durationLabel: capture.record.durationLabel, description: capture.record.description, sourceKind: "recording" as const,
    sourceLabel: capture.record.sourceLabel, speakerCount: capture.record.speakers.length, transcriptCount: capture.record.transcript.length,
    reviewCount: meetingReviewCount({ id: capture.id, actionStates: capture.record.actions }, capture.reviewState), transcriptTiming: capture.record.transcriptTiming,
    actionStates: capture.record.actions.map(({ id, reviewState }) => ({ id, reviewState })),
    insightStates: capture.record.insights.map(({ id, reviewState }) => ({ id, reviewState })) }] : []), ...getMeetingCatalog()];
}
