# 8x assignment checklist

Brief received: 6 October 2026.
Product: Fathom, at https://fathom.video/.
Deadline from the supplied brief: 7 October 2026, 12:15 UTC.
Local deadline: 7 October 2026, 17:15 Pakistan time.
The brief says the clock is tracked but not enforced. Use the deadline as the delivery target.

This checklist takes precedence over the proposed scope in BUILD_PLAN.md.
Review the available product research and record its limits before application
code starts. An unavailable recording is a documented research limit, not a
requirement for the user to arrange a new meeting.

## Capture gate

- [x] Automatic prompt and final-response capture is installed.
- [x] Two separate test sessions passed. See CAPTURE-TEST.md.
- [x] Capture logs are included in Git.
- [x] The capture status has a recent scan and no error.
- [x] Include capture entries with the completed research commits. Continue with each new commit.

## First task: use Fathom

Use the free plan. Save screenshots and notes in research/.
Record what was tested, what happened, and what was unavailable.
Do not mark a flow as tested from documentation alone.

- [x] Sign up and complete onboarding.
- [x] Connect a calendar. Fathom recognizes the scheduled calendar test call in image 17.
- [x] Run a real Zoom call of at least two minutes. Cedar recording: 5:48. Maple recording: 1:03. Both used controlled TTS audio.
- [x] Check the available recording experience in the controlled Zoom meetings.
- [x] Record a moment during the call, if the account supports that function. The current experience did not expose a verified in-call highlight flow in this account. The after-call highlight flow was tested and the in-call case is recorded as unavailable.
- [x] Compare playback with speaker names, timestamps, and transcript text. Transcript-to-time navigation was verified. Exact audible word alignment and separate-speaker identification could not be verified with the available one-participant setup and interface; that limit is recorded.
- [x] Check player controls and transcript navigation. Cedar playback starts; a transcript paragraph moves playback to 4:04. Exact audible alignment remains unverified.
- [x] Compare the source script with the Fathom transcript and summary. The user confirms that the source audio speaks the script correctly.
- [x] Read the AI summaries for Cedar and Maple.
- [x] Change the summary template and compare the final output. Cedar changed from Enhanced to Project Update, generated new content, then returned to Enhanced.
- [x] Find and use the Action Items view for Cedar and Maple.
- [x] Find a marked moment after the call. A web highlight remains in Annotations after reload.
- [x] Search across more than one meeting. Web title search returns both recordings. Transcript search for Cedar returned no matches; that limit is recorded.
- [x] Test Ask Fathom across both meetings and inspect a source link. The answer separates the meetings but repeats incorrect task details.
- [x] Create a clip and test access for a person outside the meeting. The clip opens and its player starts in a separate signed-out browser. No message was sent.
- [x] Inspect Fathom output from an eight-person, one-hour meeting. No suitable record is available in this Fathom account and the user cannot arrange this call. This is recorded as an explicit research limit; public ICSI data is used only for rebuild tests.
- [x] Obtain a real public eight-speaker, one-hour record for reference and rebuild tests. ICSI Bmr007: 60:03.4 audio, eight speakers, and 2,557 transcript segments. Source and license are in research/data/ICSI-ATTRIBUTION.md.
- [x] Record problems with long transcripts, overlapping speech, and navigation. See research/LONG-MEETING-NOTES.md. These are rebuild/data observations, not claims about Fathom's live handling.
- [x] Record problems in the short meeting flows, including incorrect text, inconsistent task details, and contradictory processing states.
- [x] Review all 37 supplied screenshots and save an image-by-image research record.
- [x] Review the seven requested help-centre categories and 19 relevant articles. See research/FATHOM-HELP-CONTEXT.md.
- [x] Save representative screenshots for the main researched flows and relevant errors in research/screenshots/.

Research updated: 6 October 2026. See research/FATHOM-OBSERVATIONS.md
and research/FATHOM-LIVE-CHECKS.md.
The supplied screenshots cover account setup, capture settings, recording output,
meeting lists, transcripts, summaries, action items, and processing states.
The research record is saved in this repository. Representative screenshots for
the main researched flows and relevant error states are saved in research/screenshots/.
The signed-out clip check is saved as research/screenshots/clip-signed-out.jpg.

The controlled meetings have one Zoom participant. They complete the short-call
research check. They do not verify separate participant identification or establish
the real meeting data needed for the public demonstration.
The user confirms the original TTS audio is correct. Playback alignment with the
Fathom recording remains a separate check.

Direct app checks now establish a completed template change, a saved highlight,
title search across both records, an Ask Fathom answer with a source link,
and signed-out clip access. These findings have separate limits in the live
research record. Changes to Fathom task assignment and completion remain untested.
Accord task completion was added and checked in the later feature polish pass.
The help-centre review is reference research. It does not complete the remaining
product tests. Some articles describe the older experience; some describe
Fathom 3.0. Verify the feature in the correct web or desktop interface.

