import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) return nextResolve(pathToFileURL(path.resolve(import.meta.dirname, "..", specifier.slice(2) + ".ts")).href, context);
    return nextResolve(specifier, context);
  },
});
const { formatTime, parseTime } = await import("../lib/format.ts");
const { buildMeetingNotes, buildActionNotes, outcomeGroups } = await import("../lib/meeting-notes.ts");
const { groupTranscript } = await import("../lib/transcript.ts");
const { validateAiDraft } = await import("../lib/validate-ai-draft.ts");
const { validateSummary, buildSummaryPrompt } = await import("../lib/ai-summary.ts");
const { resolveMeetingActions, resolveSummaryInsights, blankMeetingState, aiActionId, aiSummaryInsightId, withSummaryDraft, readAccordState } = await import("../lib/client-state.ts");
const meeting = { title: "Cedar pilot review", recordedDate: "6 Oct 2026", durationLabel: "5:48", sourceLabel: "Controlled source", transcriptTiming: "approximate" };
const action = { id: "checklist", title: "Send the updated checklist", owner: "Sarah", due: "8 Oct, 11 AM", recipient: "Ben", condition: "After the permission screen is ready", reviewState: "accepted", completed: false };
const insight = { id: "budget", title: "Budget corrected", kind: "correction", previousValue: "$1,000", currentValue: "$1,200", detail: "Includes hosting and transcription", sourceStartSeconds: 66, reviewState: "accepted" };

