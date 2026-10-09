# Accord design direction

## Brief

**Self-authored from the assignment research.**

Accord is a web app for finding the final state of a messy meeting. It keeps
playback, transcript search, summaries, actions, saved moments, and clips, then
adds a meeting-truth layer that separates corrections, decisions, conditions,
rejections, proposals, and open questions.

The primary user is a product, implementation, client-service, or operations
team whose meetings contain changing numbers, conditional commitments, revised
owners, rejected ideas, and unresolved questions. The main action is to read a
final fact and click it to hear the supporting source audio.

The interface should feel precise, calm, and editorially confident. It keeps
the useful Fathom pattern of meeting content beside playback. Accord's distinct
surface is the Summary tab with its Outcome format: what changed, what settled,
and what remains open.

Existing assets and evidence:

- Fathom screenshots and direct product observations in `research/`.
- Cedar and Maple controlled meeting records.
- Public ICSI Bmr007 audio with eight speakers and a 60-minute transcript.
- No final product brand, logo, or image library exists yet.

Pages: Meetings, Saved moments, Shared clips, Record, meeting review, and public
clip playback. Each library has its own route.

## Current product reference

### Keep

- Meeting library that opens a detailed record.
- Summary formats, actions, transcript, playback, saved moments, and clip sharing.
- Click-to-listen source playback from generated facts and actions.
- Clear processing and failure states.

### Improve

- Preserve the final value when a meeting corrects an earlier statement.
- Keep decisions, conditions, rejections, proposals, and open questions distinct.
- Make a fact itself the playback control for its supporting source moment.
- Keep actions compact; show owner and deadline only when known and useful.
- Keep title search and transcript search distinct and useful.
- Keep long transcripts responsive and navigable.

### Decisions

- Google Meet capture uses the Accord Meet Chrome extension. The local live
  capture test passed. Google and cloud setup still need real account tests.
- Accord uses its own visual identity while preserving a familiar meeting
  review structure.
- Public ICSI data is the long-meeting demonstration record.

## Three directions

### 1. Broadcast rundown — selected

**Concept:** Accord is a live broadcast rundown after the cameras stop.

- Source family: media.
- Ground: deep graphite.
- Type: Instrument Sans for interface and display; IBM Plex Mono for timecode.
- Accent: warm signal amber, used for the current evidence position and primary
  review action.
- Richness: the time ruler, waveform, speaker lanes, and evidence rail provide
  the visual material.
- Layout: transcript and reviewed facts form the main reading surface; playback
  is a persistent control room rail.
- Motion: seeking moves one precise time marker; source jumps slide the evidence
  rail to the matching passage.
- Risk: becoming a sci-fi dashboard. Avoid glows, fake meters, and decorative
  telemetry.

Why it wins: the metaphor is native to recorded media, supports dense transcript
work, preserves the dark familiarity of Fathom, and gives evidence navigation a
specific visual language.

### 2. Case file

**Concept:** Accord is a case file where every claim has an exhibit.

- Source family: printed matter.
- Ground: cool paper white.
- Type: Newsreader for large meeting titles; Instrument Sans for controls.
- Accent: flat cobalt used for linked evidence.
- Richness: exhibit labels, marginal citations, and document rhythm.
- Layout: wide reading column with a narrower evidence margin.
- Motion: source references unfold into the margin.

Why it loses: evidence is clear, but the reading-first feel makes continuous
audio playback and long transcript navigation feel secondary.

### 3. Tape deck

**Concept:** Accord is a studio tape deck for replaying decisions.

- Source family: objects and materials.
- Ground: muted warm grey with black equipment surfaces.
- Type: Archivo for interface; IBM Plex Mono for transport and timecode.
- Accent: red-orange used only for the active transport state.
- Richness: reel/tape geometry, track lanes, and physical transport controls.
- Layout: playback is visually dominant above transcript and tasks.
- Motion: the active track advances through a fixed playhead.

Why it loses: it is memorable, but it over-emphasizes the recording device and
makes action review feel like a secondary feature.

## Selected tokens

### Colour

