# Existing feature completion and Fathom comparison

Date: 7 October 2026, Pakistan time.
Scope: complete the existing Accord features. Keep the meeting library, notes,
actions, transcript, player, saved moments, and clip page. No commit was made.

## Separate library pages

Checked on 7 October 2026 after the user requested separate pages.

- Meetings is at `/meetings`. The home route redirects to it. It contains only
  the meeting records and search. The two moment lists were moved out of it.
- Saved moments is at `/saved-moments`. Shared clips is at `/shared-clips`.
  Both read the existing saved browser records. Shared clips filters the list
  to moments with a created clip link. Each page has its own browser title.
- The sidebar shows the current page. Meeting review keeps Meetings selected.
  Back to meetings opens the new library route. On a phone, selecting another
  page or selecting the current page closes the menu.
- The existing Budget correction record survived route changes and direct
  reloads. Its saved-moment link opened Cedar at 155 seconds. Its shared link
  opened the 155–177-second clip and displayed a 22-second playback range.
- A `budget` search still returned the corrected Cedar budget passage and the
  separate Maple budget passage. Empty Saved moments and Shared clips pages
  were checked through the separate local origin `127.0.0.1`. The existing
  `localhost` browser data was not cleared.
- The normal desktop view and the 390- and 820-pixel layouts were checked.
  Document width equals viewport width on all three pages at both test widths.
  The final page has no console warnings or errors. The viewport was reset.
- Ten feature tests, type checking, and the production build pass. Capture
  logs remain automatic. No commit was made. Public deployment and signed-out
  clip access remain separate delivery checks.

Screens:

- [Earlier combined library](screenshots/library-pages-before.jpg)
- [Meetings](screenshots/library-pages-meetings-desktop.jpg)
- [Saved moments](screenshots/library-pages-saved-desktop.jpg)
- [Shared clips](screenshots/library-pages-shared-desktop.jpg)
- [Empty Shared clips](screenshots/library-pages-empty-desktop.jpg)
- [Meetings on a phone](screenshots/library-pages-meetings-mobile.jpg)
- [Saved moments on a phone](screenshots/library-pages-saved-mobile.jpg)
- [Shared clips on a phone](screenshots/library-pages-shared-mobile.jpg)
- [Meetings on a tablet](screenshots/library-pages-meetings-tablet.jpg)

## Separate live AI summaries

Checked on 7 October 2026 after the user approved Gemini generation for both
formats. This is the current Summary implementation.

- Outcome and Brief have separate prompts and separate saved results. The first
  Outcome request produced eight notes. Brief produced four shorter notes with
  different text. Switching back and reloading preserved the original generation
  times and content. No local rewrite of the other format is used.
- Outcome was regenerated. Cancel preserved the saved summary and showed Retry.
  Retry completed while Brief remained selected. The result saved under Outcome;
  the Brief result stayed at its original generation time.
- Each returned note must have a source ID from this meeting. Invalid IDs and
  excessive format length are rejected. Selecting the budget note from each
  format started source audio at approximately 2:35 and displayed Maya's passage.
- A checklist completion state survived summary generation, format changes, and
  reload. The four original task entries and saved budget clip remained intact.
  The temporary checklist completion was restored to its initial state.
- Chrome downloaded `cedar-project-update-notes (1).md`. The file was read. It
  contains Brief's four generated notes, source times, and no task list. Copy
  displayed its success state. The browser tool's clipboard read returned an
  earlier task export, so that tool read does not verify the native clipboard.
  Copy and download use the same tested notes builder.
- Both summary formats have no horizontal overflow at 390 CSS pixels. The
  normal desktop view was checked. The temporary viewport was reset. The final
  page has no console warnings or errors.
- Ten feature tests, type checking, and the production build pass. Invalid format
  and missing meeting requests return 400 and 404 without model requests.
- Saved summaries are local to this browser. Cedar uses selected script passages
  with approximate audio anchors. Validation proves source ID membership, not
  the correctness of every generated claim. Long-call generation was not tested
  in this pass. No commit was made.

Current screens:

