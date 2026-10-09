# 8x build plan

Updated: 8 October 2026.
Working name: Accord.
Status: core review and local Google Meet capture are implemented and tested.
Private cloud storage is configured and tested. Google OAuth client setup and
local credentials are complete. Live sign-in, calendar loading, disconnection,
and same-account reconnection passed.
The assignment requirements are in ASSIGNMENT-CHECKLIST.md.
This plan replaces the earlier proposal from 30 September.

## Research gate

The research gate is closed. ASSIGNMENT-CHECKLIST.md records the completed
firsthand checks and the unavailable flows. Evidence is saved in research/.
Exact short-call word alignment, separate participant identification, and the
current Fathom in-call highlight flow have recorded limits. The eight-person,
one-hour Fathom case remains an explicit research limit because the user cannot
arrange it. The public ICSI meeting is reference data for that case; it does not
count as a live Fathom test.

## Product direction

Build a Fathom meeting review app with clear, usable next steps.
A person can find a meeting, check its important passages, review its actions,
and copy notes or share a clip.

Make action items visible when a meeting opens. Keep each task in one saved
record. Its owner, deadline, condition, recipient, and review state must stay
consistent across the task list, summary templates, and copied notes.
Show missing or uncertain details. Let the person check the source before
accepting or changing an item.

This choice follows the Cedar and Maple tests. Some summary tasks were absent
from the structured action list. Template changes also changed owners and
amounts. The source links and editable tasks already exist in Fathom.
Our proposed improvement is how the review flow presents and uses these facts.
Better extraction accuracy remains a test result to establish.

## First release

| Feature | Required behavior |
| --- | --- |
| Meeting library | Open populated meeting cards with dates, durations, and clear states. Search titles and transcript text across meetings. Results open the matching meeting or passage. |
| Meeting detail | Use a familiar Fathom layout with playback, transcript, summary, and visible actions. Support a narrow screen and keyboard use. |
| Playback and transcript | Play real audio. Select a timestamp to seek. Search within a transcript and filter by speaker. Navigate the one-hour meeting without rendering every row at once. |
| AI notes | Generate a structured draft from a saved transcript with the selected Gemini provider. Check service access before this work depends on it. Save and validate the result. |
| Summary templates | Outcome and Brief use separate Gemini prompts and save separate results with source links. Tasks appear in Action items. A format change must not silently change a reviewed task. |
| Action review | Show supported owners and dates, conditions, missing details, and a source link. Accept, edit, or dismiss a draft item. Keep review state separate from task completion. |
| Saved moments | Select a time range, save a highlight, reopen it, and play that range. |
| Clip sharing | Create a public link to a saved range. A signed-out visitor can open it and play the bounded clip. |
| Notes export | Copy or download notes from the current reviewed records. Preserve conditions and open questions. |
| Saved state | Preserve edits, highlights, and task states after refresh. Keep each visitor's sample changes separate. Show clear loading, empty, and failure states. |

New Google Meet recordings now produce transcripts from their audio. Gemini
then generates notes and action items from those transcripts. A real local
Chrome capture passed. Private cloud persistence passed a live upload and worker
test. Google sign-in also passed with a real account on 8 October.
Existing transcripts must be labelled as supplied transcripts.
Prepared notes must be labelled as saved results. Only a completed provider call
can be described as live generation. Public sample playback and review must work
without a login or a paid AI call from each visitor.

Accepting an item means that the app user reviewed it. It does not mean that
all meeting participants approved it. An accepted conditional proposal must
retain its condition. A missing owner or deadline must remain missing until
there is source support or a clear user edit.

## Capture choice

The user selected Google Meet on the web, in desktop Chrome. The capture layer
is a Manifest V3 extension. The web app provides account setup, calendar calls,
processing progress, and meeting review. No native app or meeting bot is required.

1. Connect Google and allow calendar event read access. Add Accord Meet to Chrome
   and approve the Accord origin. Local tests use a clearly labelled local account.
2. Join a Meet call. The extension detects a joined call and offers recording
   controls. The person clicks Start recording in the Chrome toolbar.
3. Capture Meet tab audio and optional microphone audio. Show the timer, pause,
   resume, microphone control, marked moments, and Stop and save.
4. Save audio in IndexedDB before upload. Retry durable parts after a failed
   upload. Keep a local backup. Closing the popup does not stop capture.
