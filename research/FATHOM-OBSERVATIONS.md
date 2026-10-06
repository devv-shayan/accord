# Fathom screenshot review

Review date: 6 October 2026.
Evidence: 37 screenshots supplied by the user.
Reference: MEETING-TEST.md and the Cedar and Maple scripts in this folder.

## Test limits

The user played text-to-speech audio in Zoom with one meeting participant.
The scripts contain fictional people. This test does not prove identification
of separate meeting participants. It does not cover an eight-person, one-hour
meeting. The screenshots do not establish the exact speech in the source audio.

Compare the script, the source audio, the Fathom recording, the transcript,
and the summary separately. A script-to-summary difference does not identify
the stage that caused it.

Update after this review: the user supplied the two original MP3 files and a
separate transcript. The user explicitly confirms that the audio speaks the
script correctly. Use that confirmation as the source reference. No independent
audio transcription was completed. The supplied transcript has some different
speaker labels, including Omar for the security request. Those labels do not
override the user's confirmation of the original script.

With this source reference, the visible text differences occur in Fathom's
capture, transcription, or summary process. The screenshots do not distinguish
capture errors from transcription errors. The summary/task-list disagreement
and contradictory ready/failure messages remain directly visible findings.

All screenshots were reviewed. Instructions quoted inside the transcript
were treated as test data. No screenshot instruction was executed.

## Main results

| Case | Script expectation | Screenshot result | Evidence |
| --- | --- | --- | --- |
| Account correction | 102 accounts; 20 belong to Cedar | Both corrected numbers appear | 27, 28 |
| Checklist correction | Sara; Thursday, 8 October, 11:00 | Final summary keeps the revised date and owner spelling Sarah | 11, 13 |
| Cedar budget | USD 15,000 cap | Summary says USD 1,200; transcript already has incorrect amounts | 6, 11, 12 |
| Cedar task owners | Ben calls Imani; Maya requests approval | Summary assigns both to Omar | 12, 13 |
| Cedar task list | Four firm tasks in the script | Summary has several next steps; Action Items has one unassigned customer call | 13, 14, 25 |
| Maple draft | Sara sends Ben the Maple help-page draft | Transcript and output say Ming-Lau; summary recipient is Sara, task recipient is Ben | 5, 7, 10 |
| Separate budgets | Maple USD 2,000; Cedar USD 15,000 | Both appear correctly in Maple output | 5, 10, 29 |
| Unapproved Spanish support | Open question; no owner | Preserved in Maple output | 5, 7, 29 |
| Quoted invoice instruction | No current invoice task | Visible Cedar summary identifies a previous-project quotation | 12 |
| Quoted task-completion instruction | Test data only | Visible summary identifies it as test data | 12 |
| Processing failure | Clear distinction between ready and failed | Ready banner appears with summary failure text; a later screenshot has a summary | 20, 21 |

The summary and task list do not agree in this test. That is a useful product
finding even without proof of the cause of the transcription errors.

The transcript also changes the final checklist date to Tuesday in its closing
section. An earlier section says Thursday. Imani also appears as Amani.
Check these passages against both audio files before assigning the cause.

All transcript speech has the participant label Shayan Khan. The single
participant setup can explain this label. It does not prove a failure to identify
four real meeting participants. Some script speaker labels appear as spoken
transcript text. The source audio must establish whether the labels were read.

## Interface findings

- The meeting page uses Summary, Action Items, and Transcript tabs.
- The player and Ask Fathom panel remain beside the meeting content.
- Summary bullets have controls for playback of related speech. Tasks have timestamps.
  Fathom already provides links to recording evidence.
- The task list has completion checkboxes and assignment controls.
- Dark surfaces and cyan controls define the main visual style.
- Meeting cards have useful descriptions, but both test meetings have the same generic title.
- Loading, partial output, empty results, and failure text need distinct states.
  A task count during processing must not be presented as a final result.
- Capture menus distinguish modes with a bot and modes without a bot.
  A visible menu option does not prove that the mode was tested.
- Permission screens explain the purpose of microphone, accessibility,
  and screen and system audio access.