| Token | Value | Role |
| --- | --- | --- |
| `ground` | `#0B0D10` | Page background |
| `raised` | `#12161B` | Main work surfaces |
| `raised-2` | `#181D23` | Hover and selected surfaces |
| `ink` | `#F4F7FA` | Primary text |
| `ink-2` | `#A5AFBA` | Secondary text |
| `ink-3` | `#697480` | Tertiary text |
| `rule` | `#29313A` | Dividers and outlines |
| `accent` | `#F2B84B` | Evidence position and primary review action |
| `on-accent` | `#17120A` | Text on accent |
| `positive` | `#72C79B` | Confirmed state |
| `negative` | `#E97676` | Error or rejected state |

Accent role: current evidence position and the action that commits a review.
Selection that is unrelated to evidence stays neutral.

### Type

- Display and UI: Instrument Sans.
- Timecode and technical metadata: IBM Plex Mono.
- Page title: 38/42, 650 weight, -1.2% tracking.
- Meeting title: 30/34, 650 weight, -0.8% tracking.
- Section title: 18/24, 650 weight.
- Body: 15/22, 450 weight.
- Metadata: 12/17, 500 weight.
- Timecode: 12/16, 500 weight, tabular figures.

### Spacing and shape

- Page gutter: 24px desktop, 16px mobile.
- Main grid gap: 12px.
- Surface radius: 12px.
- Small control radius: 8px.
- Dividers do more grouping work than cards.
- Dense transcript rows use 10–12px vertical spacing.

## Signature interaction

Clicking a fact or action starts playback at its supporting source moment and
updates the source rail beside it. Corrected values show the earlier value and
the final value in one row. Exact transcripts use exact timestamps; controlled
benchmark recordings use approximate anchors aligned to nearby audio pauses and
are labelled as approximate.

Reduced motion: jump immediately to the source and update the marker without
sliding the rail.

## Product thesis update — 7 October 2026

Accord is not positioned as a Fathom clone or as a generic verification layer.
Fathom already lets a user play source audio from generated notes. Accord keeps
that interaction and focuses on a harder problem: the final truth after a
conversation changes direction.

The Summary tab with its Outcome format is the primary product surface:

- **What changed:** corrections, conditions, and rejected directions.
- **Settled:** final facts and explicit decisions.
- **Still open:** proposals and questions that did not become decisions.
- **Action items tab:** a separate task list with owner or deadline shown only
  when the source supports them. Recipient stays out of the main list.
- **Listen:** clicking a source-linked fact or action seeks to the supporting
  audio and starts playback.

The AI draft contract returns source segment IDs for both outcome facts and
actions. This allows exact recordings to link directly to evidence and keeps
unsupported source links null.

## Content for the core screen

Meeting: **Cedar pilot review**

- Date: 6 October 2026.
- Duration: 5:16 source audio.
- Review state: 1 fact needs review; one separate retention question remains open.
- Summary purpose: Review pilot date, budget, customer feedback, and remaining
  work.
- Account fact: 102 test accounts; 20 belong to Cedar.
- Budget fact: USD 15,000 pilot cap.
- Layout proposal: not approved.
- Checklist: Sara; Thursday 8 October at 11:00 Pakistan time.
- Customer call: Ben calls Imani; Wednesday 7 October at 10:00 Pakistan time.
- Retention decision: open; owner not confirmed.

The first implementation must keep unknown values unknown until the user edits
them or the source supports them.

## Feature completion — 7 October 2026

Keep the selected broadcast direction and the existing navigation. This is a
completion pass, not a new visual concept. Fathom is the interaction reference.
Use larger transport controls, a compact library heading, a clear notes toolbar,
and fewer repeated status labels. Amber marks source playback and selection.

Complete these flows: source playback from every notes format; separate task
completion and review; transcript copy and search with marked matches; readable
speaker turns; editable saved moment times; clip playback that stops at its end;
search failure and audio failure recovery; saved edits shared by all notes views
and exports. Keep unknown owners and dates blank. Keep corpus speaker labels and
script role labels explicit. Do not claim automatic speaker identification.

Main labels: Meetings, Summary, Action items, Transcript, Listen, Copy,
Download, Copy transcript, Playback speed, Save moment, Edit moment,
Copy clip link, Open clip, Retry audio, Regenerate. Outcome and Brief each use
their own Gemini prompt and saved result. First use generates the format;
switching back reuses its saved result. Tasks remain in Action items.