- [Generated Outcome](screenshots/ai-summary-outcome-desktop.jpg)
- [Generated Brief](screenshots/ai-summary-brief-desktop.jpg)
- [Generated Brief on a phone](screenshots/ai-summary-brief-mobile.jpg)

## Summary and task separation update

Checked on 7 October 2026 after the user approved the cleanup.

- The Outcome tab is now Summary. Its only formats are Outcome and Brief.
- Both formats show facts and open questions. Neither contains a task list.
  Action focus was removed. Action items keeps the tasks and task controls.
- Copy and download match the selected tab. Chrome downloaded
  `cedar-project-update-notes.md` and `cedar-actions.md`. Both files were read.
  The summary file has no task list. The action file has three task checkboxes
  and a separate open question. It keeps the task conditions.
- Brief stayed selected after reload. Outcome was restored after this check.
  A regression test checks that an old Action focus selection opens Outcome
  without changing saved task edits, moments, or AI drafts.
- Source playback works from Outcome, Brief, and Action items. Selecting the
  budget fact starts the source at approximately 2:35. Selecting the checklist
  task starts its source at approximately 3:49.
- Both tabs have no horizontal overflow at 390 and 820 CSS pixels. The normal
  desktop view was checked at 1192 pixels. The temporary viewport setting was
  reset. The final Chrome page has no console warnings or errors.
- Eight feature tests and the production build pass. No new model request was
  made for this change. No commit was made.

Current screens:

- [Summary on desktop](screenshots/summary-cleanup-summary-desktop.jpg)
- [Action items on desktop](screenshots/summary-cleanup-actions-desktop.jpg)
- [Summary on a phone](screenshots/summary-cleanup-summary-mobile.jpg)
- [Action items on a phone](screenshots/summary-cleanup-actions-mobile.jpg)

The sections below record the earlier feature completion check. Their three
formats and combined notes export describe the version before this cleanup.

## Direct comparison

Fathom was checked in Chrome at
https://fathom.video/calls/851160713?forceWeb=true.
The available record has one Zoom participant. It does not test automatic
identification of several speakers or the eight-person Fathom case.

| Flow | Fathom observation | Accord result |
| --- | --- | --- |
| Listen to a note | Selecting Budget & Scope starts the source media at approximately 2:11. | Selecting the budget fact starts the Cedar audio at approximately 2:35 and shows the source passage. All three notes formats keep source playback. |
| Notes formats | Enhanced and other formats are available. The earlier research records a completed template change. | Outcome, Brief, and Action focus use one saved set of facts. Changing format makes no new model request. |
| Actions | A checkbox, assignment control, and source time are visible. Fathom task completion was not changed in this check. | Completion, edits, review, removal, and restore work. Completion is separate from accepting a fact. Unknown values stay blank. Open questions have no completion checkbox. |
| Transcript | Speaker label, paragraph timestamps, copy, and marked search matches are available. | Copy, marked matches, previous/next match, speaker filter, source playback, and follow playback work. Consecutive phrases form readable turns while keeping their original source times. |
| Saved moments | A seven-second annotation from the earlier research remains visible. | Start and end times can be edited. Preview stops at the selected end. Remove has Undo. The saved and shared library sections update. |
| Clip | The earlier Fathom research includes a signed-out clip test. | The generated Accord URL opens in another Chrome tab with its selected bounds and a working player. This used the same Chrome profile; it is not a fresh signed-out-session test. |
| Search across meetings | The earlier Fathom research verifies title search and records its transcript-search limit. | A budget search returns three matches across Cedar and Maple. A result opens the transcript at its source time and keeps the search term. |

This comparison confirms familiar interactions. It does not establish that Accord
extracts facts more accurately than Fathom. The controlled Accord records use
selected source-script passages and prepared facts. Fathom uses its saved
transcript, which contains text errors. The user confirms that the original
audio speaks the script correctly.

## Checks completed

- The production build and type check pass. Seven feature tests pass.
- Clicking facts, actions, or transcript passages seeks and starts audio.
  Playback speed, mute, ten-second controls, and keyboard seeking work.
