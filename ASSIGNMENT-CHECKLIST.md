# 8x assignment checklist

Brief received: 6 October 2026.
Product: Fathom, at https://fathom.video/.
Deadline from the supplied brief: 7 October 2026, 12:15 UTC.
Local deadline: 7 October 2026, 17:15 Pakistan time.
The brief says the clock is tracked but not enforced. Use the deadline as the delivery target.

This checklist takes precedence over the proposed scope in BUILD_PLAN.md.
Product research must finish before application code starts.

## Capture gate

- [x] Automatic prompt and final-response capture is installed.
- [x] Two separate test sessions passed. See CAPTURE-TEST.md.
- [x] Capture logs are included in Git.
- [x] The capture status has a recent scan and no error.
- [ ] Include new capture entries with each related commit.

## First task: use Fathom

Use the free plan. Save screenshots and notes in research/.
Record what was tested, what happened, and what was unavailable.
Do not mark a flow as tested from documentation alone.

- [ ] Sign up and complete onboarding.
- [ ] Connect a calendar.
- [ ] Run a real two-minute meeting on Zoom, Meet, or Teams.
- [ ] Check the notetaker or available recording experience in that meeting.
- [ ] Record a moment during the call, if the account supports that function.
- [ ] Compare playback with speaker names, timestamps, and transcript text.
- [ ] Read the AI summary and change its template.
- [ ] Find and use the action items.
- [ ] Find a marked moment after the call.
- [ ] Search across more than one meeting.
- [ ] Create a clip and test access for a person outside the meeting.
- [ ] Inspect an eight-person, one-hour meeting.
- [ ] Record problems with long transcripts, overlapping speech, and navigation.
- [ ] Save a screenshot for each main flow and its relevant errors.

The current Fathom documentation says that in-call highlights are available
in the previous experience. The new experience supports adding them after a call.
Check the actual account. Record a limitation if the requested flow is unavailable.
Source: https://help.fathom.video/en/articles/295424.

Calendar authorization and meeting participation require the user's account.
The user must select the recipient before any clip is sent to another person.
A documented or simulated long meeting does not prove that a real eight-person
meeting was tested. Keep these forms of evidence separate.

## Proposed build order after research

The brief requires product research, but does not require every researched feature
to be implemented. Select the final scope after the research.

1. Build a populated meetings list and a complete meeting detail view.
2. Connect playback, speaker turns, transcript search, and timestamp navigation.
3. Add summary templates, action items, and copy or export controls.
4. Add search across meetings, saved moments, and a clip link with public playback.
5. Add persistent records, clear loading and failure states, and responsive layouts.
6. Add real transcription and summary generation if they fit the remaining time.
7. Add the Accord review step only after the main Fathom flows work.

Use a simulated bot or prerecorded capture layer for the first complete flow.
Label that choice in the interface, README, and walkthrough.
Do not claim that calendar synchronization or a live bot works if it is simulated.
Keep the existing proposed stack until a concrete integration problem requires a change.
Verify provider access before making the build depend on it.

## Changes to the earlier plan

- Move browser audio capture and recording recovery below the meeting review flow.
  The brief expressly permits a simulated capture layer.
- Give summary templates, saved moments, and clip sharing higher priority.
- Keep search across meetings distinct from conversational AI search.
  Simple search can be sufficient for the first release.
- Include a one-hour, eight-speaker data case in layout and performance checks.
  The earlier 30-minute proposal does not cover this case.
- Use real meeting data for the public demonstration. A fictional sample alone
  does not satisfy the brief. Use data that can be shared publicly.
- Preserve the review improvement, but first make the product recognizable as
  a Fathom rebuild.

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
- [ ] Search returns relevant results across several meetings.
- [ ] A clip link opens in a separate signed-out browser session.
- [ ] The one-hour meeting remains easy to navigate.
- [ ] A visitor cannot change another visitor's sample state.
- [ ] The repository is public and contains the complete capture logs.
- [ ] Both videos open without the owner's login.
- [ ] The walkthrough has camera and voiceover and meets its time limit.

Target a complete submission package by 7 October 2026, 15:15 Pakistan time.
Keep the remaining two hours for verification and fixes.