## Separate library pages — 7 October 2026

Keep the selected broadcast direction. The user requested separate pages for
Meetings, Saved moments, and Shared clips. Replace the two library anchors with
page links. Show the current page in the sidebar. Keep each meeting's own review
page and each public clip's playback page.

Page content:

- Meetings (`/meetings`): Recordings, notes, and action items. Keep the three
  supplied records and transcript search. The home route opens this page.
- Saved moments (`/saved-moments`): Selected moments from your meetings. Saved
  in this browser. Show the saved label, meeting title, and playback range.
  Selecting a moment opens its source meeting at the saved start time.
- Shared clips (`/shared-clips`): Clips you created from saved moments. Show
  shared moments only. Selecting a clip opens its bounded playback link.
- Empty libraries: explain how to add the first item and link to Meetings.
- Loading: use matching placeholder rows until browser storage has loaded.

Preserve saved records and clip links. Move the two lists out of Meetings.
Use the same page gutters, headings, separators, and amber source icons.

## Build and browser report

Separate pages checked — 7 October 2026: Meetings, Saved moments, and Shared
clips have separate routes and selected menu states. Existing saved records
survive direct reloads. Saved moments open the source time; shared clips open
their bounded player. Empty pages show one action to open Meetings. All three
pages fit at 390 and 820 CSS pixels and at the normal desktop width. The phone
menu closes after selection. The viewport was reset. Ten feature tests, type
checking, and the production build pass. No commit was made.

Current AI format update — 7 October 2026: the user approved separate Gemini
summaries. Outcome describes corrections, settled facts, and unresolved matters.
Brief condenses the transcript into at most five notes. Both use validated source
passages. Generate on first use, save per meeting and format, and offer Regenerate.
Keep the saved summary visible during a refresh or a failed request. Cancel shows
Retry. A request that finishes after a format change saves to its own format.
Summary requests do not replace tasks, completion state, or saved clips.

The implementation passes ten feature tests, type checking, and the production
build. Chrome generated eight Outcome notes and four Brief notes with different
content. Saved results survived reload and switching. Regenerate, Cancel, and
Retry worked. Source audio started at the supplied budget passage. The Brief
download contains its four generated notes and no task list. A saved task
completion survived summary generation and reload; the test change was restored.
Both summary layouts fit a 390-pixel viewport. The temporary viewport was reset.
The final desktop page has no console warnings or errors. No commit was made.

Earlier app update — 7 October 2026: the user approved removing repeated tasks.
Rename the Outcome tab to Summary. Its formats are Outcome and Brief. Both show
corrections, decisions, facts, and open questions with source playback. Remove
Action focus and the task section from Summary. Action items holds the task list,
completion, and edits. Copy and download export the content of the selected tab.
Keep task export in Action items. Existing saved Action focus selections fall
back to Outcome without changing saved tasks, moments, or AI drafts. Keep the
current colours, player, and layout.

This change is complete. Eight feature tests and the production build pass.
Chrome checks confirm two summary formats, separate exports, source playback,
and no horizontal overflow at 390 and 820 CSS pixels. The normal desktop view
was also checked. No commit was made.

The earlier report below records the build before this change.

Verified on 7 October 2026 against the production Next.js build:

- Type checking, the production build, and seven feature tests pass.
- Source selection starts audio from notes, tasks, and transcript passages.
  Speed, mute, ten-second controls, and keyboard seeking work.
- Outcome, Brief, and Action focus use one saved set of facts and tasks.
  Edits and completion appear in notes copy and download and survive reload.
  New AI tasks replace prepared tasks. They do not form a duplicate list.
- Transcript search marks results and can move between them. Copy includes all
  2,557 ICSI source passages. Speaker filtering and follow playback work.
- Library search returns the separate Cedar and Maple budget passages.
- Moments can be named and edited. Invalid ranges show an error. Saved ranges
  survive reload. Remove has Undo. Clips stop at their selected end and replay.
- The edited 22-second clip opens in another Chrome tab with the correct range.
  This uses the same profile. It does not establish fresh signed-out access.