test("Action exports keep edits, completion, recipients, and conditions", () => {
  const notes = buildActionNotes(meeting, [{ ...action, title: "Send the final checklist", completed: true }]);
  assert.match(notes, /\[x\] Send the final checklist/);
  assert.match(notes, /Sarah · 8 Oct, 11 AM · To Ben — After the permission screen is ready/);
  assert.doesNotMatch(notes, /Budget corrected/);
});
test("Dismissed notes cannot reappear from the old summary", () => {
  const notes = buildMeetingNotes(meeting, "overview", ["Budget corrected"], [{ ...insight, reviewState: "dismissed" }]);
  assert.doesNotMatch(notes, /Budget corrected|Send the updated checklist/);
  assert.match(notes, /No notes remain/);
  assert.doesNotMatch(buildActionNotes(meeting, [{ ...action, reviewState: "dismissed" }]), /Send the updated checklist/);
});
test("Brief keeps open questions separate from approved facts", () => {
  const groups = outcomeGroups([insight, { ...insight, id: "retention", kind: "open-question", title: "Retention remains open" }], "project-update");
  assert.equal(groups[0].title, "Key points");
  assert.equal(groups[1].title, "Still open");
  assert.equal(groups[1].items[0].id, "retention");
  for (const format of ["overview", "project-update"]) {
    const notes = buildMeetingNotes(meeting, format, [], [insight]);
    assert.match(notes, /\[1:06, approx\.\]/);
    assert.doesNotMatch(notes, /## Actions|Next steps|\[[ x]\]|Send the updated checklist/);
  }
  const actions = buildActionNotes(meeting, [{ ...action, reviewState: "open" }]);
  assert.match(actions, /## Open questions/);
  assert.doesNotMatch(actions, /\[ \] Send/);
});

test("An old Action focus selection keeps saved edits and moments when it opens Outcome", () => {
  const stored = { version: 1, meetings: { cedar: {
    ...blankMeetingState(), summaryTemplate: "action-focus",
    actionOverrides: { checklist: { title: "Send the final checklist", completed: true } },
    moments: [{ id: "saved", label: "Budget correction", startSeconds: 155, endSeconds: 177 }],
    aiDraft: { summary: ["Budget corrected"], actions: [], insights: [] },
  } } };
  const previous = globalThis.window;
  delete stored.meetings.cedar.summaryDrafts;
  globalThis.window = { localStorage: { getItem: () => JSON.stringify(stored) } };
  try {
    const migrated = readAccordState();
    assert.equal(migrated.meetings.cedar.summaryTemplate, "overview");
    assert.deepEqual(migrated.meetings.cedar.actionOverrides, stored.meetings.cedar.actionOverrides);
    assert.deepEqual(migrated.meetings.cedar.moments, stored.meetings.cedar.moments);
    assert.deepEqual(migrated.meetings.cedar.aiDraft, stored.meetings.cedar.aiDraft);
    assert.deepEqual(migrated.meetings.cedar.summaryDrafts, {});
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});

test("Summary formats keep separate results, source links, and review state without changing tasks or clips", () => {
  const record = { id: "cedar", actions: [action], transcript: [{ id: "cedar-budget", startSeconds: 155.8 }] };
  const note = { kind: "correction", title: "Budget is $15,000", detail: null, previousValue: "$1,500", currentValue: "$15,000", sourceSegmentId: "cedar-budget", sourceNote: "The budget was corrected." };
  const outcome = { format: "overview", generatedAt: "2026-10-07T00:00:00Z", model: "test", insights: [note] };
  const brief = { ...outcome, format: "project-update", insights: [{ ...note, title: "Cedar has a $15,000 cap", previousValue: null, currentValue: null }] };
  let state = { ...blankMeetingState(), summaryTemplate: "project-update",
    actionOverrides: { checklist: { completed: true, title: "Send the final checklist" } },
    moments: [{ id: "clip", label: "Budget", startSeconds: 155, endSeconds: 170 }],
  };
  const originalTasks = resolveMeetingActions(record, state);
  const originalClips = state.moments;
  // Outcome finishes after the user selects Brief. It must not change the selection.
  state = withSummaryDraft(state, record.id, "overview", outcome);
  assert.equal(state.summaryTemplate, "project-update");
  assert.deepEqual(resolveSummaryInsights(record, state), []);
  state = withSummaryDraft(state, record.id, "project-update", brief);
  assert.equal(resolveSummaryInsights(record, state)[0].title, "Cedar has a $15,000 cap");
  state.summaryTemplate = "overview";
  assert.equal(resolveSummaryInsights(record, state)[0].title, "Budget is $15,000");
  assert.equal(resolveSummaryInsights(record, state)[0].sourceStartSeconds, 155.8);
  const outcomeId = aiSummaryInsightId(record.id, outcome, 0);
  const briefId = aiSummaryInsightId(record.id, brief, 0);
  state.insightOverrides[outcomeId] = { reviewState: "dismissed" };
  state.insightOverrides[briefId] = { reviewState: "accepted" };
  const refreshed = { ...outcome, generatedAt: "2026-10-07T00:01:00Z" };
  state = withSummaryDraft(state, record.id, "overview", refreshed);
  assert.equal(state.insightOverrides[outcomeId], undefined);
  assert.equal(state.insightOverrides[briefId].reviewState, "accepted");
  assert.deepEqual(state.summaryDrafts["project-update"], brief);
  assert.deepEqual(resolveMeetingActions(record, state), originalTasks);
  assert.deepEqual(state.moments, originalClips);
  assert.throws(() => withSummaryDraft(state, record.id, "overview", brief));
});

test("Generated summaries reject unknown audio anchors and Brief exports every returned note", () => {
  const note = { kind: "fact", title: "Pilot supports playback", detail: null, previousValue: null, currentValue: null, sourceSegmentId: "cedar-one", sourceNote: "The engineer lists playback." };
  const transcript = [{ id: "cedar-one", startSeconds: 10, speakerLabel: "Omar", text: "Pilot supports playback." }];
  assert.equal(validateSummary({ insights: [note] }, transcript, "overview")[0].sourceSegmentId, "cedar-one");
  for (const sourceSegmentId of [null, "maple-one", "10:00"]) {
    assert.throws(() => validateSummary({ insights: [{ ...note, sourceSegmentId }] }, transcript, "overview"));
  }
  assert.throws(() => validateSummary({ insights: Array(6).fill(note) }, transcript, "project-update"));
  const notes = Array.from({ length: 5 }, (_, index) => ({ ...note, id: `point-${index}`, title: `Brief point ${index + 1}`, sourceStartSeconds: 10, reviewState: "accepted" }));
  assert.match(buildMeetingNotes(meeting, "project-update", [], notes), /Brief point 5/);
  const outcomePrompt = buildSummaryPrompt({ title: meeting.title, transcript }, "overview");
  const briefPrompt = buildSummaryPrompt({ title: meeting.title, transcript }, "project-update");
  assert.notEqual(outcomePrompt, briefPrompt);
  assert.match(briefPrompt, /three to five/);
  assert.match(outcomePrompt, /six to twelve/);
});
test("Clip time fields support the hour-long recording and reject invalid input", () => {
  assert.equal(parseTime("1:00:02"), 3602);
  assert.equal(parseTime("60:02"), 3602);
  assert.equal(formatTime(3602), "1:00:02");
  for (const value of ["-1:20", "1:60", "1:2:99", "abc", "", "1:2:3:4"]) assert.equal(parseTime(value), null);
});
test("Readable turns preserve every segment, overlap, speaker, and time anchor", () => {
  const segment = (id, speakerId, startSeconds, endSeconds, text) => ({ id, speakerId, speakerLabel: speakerId, startSeconds, endSeconds, text });
  const input = [
    segment("one", "A", 0, 1, "We need"),
    segment("two", "A", 1.1, 2, "the checklist."),
    segment("overlap", "B", 1.5, 3, "Thursday?"),
    segment("answer", "A", 3, 4, "Yes."),
    segment("later", "A", 10, 11, "Next item."),
  ];
  const turns = groupTranscript(input);
  assert.equal(turns.length, 4);
  assert.equal(turns[0].segments.length, 2);
  assert.deepEqual(turns.flatMap((turn) => turn.segments), input);
  assert.equal(turns[1].segments[0].startSeconds, 1.5);
});

test("AI references must belong to this meeting and values must match the schema", () => {
  const aiAction = { ...action, sourceSegmentId: "cedar-1", sourceNote: "Sarah committed to send it." };
  const draft = { summary: ["Checklist due Thursday."], insights: [], actions: [aiAction] };
  const transcript = [{ id: "cedar-1" }];
  assert.equal(validateAiDraft(draft, transcript).actions[0].sourceSegmentId, "cedar-1");
  const invalid = validateAiDraft({ ...draft, actions: [{ ...aiAction, sourceSegmentId: "maple-1" }] }, transcript);
  assert.equal(invalid.actions[0].sourceSegmentId, null);
  assert.match(invalid.actions[0].sourceNote, /does not match this transcript/);
  assert.throws(() => validateAiDraft({ ...draft, actions: [{ ...aiAction, owner: 42 }] }, transcript));
  assert.throws(() => validateAiDraft({ ...draft, insights: [{ ...insight, kind: "unknown" }] }, transcript));
});

test("A new AI draft replaces prepared tasks without repeating them or inventing missing details", () => {
  const record = { id: "cedar", actions: [action], transcript: [{ id: "cedar-1", startSeconds: 15 }] };
  const state = blankMeetingState();
  assert.equal(resolveMeetingActions(record, state)[0].id, "checklist");
  state.aiDraft = {
    generatedAt: "2026-10-07T00:00:00Z", model: "test", summary: [], insights: [],
    actions: [{ title: "Send the final checklist", owner: null, due: null, condition: null, recipient: "Ben", sourceSegmentId: "cedar-1", sourceNote: "Source commitment." }],
  };
  const id = aiActionId("cedar", state.aiDraft, 0);
  state.actionOverrides[id] = { title: "Send the agreed checklist", completed: true, reviewState: "accepted" };
  const resolved = resolveMeetingActions(record, state);
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].title, "Send the agreed checklist");
  assert.equal(resolved[0].owner, null);
  assert.equal(resolved[0].due, null);
  assert.equal(resolved[0].sourceStartSeconds, 15);
  assert.equal(resolved[0].completed, true);
  state.aiDraft.actions = [];
  assert.deepEqual(resolveMeetingActions(record, state), []);
});
