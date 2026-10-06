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
- [ ] Record a moment during the call, if the account supports that function.
- [ ] Compare playback with speaker names, timestamps, and transcript text.
- [x] Check player controls and transcript navigation. Cedar playback starts; a transcript paragraph moves playback to 4:04. Exact audible alignment remains unverified.
- [x] Compare the source script with the Fathom transcript and summary. The user confirms that the source audio speaks the script correctly.
- [x] Read the AI summaries for Cedar and Maple.
- [x] Change the summary template and compare the final output. Cedar changed from Enhanced to Project Update, generated new content, then returned to Enhanced.
- [x] Find and use the Action Items view for Cedar and Maple.
- [x] Find a marked moment after the call. A web highlight remains in Annotations after reload.
- [x] Search across more than one meeting. Web title search returns both recordings. Transcript search for Cedar returned no matches; that limit is recorded.
- [x] Test Ask Fathom across both meetings and inspect a source link. The answer separates the meetings but repeats incorrect task details.
- [x] Create a clip and test access for a person outside the meeting. The clip opens and its player starts in a separate signed-out browser. No message was sent.
- [ ] Inspect Fathom output from an eight-person, one-hour meeting. No suitable record is available in this Fathom account. The user cannot arrange this call; report the limit.
- [x] Obtain a real public eight-speaker, one-hour record for reference and rebuild tests. ICSI Bmr007: 60:03.4 audio, eight speakers, and 2,557 transcript segments. Source and license are in research/data/ICSI-ATTRIBUTION.md.
- [ ] Record problems with long transcripts, overlapping speech, and navigation.
- [x] Record problems in the short meeting flows, including incorrect text, inconsistent task details, and contradictory processing states.
- [x] Review all 37 supplied screenshots and save an image-by-image research record.
- [x] Review the seven requested help-centre categories and 19 relevant articles. See research/FATHOM-HELP-CONTEXT.md.
- [ ] Save a screenshot for each main flow and its relevant errors.

Research updated: 6 October 2026. See research/FATHOM-OBSERVATIONS.md
and research/FATHOM-LIVE-CHECKS.md.
The supplied screenshots cover account setup, capture settings, recording output,
meeting lists, transcripts, summaries, action items, and processing states.
The research record is saved in this repository. The original screenshots remain
in the supplied local files; a complete screenshot set for all required flows
has not been saved in research/. A signed-out clip screenshot is saved in
research/screenshots/clip-signed-out.jpg.

The controlled meetings have one Zoom participant. They complete the short-call
research check. They do not verify separate participant identification or establish
the real meeting data needed for the public demonstration.
The user confirms the original TTS audio is correct. Playback alignment with the
Fathom recording remains a separate check.

Direct app checks now establish a completed template change, a saved highlight,
title search across both records, an Ask Fathom answer with a source link,
and signed-out clip access. These findings have separate limits in the live
research record. Task assignment and completion changes remain untested.
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
data case and real data for the rebuild. It does not complete the live Fathom
test. Continue the build with that known research limit; the user does not need
to arrange eight participants.

## Selected build order

The brief requires product research, but does not require every researched feature
to be implemented. The selected scope is now in BUILD_PLAN.md.
Build the meeting review flow with visible actions and consistent task facts.

1. Build a populated meetings list and a complete meeting detail view.
2. Connect playback, speaker turns, transcript search, and timestamp navigation.
3. Prove real AI draft generation from a saved transcript; validate and save the result.
4. Add summary templates, visible action review, and copy or export controls. Use one saved set of task facts across these views.
5. Add search across meetings, saved moments, and a clip link with public playback.
6. Check persistent records, visitor separation, clear loading and failure states, and responsive layouts.
7. Complete the deployment, public repository, README, and both videos.

Use a simulated bot or prerecorded capture layer for the first complete flow.
Label that choice in the interface, README, and walkthrough.
Do not claim that calendar synchronization or a live bot works if it is simulated.
Keep the existing proposed stack until a concrete integration problem requires a change.
Verify provider access before making the build depend on it.
New audio transcription, live capture, calendar synchronization, integrations,
and team administration are outside the first release. Single-meeting AI
questions are optional after the main release checks pass.

## Changes to the earlier plan

- Exclude browser audio capture and recording recovery from the first release.
  The brief expressly permits a simulated capture layer.
- Give summary templates, saved moments, and clip sharing higher priority.
- Keep search across meetings distinct from conversational AI search.
  Simple search can be sufficient for the first release.
- Include a one-hour, eight-speaker data case in layout and performance checks.
  The earlier 30-minute proposal does not cover this case.
- Use real meeting data for the public demonstration. A fictional sample alone
  does not satisfy the brief. Use data that can be shared publicly.
- Use a small action review step inside a recognizable Fathom meeting view.
  Defer the earlier plan's full approval and transcript revision system.

## Required delivery

- [ ] Public HTTPS application URL.
- [ ] Public GitHub repository URL with .agent-logs/ committed.
- [ ] Real meeting data in the deployed application.
- [ ] Walkthrough video of no more than five minutes, with camera and voiceover.
- [ ] Separate one-minute introduction video about something outside the CV.
- [ ] Video links that reviewers can open.
- [ ] Labelled repository and application links in the submission fields.
- [ ] Clear explanation of implemented features and simulated features.

Do not submit the assignment until the user has reviewed the final materials.

## Final checks

- [ ] A signed-out visitor can open the deployed application and its sample meetings.
- [ ] Playback and transcript timestamps agree.
- [ ] Summary template changes produce the expected content.
- [ ] One real AI draft run completes from a saved transcript.
- [ ] Task facts agree across templates and exports; conditions and missing details remain clear.
- [ ] Search returns relevant results across several meetings.
- [ ] A clip link opens in a separate signed-out browser session.
- [ ] The one-hour meeting remains easy to navigate.
- [ ] A visitor cannot change another visitor's sample state.
- [ ] The repository is public and contains the complete capture logs.
- [ ] Both videos open without the owner's login.
- [ ] The walkthrough has camera and voiceover and meets its time limit.

Target a complete submission package by 7 October 2026, 15:15 Pakistan time.
Keep the remaining two hours for verification and fixes.
