# Fathom and Accord comparison

Date: 7 October 2026, Pakistan time.
Method: direct browser use of Fathom and the current Accord app; read-only review
of Accord's meeting data and AI route.

This check did not connect an integration, create a credential, change Fathom
settings, or run a new AI generation request. It did not change application code.

## Pages inspected

- Fathom Cedar recording: https://fathom.video/calls/851160713?forceWeb=true
- Fathom meeting library: https://fathom.video/home
- Fathom settings: https://fathom.video/customize
- Official MCP guide: https://developers.fathom.ai/mcp-docs
- Official Claude and Claude Code guide:
  https://developers.fathom.ai/mcp-docs/claude
- Accord Cedar record: http://localhost:3000/meetings/cedar

## Overlap

| Feature | Fathom evidence | Accord state |
| --- | --- | --- |
| Meeting library | Both controlled recordings appear in My Calls. A global recording search is available. | A library and search across saved transcript records exist. |
| Source navigation | Selecting the launch-blocker summary fact moved the recording position from 0:00 to 3:27. | Facts and transcript entries seek to a source position. Cedar and Maple positions are approximate. |
| Summary formats | The selector offers Enhanced, Project Update, Stand Up, Retrospective, and other formats. | Outcome, Brief, and Action focus offer different views of saved data. These are not separate AI generation prompts for each format. |
| Copy controls | Copy Summary, Copy Transcript, and Copy Follow-up Email are available. | Notes can be copied or downloaded. |
| Action items | The Cedar record has one generated action, a completion checkbox, an Assign control, and a source time. | The action view supports review and edits. The controlled records include manually prepared action facts. |
| Highlights and clips | A saved seven-second highlight appears in Annotations. The earlier signed-out clip check is recorded in FATHOM-LIVE-CHECKS.md. | Saved moments and bounded clip links are implemented. |
| Revised dates | The summary shows Thursday at 11 AM, replacing Wednesday at 2 PM. | The saved Cedar action shows the final Thursday date. |
| Proposals and open questions | The layout proposal is marked unapproved. Recording retention has no selected period. | Outcome shows proposals and open questions as separate entries. |
| AI questions across meetings | The library has Account-level Ask Fathom and a My Calls context control. | Accord has search across saved records. A conversational answer across meetings is not implemented. |
| Agent access | Settings lists Claude, ChatGPT, API Access, and MCP Server. The official guide includes Claude Code and other compatible tools. | An MCP connection is proposed. It is not implemented. |

The core overlap is expected in a Fathom rebuild. It must not be presented as a
new feature that Fathom lacks. Accord's Outcome view changes the arrangement of
information. It does not establish better extraction accuracy.

Fathom's Cedar summary and its structured task list contain different sets of
next steps. This remains a useful consistency test from the earlier research.
However, Accord's controlled records use selected source-script passages and
prepared facts. They are not the same input as Fathom's saved transcript. This
comparison cannot establish a fair AI accuracy result.

## Playback limit in this check

The source click established a jump to 3:27. The browser then reported
"Unable to play media." This check does not establish successful audible playback.
Earlier successful playback checks remain recorded separately.

## Speaker labels in Accord

Accord does not currently identify voices from audio. It does not perform new
audio transcription or speaker separation.

- Cedar and Maple have speaker IDs and names written into
  `lib/meeting-data.ts` from the controlled scripts. These names represent script
  roles. They are not measured voice identities.
- ICSI Bmr007 uses speaker IDs and times supplied in the original corpus
  annotations. The display labels are Speaker 1 through Speaker 8. Accord maps
  those IDs to labels; it does not discover those speakers from the recording.
- A missing ICSI speaker ID remains Unassigned. A supplied ID without a known
  label falls back to Unknown speaker.
- The AI draft route sends text with these existing speaker labels to Gemini.
  It does not send audio for speaker identification. Any extracted task owner
  therefore depends on the supplied labels and transcript wording.
- The speaker filter selects existing labelled records. It is a browsing feature,
  not a speaker identification test.

The Fathom controlled call has one Zoom participant. Its transcript uses the label
shayan khan throughout. This setup does not test identification of four separate
people. Correct speech in the source audio does not make that test equivalent to
a call with four real participants.

For new recordings, the missing capture and transcription path must supply
speaker groups and timed turns. Names should remain neutral until reliable
participant data or user confirmation establishes them. A person's name mentioned
in a sentence must not be treated as proof of the speaker's identity.

## Follow-up check — 7 October 2026

The later Chrome comparison established source playback in Fathom. Selecting
Budget & Scope started its media at about 2:11. Accord's budget fact started the
Cedar source audio at about 2:35. This supersedes the playback limit for that
later check. The earlier error remains part of the research record.

Accord now has task completion, readable transcript turns, marked search results,
editable moments, and clip playback that stops at the selected end. Its notes
formats and exports use one active task set. A new AI draft replaces prepared
tasks instead of repeating them. These changes complete familiar interactions;
they do not establish better extraction accuracy or automatic voice recognition.
See [the feature test report](FEATURE-POLISH-COMPARISON.md).

## Claims that remain unproved

- Automatic speaker separation or recognition in Accord.
- Better AI accuracy than Fathom on the same input.
- A reason to switch based only on source links or MCP access.
- A tested eight-person Fathom recording. The public ICSI record tests Accord's
  long-call browsing with existing annotations.