The current Fathom documentation says that in-call highlights are available
in the previous experience. The new experience supports adding them after a call.
Check the actual account. Record a limitation if the requested flow is unavailable.
Source: https://help.fathom.video/en/articles/295424.

Calendar authorization and meeting participation require the user's account.
The user must select the recipient before any clip is sent to another person.
A documented or simulated long meeting does not prove that a real eight-person
meeting was tested. Keep these forms of evidence separate.

Update after the user's recording constraint: a real public ICSI meeting is now
saved with audio, the original transcript, structured transcript data, and
source credit. Its metadata and timing were checked. This supplies the long
data case and real data for later rebuild tests. It does not complete the live
Fathom test. Keep the eight-person Fathom case as a documented research limit;
the user does not need to arrange eight participants.

The research gate is now closed. Every available firsthand check above is either
complete or explicitly recorded as unavailable. Documentation and the public
ICSI meeting explain limits but do not replace a Fathom flow that was not tested.
Application work can start from the selected build order below.

## Selected build order

The brief requires product research, but does not require every researched feature
to be implemented. The selected scope is now in BUILD_PLAN.md.
Build the meeting review flow with visible actions and consistent task facts.
Start this section only after the First task: use Fathom gate is closed.

1. Build a populated meetings list and a complete meeting detail view.
2. Connect playback, speaker turns, transcript search, and timestamp navigation.
3. Prove real AI draft generation from a saved transcript; validate and save the result.
4. Add summary templates, visible action review, and copy or export controls. Use one saved set of task facts across these views.
5. Add search across meetings, saved moments, and a clip link with public playback.
6. Check persistent records, visitor separation, clear loading and failure states, and responsive layouts.
7. Complete the deployment, public repository, README, and both videos.

The supplied recordings remain labelled examples. Live Google Meet capture now
works in desktop Chrome with the Accord Meet extension and a local test account.
Google OAuth and calendar read access are implemented. Client setup and local
credentials are complete; live account and calendar connection tests passed.
Private Supabase persistence
is configured and tested.
MCP, other meeting platforms, and team administration follow later.

## Changes to the earlier plan

- The original review scope excluded browser audio capture. On 7 October,
  the user changed the next build priority to Google Meet capture in a web app.
  The brief still permits simulated capture; real capture must pass a real test.
- Give summary templates, saved moments, and clip sharing higher priority.
- Keep search across meetings distinct from conversational AI search.
  Simple search can be sufficient for the first release.
- Include a one-hour, eight-speaker data case in layout and performance checks.
  The earlier 30-minute proposal does not cover this case.
- Use real meeting data for the public demonstration. A fictional sample alone
  does not satisfy the brief. Use data that can be shared publicly.
- Use a small action review step inside a recognizable Fathom meeting view.
  Defer the earlier plan's full approval and transcript revision system.

## Google Meet capture

Scope: Google Meet on the web, in desktop Chrome. Use the Accord Meet extension.
A person clicks Start recording. Local test account success does not establish
Google sign-in or cloud persistence. Evidence: research/CAPTURE-VERIFICATION.md.

- [x] Implement Meet tab and optional microphone capture. A real solo call was
  recorded with Include my microphone enabled. Independent live-source tests
  remain below.
- [x] Show setup, timer, pause, resume, microphone control, marks, and Stop and save.
- [x] Preserve audio before upload and allow retry. Mocked extension tests verify
  offline recovery, source binding, pause timing, and device release.
- [x] Normalize audio without pause gaps. A real FFmpeg timestamp-gap test passed.
- [x] Save a new meeting and produce a timed transcript from its audio. The real
  capture has 20 passages. New times are explicitly approximate.
- [x] Use neutral AI voice labels. A solo test does not verify participant identity.
- [x] Generate notes and action items. The real capture has three actions and
  separate saved Outcome and Brief results.
- [x] Put private records into the meeting, search, moment, and clip routes.
  HTTP tests confirm ownership and that another account cannot find the record.
- [x] Test a real short Meet capture, four in-call marks, and source playback.
- [x] Test durable edits and a cropped 30-second clip. Anonymous HTTP access to
  the clip works; anonymous private pages, audio, and state are rejected.
- [x] Record install steps, server setup, worker use, evidence, and limits in README.
- [ ] Test live tab audio and microphone audio as distinct sources.
- [ ] Test microphone denial, missing tab audio, and capture interruption in Chrome.
- [ ] Test a real browser restart or network outage during capture upload.
- [ ] Test an hour-long live recording and its processing time.
- [x] Configure Google OAuth in project `accord-510919`, enable Calendar API,
  set the test user and read-only scope, and save the client keys in `.env`.
- [x] Complete live consent, calendar loading, manual refresh, disconnection,
  and same-account reconnection. The primary calendar has no upcoming Meet calls.
- [ ] Test populated calendar calls and access-token expiry refresh.
- [x] Configure the dedicated Accord Supabase project and private audio bucket.
  Live cloud upload, saved edits, account separation, clip access, and processing
  by a separate local worker passed. See research/INTEGRATIONS-VERIFICATION.md.
