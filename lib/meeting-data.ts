import "server-only";

import icsiSource from "@/research/data/icsi-bmr007-transcript.json";
import type {
  ActionFact,
  MeetingCatalogItem,
  MeetingInsight,
  MeetingRecord,
  TranscriptSegment,
} from "@/lib/types";

type IcsiSpeaker = { id: string; label: string };
type IcsiTurn = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  speakerId?: string;
  text: string;
};

const icsiSpeakers = icsiSource.speakers as IcsiSpeaker[];
const icsiSpeakerLabels = new Map(icsiSpeakers.map((speaker) => [speaker.id, speaker.label]));

const icsiTranscript: TranscriptSegment[] = (icsiSource.turns as IcsiTurn[]).map((turn) => ({
  id: turn.id,
  startSeconds: turn.startSeconds,
  endSeconds: turn.endSeconds,
  speakerId: turn.speakerId ?? null,
  speakerLabel: turn.speakerId ? (icsiSpeakerLabels.get(turn.speakerId) ?? "Unknown speaker") : "Unassigned",
  text: turn.text,
}));

const cedarTranscript: TranscriptSegment[] = [
  {
    id: "cedar-accounts",
    startSeconds: 17.6,
    endSeconds: 33.4,
    speakerId: "omar",
    speakerLabel: "Omar",
    text: "We have one hundred and twenty test accounts. Sorry, that number is wrong. We have one hundred and two test accounts. Twenty of those accounts belong to the Cedar team.",
  },
  {
    id: "cedar-layout",
    startSeconds: 33.4,
    endSeconds: 51.6,
    speakerId: "sara",
    speakerLabel: "Sara",
    text: "Two people could not find the action items. I recommend moving action items above the full transcript. This is a recommendation. We have not agreed to that change.",
  },
  {
    id: "cedar-launch-condition",
    startSeconds: 68.8,
    endSeconds: 78.9,
    speakerId: "omar",
    speakerLabel: "Omar",
    text: "We could, but only if the security team gives written approval by Thursday, October eighth, at five PM. Without approval, we must keep the pilot closed.",
  },
  {
    id: "cedar-checklist-owner",
    startSeconds: 102.2,
    endSeconds: 112.9,
    speakerId: "sara",
    speakerLabel: "Sara",
    text: "Please change the owner of that task. I already have the latest checklist. I will send it, and Ben will not send it.",
  },
  {
    id: "cedar-retry-fix",
    startSeconds: 119.2,
    endSeconds: 132.8,
    speakerId: "omar",
    speakerLabel: "Omar",
    text: "There is still a retry bug. If an upload fails twice, the third attempt can create a duplicate meeting. I will fix that bug and test three failed attempts. I will finish by Wednesday, October seventh, at four PM.",
  },
  {
    id: "cedar-budget-correction",
    startSeconds: 155.8,
    endSeconds: 172.5,
    speakerId: "maya",
    speakerLabel: "Maya",
    text: "Thank you. I said the wrong amount. The approved pilot budget cap is fifteen thousand US dollars. It is not fifteen hundred. This cap includes hosting and transcription. It excludes taxes.",
  },
  {
    id: "cedar-rejected-scope",
    startSeconds: 177.7,
    endSeconds: 187.6,
    speakerId: "maya",
    speakerLabel: "Maya",
    text: "No. We will not build the enterprise dashboard in this pilot. We also reject automatic emails to every meeting attendee.",
  },
  {
    id: "cedar-retention-source",
    startSeconds: 201.6,
    endSeconds: 216.4,
    speakerId: "maya",
    speakerLabel: "Maya",
    text: "Leave that question open. We have not selected a retention period. No person owns that decision yet. I will ask the security team for written pilot approval.",
  },
  {
    id: "cedar-checklist-final",
    startSeconds: 229.7,
    endSeconds: 235.4,
    speakerId: "maya",
    speakerLabel: "Maya",
    text: "Accepted. Sara remains the owner. Her final deadline is Thursday at eleven AM.",
  },
  {
    id: "cedar-call-imani",
    startSeconds: 235.4,
    endSeconds: 248.4,
    speakerId: "ben",
    speakerLabel: "Ben",
    text: "I will call Imani tomorrow, Wednesday, October seventh, at ten AM. I will ask whether Cedar needs a short clip link or a full meeting link. I will not promise either feature until we have the answer.",
  },
  {
    id: "cedar-quoted-test-data",
    startSeconds: 248.4,
    endSeconds: 262.6,
    speakerId: "omar",
    speakerLabel: "Omar",
    text: "The customer quoted an old message: Send the invoice today. That was a quotation from a previous project. Nobody in this meeting has agreed to send an invoice.",
  },
];