- Responsive checks at 390, 820, and 1280 CSS pixels show no horizontal overflow.
  The final production page has no console warnings or errors.
- One live Gemini server request returned a draft that passed validation.
  Its eleven source IDs belong to the supplied Cedar transcript. This verifies
  the server path and source references, not the accuracy of every claim.

Fathom source playback and transcript search were compared directly in Chrome.
See [the feature test report](research/FEATURE-POLISH-COMPARISON.md) for evidence
and screenshots. The comparison does not establish better extraction accuracy.

The earlier browser Generate AI draft check was blocked by automatic approval
review. That request was not bypassed. The later summary generation checks above
used the user's approval for Gemini summaries. The old task-draft control was not
retested in Chrome. Separate visitors and deployed clip access still
need release checks. Cedar and Maple anchors are labelled approximate. Their
exact word alignment remains unverified. Automatic voice identification is not
implemented. The fresh design reviewer could not run because of a usage limit;
no independent design score is claimed.

## Google Meet capture — 7 October 2026

Keep the web app and the selected review layout. Add Record to the navigation.
The setup page has three steps: Connect Google, Add Accord Meet to Chrome, and
Connect the extension. Show upcoming calls and private processing progress.
The extension provides the timer, pause, microphone control, marked moments,
and Stop and save. It detects joined calls but needs a click to start capture.

A local solo Meet capture produced a complete meeting page with audio, a Gemini
transcript, separate Outcome and Brief notes, three actions, and four marks.
Private review changes now save on the server. Shared recording clips use a
cropped audio file with a seven-day token. The public player has no full-meeting
link. AI voice groups are labelled as AI voice labels, not verified participants.
The supplied examples keep browser-local changes and their existing data labels.

See research/CAPTURE-VERIFICATION.md for checks and open account setup. Earlier
statements about simulated capture describe the earlier build. They are not the
current capture status. No native app, bot, or MCP server was added.

## Google account and storage controls — 7 October 2026

Keep the existing three setup steps and review pages. Add a compact private
cloud status in the Record page sidebar. Show Connected only after the server
can read the private document tables and recording bucket. Show storage failures
with a clear retry action.

Google controls use Connect Google, Allow calendar access, Calendar connected,
Disconnect calendar, Reconnect calendar, and Sign out. Disconnect keeps the
Accord session and saved meetings. Upcoming calls show loading, empty, and error
states. The list shows primary-calendar Meet calls for the next seven days.
Refresh and account changes cannot show a stale calendar response.

The current Chrome screen shows cloud storage connected and a setup message for
the missing Google credentials. The 390-pixel layout fits without horizontal
overflow. Private cloud upload, separate worker processing, saved edits, cropped
clips, and account separation passed a live test. Real Google consent remains
pending. See research/INTEGRATIONS-VERIFICATION.md. No commit was made.

## Compact capture popup — 8 October 2026

The user reported too much text in the extension popup. Keep the current dark
surface and amber recording action. The main view contains the call title,
microphone switch, Start recording, and one short recording notice. Show Enable
microphone only while the microphone is selected and permission is not granted.
Move local copies into a closed Saved recordings disclosure. Move the account
name, host, and Disconnect into a closed Connection disclosure. Keep Open Accord
visible. During recording, show the timer, pause, mark, stop, and microphone.

Alternative layouts were considered within the existing direction: a separate
recordings tab would add navigation; a menu-only list would hide upload recovery.
The disclosure keeps recovery one click away and leaves capture as the main action.
No recording, stored audio, account, or upload behavior was removed.

The browser preview used the actual popup HTML, CSS, and JavaScript with a mocked
Chrome connection and capture state. The ready view is 340 by 345 pixels when
microphone permission is needed. Saved recordings and Connection start closed.
Their controls remain available when expanded. Start, pause, resume, mark, stop,
mic selection, disconnected state, and disabled capture outside Meet were checked.
This is a UI check, not a new live recording. Two existing extension tests and
popup lint pass. The downloadable extension ZIP was rebuilt. Browser policy
blocked direct navigation to the installed Chrome extension page. Reload the
unpacked Accord Meet extension to use the changed files. No commit was made.

Screenshot: research/screenshots/extension-popup-compact.jpg.