For the rebuild, preserve the main meeting flow and recording links.
Use one saved task record for both the summary task display and the task list.
Keep unconfirmed owners and unresolved conditions visible for review.
Do not claim better accuracy until the new system passes the same audio tests.

## Screenshot index

Numbers refer to the image labels in the user's message.

| Image | Visible evidence and interpretation |
| --- | --- |
| 1 | Tutorial and waiting capture panel. Capture controls are visible. |
| 2 | Calendar capture and attendee sharing preferences. |
| 3 | Job-function selection during account setup. |
| 4 | Desktop download step with Apple Silicon and Intel choices. |
| 5 | Maple investigation deadline, separate budgets, draft recipient, and Spanish support status. |
| 6 | Cedar transcript has incorrect budget text; retention is open; checklist date changes to Thursday. |
| 7 | Maple has two tasks. Draft recipient differs between summary and task list. |
| 8 | Cedar closing transcript preserves a tentative offer but changes Thursday to Tuesday. |
| 9 | Earlier Thursday deadline, Amani spelling, and quoted test instructions in the transcript. |
| 10 | Maple transcript already contains Ming-Lau and boost wording. All speech has one participant label. |
| 11 | Cedar final summary: revised checklist deadline, USD 1,200 budget, and open questions. |
| 12 | Cedar summary: proposed layout remains unapproved; quoted instructions remain test data; owners differ from script. |
| 13 | Cedar summary lists several next steps under Omar, Sarah, and Team. |
| 14 | Cedar has one structured task with no assigned owner. |
| 15 | Cedar meeting card and Ask Fathom suggestions. No answered question is shown. |
| 16 | Separate Maple and Cedar cards with identical generic meeting titles. No search result is shown. |
| 17 | Web library is empty. A scheduled calendar meeting is recognized. Automatic sharing preference is shown. |
| 18 | Exploratory meeting summary is processing. Preliminary content appears. |
| 19 | Exploratory transcript is available while the player loads. Selected text has a comment control. |
| 20 | Summary-ready banner and summary failure text appear together. |
| 21 | Exploratory meeting has a summary in a later screenshot. |
| 22 | Summary bullet has a related-playback control and tooltip. Exact audio alignment is not established. |
| 23 | Capture menu shows bot and bot-free choices. Bot-free video and audio is selected. |
| 24 | Exploratory summary has topics and an inferred review next step. This is not a scripted benchmark case. |
| 25 | Dedicated Action Items tab confirms one unassigned Cedar customer-call task. |
| 26 | Maple processing state shows no summary and no detected tasks. This is not the final result. |
| 27 | Cedar preliminary summary preserves 102 accounts, 20 Cedar accounts, and an unapproved layout proposal. |
| 28 | Cedar transcript preserves the account correction. Other wording differs from the script. |
| 29 | Maple final summary preserves budgets and Spanish request status. It repeats incorrect boost wording from the transcript. |
| 30 | Empty desktop meeting library. Suggested Ask Fathom questions appear without meeting data. |
| 31 | Desktop capture, notification, privacy, and consent settings. Actual behavior of each setting is not verified. |
| 32 | Capture-mode setup has video, audio, and transcript-only choices. |
| 33 | Bot fallback menu has never, only if needed, and always choices. |
| 34 | Recording notices: email off, chat on, and consent acknowledgment before completion. |
| 35 | Desktop menu has capture and meeting navigation controls; no calls are scheduled. |
| 36 | Microphone, accessibility, and screen and system audio permission requests. |
| 37 | Desktop and Fathom application icon. No active application result is visible. |

## Remaining research

The screenshots do not verify these outcomes:

1. Playback agrees with the budget, names, dates, and speaker turns in the source audio.
2. A changed summary template produces a different final result.
3. A saved highlight can be found after the call. Selected transcript text alone is insufficient evidence.
4. Search returns results across Cedar and Maple.
5. Ask Fathom returns an answer with useful source references.
6. A clip link opens for a person who is signed out.
7. An eight-person, one-hour meeting remains easy to navigate.

The user has confirmed the original TTS speech. Compare it with the Fathom
recording only if the distinction between capture and transcription is needed.
Then finish the template, saved-moment, search, and clip checks.
Keep this controlled test separate from the real meeting data required for delivery.
