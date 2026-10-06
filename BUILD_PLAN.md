# 8x build plan

Updated: 6 October 2026.
Working name: Accord.
Status: selected build scope. Application code has not started.
The assignment requirements are in ASSIGNMENT-CHECKLIST.md.
This plan replaces the earlier proposal from 30 September.

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
| Summary templates | Provide a small set of views, such as overview, project update, and action focus. Reuse the same saved facts when the view changes. A template change must not silently assign a new owner or deadline. |
| Action review | Show supported owners and dates, conditions, missing details, and a source link. Accept, edit, or dismiss a draft item. Keep review state separate from task completion. |
| Saved moments | Select a time range, save a highlight, reopen it, and play that range. |
| Clip sharing | Create a public link to a saved range. A signed-out visitor can open it and play the bounded clip. |
| Notes export | Copy or download notes from the current reviewed records. Preserve conditions and open questions. |
| Saved state | Preserve edits, highlights, and task states after refresh. Keep each visitor's sample changes separate. Show clear loading, empty, and failure states. |

The AI source is the saved transcript. This release does not promise new audio
transcription. Existing transcripts must be labelled as supplied transcripts.
Prepared notes must be labelled as saved results. Only a completed provider call
can be described as live generation. Public sample playback and review must work
without a login or a paid AI call from each visitor.

Accepting an item means that the app user reviewed it. It does not mean that
all meeting participants approved it. An accepted conditional proposal must
retain its condition. A missing owner or deadline must remain missing until
there is source support or a clear user edit.

## Capture choice

Use a labelled prerecorded or simulated capture layer. The brief permits this.
Explain it in the app, README, and walkthrough.
The recording bot and calendar connection are outside the first release.
Do not show a simulated provider result as a completed live call.

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
another meeting before implementation starts.

## Build sequence

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

- A bot that joins Zoom, Google Meet, or Teams.
- Calendar synchronization and automatic meeting attendance.
- Live transcription, new audio transcription, and speaker identification.
- Browser microphone capture, screen capture, and video recording.
- Native desktop and mobile apps.
- CRM and task integrations, automatic follow-up emails, and email delivery.
- Team workspaces, organization controls, billing, and subscriptions.
- A general personal-file upload service and its full account workflow.
- A large approval history, transcript revision system, or background job platform.
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