5. Normalize the audio with FFmpeg, transcribe it with Gemini, and generate
   notes and actions. Use approximate audio times and neutral AI voice labels.
6. Open the private meeting. Its transcript is searchable. Reuse Saved moments
   and Shared clips. A shared recording clip contains only the cropped range.

A real solo Chrome Meet call produced 4:44 of saved audio, 20 transcript passages,
three actions, and four in-call marks. Outcome and Brief have separate saved
results. Source playback and a separate 30-second shared clip were tested.
See research/CAPTURE-VERIFICATION.md for the evidence and remaining limits.

Chrome requires a person to invoke capture. A detected call does not start it
silently. Accord's microphone control is separate from Meet's mute state.
Reference: https://developer.chrome.com/docs/extensions/reference/api/tabCapture.

Google OAuth, calendar loading, and private Supabase storage are implemented.
The dedicated Accord Supabase project has its schema and private audio bucket.
Live checks passed for cloud upload, separate worker processing, durable edits,
private playback, clips, and account separation. Live Google consent, calendar
loading, disconnection, and same-account reconnection passed on 8 October.
See research/INTEGRATIONS-VERIFICATION.md.
Long jobs on hosts with short request limits need the persistent recording worker.
Actual denied permissions, separate live tab and microphone sources, a browser
restart during failed upload, and an hour-long capture remain browser checks.
The extension harness covers pause and upload retry with mocked interfaces.

## Data and evidence

Use the real public ICSI Bmr007 meeting in the deployed app. It has eight speakers,
60:03.4 of audio, and 2,557 timed transcript segments. Keep its source credit and
license with the app and repository. See research/data/ICSI-ATTRIBUTION.md.

Use Cedar and Maple as clearly labelled controlled test meetings. They help test
corrected numbers, changed deadlines, conditional proposals, unknown owners,
quoted instructions, and the separation of two projects. They are not evidence
of eight separate participants in Fathom.

The public ICSI record supplies real demonstration data and the long transcript
case. It does not prove that an eight-person call was tested in Fathom.
Keep that research limit in the final notes. The user does not need to arrange
another meeting.

## Build sequence

The core review stages and local capture flow are implemented and checked.
Test populated calendar calls and access-token expiry refresh. Public
delivery and MCP access remain incomplete.

1. Build and deploy the populated library and meeting detail view.
2. Complete playback, transcript search, speaker filtering, and time navigation.
3. Prove one real transcript-to-draft AI call. Validate and save the result.
4. Add the summary views, visible action review, and notes export.
5. Complete search across meetings, saved moments, and public clip playback.
6. Check saved state, visitor separation, long transcript navigation, and errors.
7. Finish the public repository, README, walkthrough, and introduction video.

Keep the selected web stack unless a concrete service problem requires a change.
Check actual credentials and hosting early. Do not use the unverified model names,
recording limits, or processing promises from the replaced plan.

## Excluded from the first release

- A bot that joins a meeting.
- Capture for any meeting platform other than Google Meet on the web.
- Calendar writes and automatic meeting attendance.
- Real-time transcription and automatic identification of people by voice.
- Native desktop and mobile apps.
- CRM and task integrations, automatic follow-up emails, and email delivery.
- Team workspaces, organization controls, billing, and subscriptions.
- A general personal-file upload service and its full account workflow.
- A large approval history, transcript revision system, or general job platform.
  The recording worker is limited to capture processing.
- Conversational AI search across all meetings.

Single-meeting questions with source links are the first optional addition.
Add them only after the first-release checks pass. Do not delay the complete
meeting review flow to add them.

## Release checks

- A signed-out visitor can open the live app and real sample meeting.
- Audio, timestamps, search results, and source links reach the correct passage.
- All summary views and exports use the same current task facts.
- Conditions and missing values survive review and export.
- Quoted or spoken instructions cannot change the AI extraction rules.
- A saved highlight survives refresh, and its public clip has bounded playback.
- The one-hour transcript remains usable during search, playback, and scrolling.
- One visitor's changes do not change another visitor's sample.
- At least one real AI draft run completes; failures leave playback usable.
- Implemented and simulated features are stated clearly.

Deliver a public app, a public repository with capture logs, real meeting data,
a walkthrough of no more than five minutes with camera and voice, and a separate
one-minute introduction video. Prepare the materials for the user's review.

Target the complete package by 7 October 2026, 15:15 Pakistan time.
The assignment deadline is 17:15 Pakistan time. Keep the final two hours for checks.
