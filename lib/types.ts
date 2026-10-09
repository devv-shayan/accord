export type ReviewState = "needs-review" | "accepted" | "open" | "dismissed";

export type TranscriptTiming = "exact" | "approximate" | "unverified";

export type InsightKind =
  | "fact"
  | "correction"
  | "decision"
  | "condition"
  | "rejection"
  | "open-question"
  | "proposal";

export interface TranscriptSegment {
  id: string;
  startSeconds: number | null;
  endSeconds: number | null;
  speakerId: string | null;
  speakerLabel: string;
  text: string;
}

export interface ActionFact {
  id: string;
  title: string;
  owner: string | null;
  due: string | null;
  condition: string | null;
  recipient: string | null;
  reviewState: ReviewState;
  completed?: boolean;
  sourceStartSeconds: number | null;
  sourceNote: string;
  origin?: "source" | "ai";
  aiGeneratedAt?: string;
}

export interface MeetingInsight {
  id: string;
  kind: InsightKind;
  title: string;
  detail: string | null;
  previousValue: string | null;
  currentValue: string | null;
  reviewState: ReviewState;
  sourceSegmentId: string | null;
  sourceStartSeconds: number | null;
  sourceNote: string;
  origin?: "source" | "ai";
  aiGeneratedAt?: string;
}

export interface MeetingRecord {
  id: string;
  title: string;
  recordedDate: string;
  durationSeconds: number;
  durationLabel: string;
  description: string;
  sourceLabel: string;
  sourceKind: "public-reference" | "controlled-test" | "recording";
  audioSrc: string;
  transcriptTiming: TranscriptTiming;
  speakers: string[];
  transcript: TranscriptSegment[];
  summary: string[];
  insights: MeetingInsight[];
  actions: ActionFact[];
  reviewCount: number;
  attribution?: string;
  initialReviewState?: import("./client-state").PersistedMeetingState;
}

export interface MeetingCatalogItem {
  id: string;
  title: string;
  recordedDate: string;
  durationLabel: string;
  description: string;
  sourceLabel: string;
  sourceKind: MeetingRecord["sourceKind"];
  speakerCount: number;
  transcriptCount: number;
  reviewCount: number;
  transcriptTiming: TranscriptTiming;
  actionStates: Array<{ id: string; reviewState: ReviewState }>;
  insightStates: Array<{ id: string; reviewState: ReviewState }>;
}
