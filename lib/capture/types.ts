import type { MeetingRecord } from "@/lib/types";
import type { PersistedMeetingState } from "@/lib/client-state";

export type CaptureStatus = "recording" | "queued" | "transcribing" | "summarizing" | "ready" | "error";
export interface CaptureUser {
  id: string;
  name: string;
  email: string;
  googleSub?: string;
  googleConnectionId?: string;
  local: boolean;
  googleTokens?: string;
  calendarConnected: boolean;
  calendarNeedsReconnect?: boolean;
}
export interface CaptureSession {
  id: string;
  ownerId: string;
  title: string;
  meetUrl: string;
  createdAt: string;
  durationSeconds: number;
  mimeType: string;
  status: CaptureStatus;
  chunkCount: number | null;
  audioPath?: string;
  participants: string[];
  markers: Array<{ seconds: number; label: string }>;
  error?: string;
  processingStartedAt?: string;
  lease?: string;
  record?: MeetingRecord;
  reviewState?: PersistedMeetingState;
}
export interface UploadChunk {
  id: string;
  captureId: string;
  index: number;
  path: string;
  bytes: number;
  hash: string;
}
export interface CalendarMeeting {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  meetUrl: string;
  participants: string[];
}
export interface CaptureConnection {
  user: Pick<CaptureUser, "id" | "name" | "email" | "local" | "calendarConnected" | "calendarNeedsReconnect"> | null;
  googleConfigured: boolean;
  localMode: boolean;
  storage: "local" | "supabase";
  extensionConnected: boolean;
  storageReady: boolean;
  storageIssue: string | null;
}