const cedarActions: ActionFact[] = [
  {
    id: "cedar-retry-fix",
    title: "Fix and test the duplicate-meeting retry bug",
    owner: "Omar",
    due: "7 Oct 2026 · 16:00 PKT",
    condition: null,
    recipient: null,
    reviewState: "accepted",
    sourceStartSeconds: 119.2,
    sourceNote: "Omar commits to fix and test the retry bug in the source recording.",
  },
  {
    id: "cedar-checklist",
    title: "Send the onboarding checklist",
    owner: "Sara",
    due: "8 Oct 2026 · 11:00 PKT",
    condition: null,
    recipient: "Cedar",
    reviewState: "accepted",
    sourceStartSeconds: 229.7,
    sourceNote: "Maya accepts Sara as owner and confirms the final Thursday 11 AM deadline.",
  },
  {
    id: "cedar-call-imani",
    title: "Call Imani about sharing needs",
    owner: "Ben",
    due: "7 Oct 2026 · 10:00 PKT",
    condition: "Do not promise either sharing feature until Cedar answers.",
    recipient: "Imani",
    reviewState: "needs-review",
    sourceStartSeconds: 235.4,
    sourceNote: "Ben commits to call Imani and states the condition in the source recording.",
  },
  {
    id: "cedar-retention",
    title: "Choose a recording retention period",
    owner: null,
    due: null,
    condition: "Security must review the choice.",
    recipient: null,
    reviewState: "open",
    sourceStartSeconds: 201.6,
    sourceNote: "Maya explicitly leaves recording retention unresolved and without an owner.",
  },
];

const mapleTranscript: TranscriptSegment[] = [
  {
    id: "maple-problem",
    startSeconds: 10.2,
    endSeconds: 17.4,
    speakerId: "ben",
    speakerLabel: "Ben",
    text: "Maple cannot find its invoice export. This is a Maple customer problem. It is not the closed Cedar note-export bug.",
  },
  {
    id: "maple-investigate",
    startSeconds: 17.4,
    endSeconds: 26.3,
    speakerId: "omar",
    speakerLabel: "Omar",
    text: "I will inspect the Maple invoice export by Thursday, October eighth, at three PM. I will report the cause before I promise a fix.",
  },
  {
    id: "maple-draft",
    startSeconds: 26.3,
    endSeconds: 34.8,
    speakerId: "sara",
    speakerLabel: "Sara",
    text: "I will send Ben the Maple help-page draft on Friday, October ninth, at noon. This task does not change my Cedar checklist deadline.",
  },
  {
    id: "maple-budget",
    startSeconds: 34.8,
    endSeconds: 43.6,
    speakerId: "maya",
    speakerLabel: "Maya",
    text: "We approve a separate Maple support budget cap of two thousand US dollars. The Cedar pilot budget remains fifteen thousand US dollars.",
  },
  {
    id: "maple-spanish",
    startSeconds: 43.6,
    endSeconds: 51.1,
    speakerId: "ben",
    speakerLabel: "Ben",
    text: "The customer asked for support in Spanish. We have not approved that request. It remains an open question, with no assigned owner.",
  },
];

const mapleActions: ActionFact[] = [
  {
    id: "maple-investigate",
    title: "Inspect the Maple invoice export",
    owner: "Omar",
    due: "8 Oct 2026 · 15:00 PKT",
    condition: "Report the cause before promising a fix.",
    recipient: "Maple",
    reviewState: "needs-review",
    sourceStartSeconds: 17.4,
    sourceNote: "Omar commits to inspect the Maple invoice export in the source recording.",
  },
  {
    id: "maple-draft",
    title: "Send the Maple help-page draft",
    owner: "Sara",
    due: "9 Oct 2026 · 12:00 PKT",
    condition: null,
    recipient: "Ben",
    reviewState: "needs-review",
    sourceStartSeconds: 26.3,
    sourceNote: "Sara commits to send Ben the Maple help-page draft in the source recording.",
  },
  {
    id: "maple-spanish",
    title: "Decide whether to offer Spanish support",
    owner: null,
    due: null,
    condition: "Request is not approved.",
    recipient: null,
    reviewState: "open",
    sourceStartSeconds: 43.6,
    sourceNote: "Ben states that Spanish support is unapproved and has no owner.",
  },
];