- A temporary checklist edit and completion state appeared in notes copy,
  both tested formats, and the Actions tab after reload. The temporary values
  were restored. Open-question removal and restore kept its open state.
- Chrome downloaded `cedar-overview-notes.md`. The file was read from Downloads.
  It contains the final budget, three tasks, a separate retention question,
  conditions, and approximate source times. Download and copy use the same
  notes builder.
- A new AI draft uses one task set. It does not append duplicate prepared tasks.
  A regression test checks replacement, saved edits, empty results, missing
  owners and dates, and source times. Library review counts use the same rule.
- A Cedar moment named Budget correction was saved at 2:35–2:57. It survived
  reload and appeared in both library sections. Editing invalid times showed
  an error. Editing a valid range updated the link. Remove and Undo worked.
- A three-second clip played, stopped at its end, and replayed from its start.
  The edited 22-second clip URL opened with the correct range and duration.
- ICSI search for consent found five passages. The fifth match is at 51:44.
  Playback started from that Speaker 4 passage. Clearing the filter kept the
  active source in view. Copy returned all 2,557 timestamped source passages,
  including passages outside the current filter.
- Observed viewport width and document width matched at 390, 820, and 1280 CSS
  pixels. The phone tab overflow found during QA was fixed. Notes, transcript,
  moment editor, library, and tablet action editor were checked. Enter saves
  the action form.
- The final production Chrome page reported no console warnings or errors.
  Earlier development logs included temporary Fast Refresh errors and a
  hydration difference caused by a browser extension.
- After the task replacement fix, the final build passed again. A new Chrome
  tab loaded the Cedar notes, four task entries, and the saved moment. Selecting
  the budget fact started audio at 2:35. The page had no console warnings or
  errors. The temporary viewport override was reset. The preview stays open.

## AI verification

One real server request used the configured Gemini key. The model was
gemini-3.8-flash. The returned draft was generated at
2026-10-06T21:16:39.199Z. It contains four summary bullets, seven insights, and
four actions. All eleven source IDs belong to the Cedar transcript. The output
passed the application validator. This checks the live server path and source
ID membership. It does not prove that every claim is correct.

A later attempt to trigger Generate AI draft through Chrome was rejected by
automatic approval review. Its reason was that the user had not specifically
approved sending the full transcript to Gemini. The browser generation check
was not bypassed. Approval was requested for that precise data and destination.
The completed server check remains separate from that earlier browser attempt.
The current summary-only browser checks above used the user's later approval.
They do not retest the older combined task-draft control.

Existing AI items without a valid source reference remain visible for review.
They show Source not linked and their source note. Clicking them does not play
an unrelated passage. Source validation rejects references from another meeting.

## Limits

- Capture is simulated. Calendar connection, a live meeting bot, and new audio
  transcription are outside this completion pass.
- Cedar and Maple use approximate script-to-audio anchors. They are labelled
  approximate. Exact word alignment was not established.
- ICSI labels and timestamps come from corpus annotations. Cedar and Maple
  names are script roles. Accord does not identify voices from audio.
- Saved reviews and moments are local to the browser. Same-profile tabs share
  that state. Separate visitors and deployed access still need release checks.
- Audio, storage, search, and generation recovery states are implemented.
  Forced network and storage failure tests were not performed in Chrome.
- The fresh design reviewer could not run because of a usage limit. The main
  agent inspected the saved mobile, desktop, library, long-transcript, and clip
  screens. No independent design score is claimed.

## Screens

- [Desktop notes and source](screenshots/feature-polish-outcome-desktop.jpg)
- [Phone notes](screenshots/feature-polish-outcome-mobile.jpg)
- [Desktop library](screenshots/feature-polish-library-desktop.jpg)
- [Phone library](screenshots/feature-polish-library-mobile.jpg)
- [Long transcript](screenshots/feature-polish-long-transcript.jpg)
- [Clip player](screenshots/feature-polish-clip-desktop.jpg)
- [Final build preview](screenshots/feature-polish-final-preview.jpg)