- [ ] Test the persistent cloud worker on the intended deployment host.

The extension needs an explicit Chrome action for each recording. A call prompt
must not imply silent recording. See Chrome's tab capture API reference:
https://developer.chrome.com/docs/extensions/reference/api/tabCapture.

## Required delivery

- [ ] Public HTTPS application URL.
- [ ] Public GitHub repository URL with .agent-logs/ committed.
- [ ] Real meeting data in the deployed application.
- [ ] Walkthrough video of no more than five minutes, with camera and voiceover.
- [ ] Separate one-minute introduction video about something outside the CV.
- [ ] Video links that reviewers can open.
- [ ] Labelled repository and application links in the submission fields.
- [ ] Clear explanation of implemented features and simulated features.

Video update: 10 October 2026. The user reports that both required videos are
recorded. Their files or public links were not supplied in this turn. The
delivery checks above remain open until the links, content, and time limits
are checked.

Do not submit the assignment until the user has reviewed the final materials.

## Final checks

- [ ] A signed-out visitor can open the deployed application and its sample meetings.
- [x] Meetings, Saved moments, and Shared clips have separate pages. Menu links, direct reloads, saved source links, clip links, and phone and tablet layouts were checked in Chrome.
- [x] Playback seeks to the supplied ICSI transcript times. Cedar and Maple use labelled approximate anchors; exact word alignment remains unverified.
- [x] Summary format changes produce separate Gemini content. Outcome generated eight notes; Brief generated four. Each format saves its result and source links. The selection and results persist after reload. Tasks appear in Action items.
- [x] Real AI generation completes. The earlier server draft passed validation with eleven valid source references. After the user approved Gemini summaries, Chrome verified first generation, regeneration, cancellation, retry, and separate saved format results. The earlier combined task-draft browser control was not retested.
- [x] Task facts agree across Action items, copy, and download. Edits and completion survive reload. Unknown details stay blank. A regression test prevents repeated task rows after AI generation. Summary exports contain summary notes only.
- [x] Search returns relevant results across several meetings. A `budget` search returns the Cedar USD 15,000 passage and the separate Maple USD 2,000 record and passage.
- [ ] A deployed clip link opens in a separate signed-out browser session. Local
  anonymous clip HTTP checks pass; the Chrome check used the signed-in profile.
- [x] The one-hour meeting remains easy to navigate. The 2,557-segment ICSI transcript was checked with virtualization, search, seeking, speaker filtering controls, and responsive layouts.
- [ ] A visitor cannot change another visitor's sample state.
- [ ] The repository is public and contains the complete capture logs.
- [ ] Both videos open without the owner's login.
- [ ] The walkthrough has camera and voiceover and meets its time limit.

Feature polish, Summary cleanup, live AI formats, and separate library pages
checked: 7 October 2026.
Ten feature tests, type checking, and the production build pass. Summary has
separate Gemini-generated Outcome and Brief formats. The task
list and task exports are in Action items.
See research/FEATURE-POLISH-COMPARISON.md for the Chrome comparison,
screenshots, and test limits. These checks do not complete the delivery items.

Target a complete submission package by 7 October 2026, 15:15 Pakistan time.
Keep the remaining two hours for verification and fixes.

Capture update: 7 October 2026. The local real Meet test and supplied-audio
Gemini pipeline passed. Ten feature tests, eleven capture tests, two extension
harness tests, lint, type checks, and the production build pass. The HTTP test
checks durable edits, anonymous cropped clips, revocation, account ownership,
and private search. These checks do not complete Google or cloud account setup.
No commit was made during capture work. The user's commit approval is required.

Account and cloud update: 7 October 2026. The private schema is installed in
Supabase project `txijzjbhcnwushfmjjki`. A live test processed supplied audio
with Gemini, saved edits across a new server process, and rejected private
access from another account. Its anonymous cropped clip worked and was revoked
after an edit. All disposable cloud test data was removed. Twelve provider-mocked
Google account tests pass. Both Google keys were saved on 8 October.
Live consent, calendar loading, manual refresh, disconnection, and same-account
reconnection passed. Populated calendar calls and access-token expiry refresh
remain open. No commit was made.

Hosting update: 8 October 2026. The Vercel CLI created project `accord` and
deployed an explicit preview. Vercel reports Ready. The fixed preview address
is https://accord-preview-shayankhanx1x.vercel.app. The approved server keys are
saved in Vercel's protected settings. Public access and the hosted Google
callback are pending approval. Live host capture and clip checks remain open.
No commit was made.

Live sign-in update: 8 October 2026. The approved server settings are now in
Production. Google Cloud saved the exact live callback for
https://accord-pi-hazel.vercel.app. The production deployment reports Ready.
Live sign-in, primary calendar loading, cloud storage checks, and session
persistence after reload passed. Google OAuth remains in Testing. Live hosted
capture, long processing, and anonymous visitor access remain open.
No commit was made.