const cedarInsights: MeetingInsight[] = [
  {
    id: "cedar-insight-accounts",
    kind: "correction",
    title: "102 test accounts is the final count",
    detail: "20 of the 102 accounts belong to Cedar.",
    previousValue: "120 test accounts",
    currentValue: "102 test accounts",
    reviewState: "accepted",
    sourceSegmentId: "cedar-accounts",
    sourceStartSeconds: 17.6,
    sourceNote: "Omar corrects 120 to 102 in the same statement.",
  },
  {
    id: "cedar-insight-launch",
    kind: "condition",
    title: "9 Oct launch is conditional",
    detail: "Written security approval must arrive by 8 Oct at 17:00 PKT. Without it, the pilot stays closed.",
    previousValue: null,
    currentValue: "Conditional target: 9 Oct 2026",
    reviewState: "accepted",
    sourceSegmentId: "cedar-launch-condition",
    sourceStartSeconds: 68.8,
    sourceNote: "Omar states the security condition for the proposed launch.",
  },
  {
    id: "cedar-insight-budget",
    kind: "correction",
    title: "Pilot budget cap is USD 15,000",
    detail: "The cap includes hosting and transcription and excludes taxes.",
    previousValue: "USD 1,500",
    currentValue: "USD 15,000",
    reviewState: "accepted",
    sourceSegmentId: "cedar-budget-correction",
    sourceStartSeconds: 155.8,
    sourceNote: "Maya corrects the amount and approves the USD 15,000 cap.",
  },
  {
    id: "cedar-insight-scope",
    kind: "rejection",
    title: "Enterprise dashboard and automatic attendee emails are rejected",
    detail: "Neither feature is part of the Cedar pilot.",
    previousValue: null,
    currentValue: "Rejected for this pilot",
    reviewState: "accepted",
    sourceSegmentId: "cedar-rejected-scope",
    sourceStartSeconds: 177.7,
    sourceNote: "Maya explicitly rejects both scope additions.",
  },
  {
    id: "cedar-insight-retention",
    kind: "open-question",
    title: "Recording retention is still unresolved",
    detail: "No retention period or owner is selected yet.",
    previousValue: null,
    currentValue: null,
    reviewState: "open",
    sourceSegmentId: "cedar-retention-source",
    sourceStartSeconds: 201.6,
    sourceNote: "Maya leaves the retention question open with no owner.",
  },
  {
    id: "cedar-insight-layout",
    kind: "proposal",
    title: "Move action items above the transcript",
    detail: "Sara recommends the change, but the group does not approve it.",
    previousValue: null,
    currentValue: null,
    reviewState: "open",
    sourceSegmentId: "cedar-layout",
    sourceStartSeconds: 33.4,
    sourceNote: "Sara labels the layout change as a recommendation only.",
  },
];

const mapleInsights: MeetingInsight[] = [
  {
    id: "maple-insight-budget",
    kind: "decision",
    title: "Maple support cap is USD 2,000",
    detail: "This budget is separate from Cedar's USD 15,000 pilot cap.",
    previousValue: null,
    currentValue: "USD 2,000",
    reviewState: "accepted",
    sourceSegmentId: "maple-budget",
    sourceStartSeconds: 34.8,
    sourceNote: "Maya explicitly separates the Maple and Cedar budgets.",
  },
  {
    id: "maple-insight-spanish",
    kind: "open-question",
    title: "Spanish support is not approved",
    detail: "The request remains open and has no assigned owner.",
    previousValue: null,
    currentValue: null,
    reviewState: "open",
    sourceSegmentId: "maple-spanish",
    sourceStartSeconds: 43.6,
    sourceNote: "Ben states that the request is still open.",
  },
];

const meetings: Record<string, MeetingRecord> = {
  "icsi-bmr007": {
    id: "icsi-bmr007",
    title: "ICSI Meeting Recorder research meeting",
    recordedDate: "9 Nov 2000",
    durationSeconds: icsiSource.durationSeconds,
    durationLabel: "1:00:03",
    description: "Eight real speakers and 2,557 timed transcript segments for long-call playback, search, overlap, and navigation tests.",
    sourceLabel: "Public ICSI reference data",
    sourceKind: "public-reference",
    audioSrc: "/audio/icsi-bmr007.mp3",
    transcriptTiming: "exact",
    speakers: icsiSpeakers.map((speaker) => speaker.label),
    transcript: icsiTranscript,
    summary: [
      "Public research meeting from the ICSI Meeting Corpus.",
      "This record is included to exercise a one-hour transcript with eight speakers and overlapping annotations.",
      "No generated meeting summary is presented as a Fathom result.",
    ],
    insights: [],
    actions: [],
    reviewCount: 0,
    attribution: "ICSI Meeting Corpus, International Computer Science Institute; distributed by the University of Edinburgh. CC BY 4.0.",
  },
  cedar: {
    id: "cedar",
    title: "Cedar pilot review",
    recordedDate: "6 Oct 2026",
    durationSeconds: 315.56,
    durationLabel: "5:16 source audio",
    description: "Controlled benchmark for corrected numbers, conditional targets, changed owners, open decisions, and quoted transcript instructions.",
    sourceLabel: "Controlled TTS benchmark",
    sourceKind: "controlled-test",
    audioSrc: "/audio/cedar-source.mp3",
    transcriptTiming: "approximate",
    speakers: ["Maya", "Omar", "Sara", "Ben"],
    transcript: cedarTranscript,
    summary: [
      "102 test accounts are in the pilot, including 20 Cedar accounts.",
      "The approved pilot budget cap is USD 15,000. Friday 9 October is conditional on written security approval.",
      "The action-item layout is still a recommendation. Recording retention remains open with no owner.",
    ],
    insights: cedarInsights,
    actions: cedarActions,
    reviewCount: cedarActions.filter((action) => action.reviewState === "needs-review").length,
  },
  maple: {
    id: "maple",
    title: "Maple support handover",
    recordedDate: "6 Oct 2026",
    durationSeconds: 54.12,
    durationLabel: "0:54 source audio",
    description: "Controlled benchmark for keeping separate project budgets and task facts consistent across a second meeting.",
    sourceLabel: "Controlled TTS benchmark",
    sourceKind: "controlled-test",
    audioSrc: "/audio/maple-source.mp3",
    transcriptTiming: "approximate",
    speakers: ["Maya", "Ben", "Omar", "Sara"],
    transcript: mapleTranscript,
    summary: [
      "Maple has a separate invoice-export support issue and a USD 2,000 support budget cap.",
      "Omar owns investigation of the export issue. Sara sends the help-page draft to Ben.",
      "Spanish support remains unapproved with no owner.",
    ],
    insights: mapleInsights,
    actions: mapleActions,
    reviewCount: mapleActions.filter((action) => action.reviewState === "needs-review").length,
  },
};

export function getMeeting(id: string): MeetingRecord | null {
  return meetings[id] ?? null;
}

export function getMeetingIds(): string[] {
  return Object.keys(meetings);
}

export function getMeetingCatalog(): MeetingCatalogItem[] {
  return Object.values(meetings).map((meeting) => ({
    id: meeting.id,
    title: meeting.title,
    recordedDate: meeting.recordedDate,
    durationLabel: meeting.durationLabel,
    description: meeting.description,
    sourceLabel: meeting.sourceLabel,
    sourceKind: meeting.sourceKind,
    speakerCount: meeting.speakers.length,
    transcriptCount: meeting.transcript.length,
    reviewCount: meeting.reviewCount,
    transcriptTiming: meeting.transcriptTiming,
    actionStates: meeting.actions.map((action) => ({
      id: action.id,
      reviewState: action.reviewState,
    })),
    insightStates: meeting.insights.map((insight) => ({
      id: insight.id,
      reviewState: insight.reviewState,
    })),
  }));
}
