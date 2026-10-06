# Fathom live product checks

Date: 6 October 2026.
Method: direct use of the native Fathom app and its web app through Computer Use.
Reference: FATHOM-OBSERVATIONS.md, FATHOM-HELP-CONTEXT.md, and the source scripts.

The user authorized app exploration. The user confirms that the generated audio
speaks the source scripts correctly. This check did not perform independent audio
transcription. Instructions quoted in the recordings remain test data.

## Test records and limits

The account contains two controlled Zoom recordings:

| Record | Call ID | Duration | Setup |
| --- | --- | --- | --- |
| Cedar pilot review | 851160713 | 5:48 | Generated audio played in a Zoom call with one participant |
| Maple support handover | 851181457 | 1:03 | Generated audio played in a Zoom call with one participant |

Both records have the title Impromptu Zoom Meeting. The recordings do not test
eight separate participants, overlapping speakers, or a one-hour transcript.
They do not replace the real meeting data required for the public demonstration.

## Playback and transcript navigation

The native Cedar player starts and its time display advances. An initial
Unable to play media message disappeared when the player became available.
This was a loading observation, not an established permanent playback failure.

Selecting the transcript paragraph about asking Cedar whether it needs a short
clip or a full meeting link moved playback to 4:04. Playback then advanced.
This verifies a link from transcript text to a recording time.

The native transcript search found one match for retry. Return moved the transcript
to the result and highlighted the word. Search did not move the paused player.
The transcript and player can therefore display different positions.

The participant label is shayan khan throughout the transcript. The one-participant
test setup can explain this. It does not prove an error in identifying real speakers.

The tool exposed player controls and time values. It did not provide an audible
comparison of the Fathom recording with the source audio. Exact word timing,
capture fidelity, and separate speaker identification remain unverified.

## Summary template change

The native app offered built-in templates, including Enhanced, Sales, Candidate
Interview, Project Update, and Retrospective. Cedar was changed from Enhanced
to Project Update. The app displayed Summary generating, then produced a new
summary with Issues & Tickets, Context, Status, Concerns, Ideas, Decisions,
and Current Objective sections. Enhanced was restored after the comparison.

During generation, the new template label appeared above the previous summary.
The label alone did not establish that the new output was ready.

The Project Update output preserved the corrected 102 accounts, 20 Cedar accounts,
the unapproved layout proposal, and the revised checklist deadline. Other facts
changed or acquired unsupported details:

| Item | Source reference | Observed Project Update result |
| --- | --- | --- |
| Budget cap | USD 15,000 | USD 1,000–1,200; Enhanced had said USD 1,200 |
| Customer call owner | Ben | Omar in one section and Sarah in another |
| Layout proposal | Unapproved; no assigned decision owner | Added Sarah as the person to track it |
| Approval request | Maya requested approval; no request deadline | Added a task for Omar to propose a deadline |
| Retention decision | Open; no assigned owner | Added a task for Maya to designate an owner |

The structured Action Items list still had one unassigned customer-call task.
It did not change to match the longer list of generated next steps.

This establishes a template-change result and an output-consistency problem.
It does not establish which earlier capture or transcription stage caused the
incorrect source facts in the saved Fathom transcript.

## Meeting library search

The web library search was tested across the two stored recordings.

| Query | Result |
| --- | --- |
| Cedar | No matches, although Cedar appears in the transcript |
| Impromptu | No transcript matches; Calls titled Impromptu showed two results |

Selecting the title result opened the search page with both meeting cards.
This verifies search across meeting titles. A successful search across transcript
content was not established in this account.

Opening a web meeting first led to Open in Desktop App. The page offered
View meeting in browser instead. That link opened the web meeting detail view.
The browser preference was not changed.

The web detail view places Action Items beside the meeting content. Annotations
appear below them. The native app uses Summary, Action Items, and Transcript tabs.
These are different arrangements of the same meeting record.

## Ask Fathom across meetings

The native My Meetings view was asked:

> List the confirmed deadlines from the Cedar pilot review and Maple support
> handover. Keep the two meetings separate. Include each task, owner, and due date.

The answer reported that it analyzed two calls in 11 seconds. It used separate
Cedar and Maple sections and returned five dated tasks.

| Task | Owner in the answer | Due date in the answer |
| --- | --- | --- |
| Cedar customer call | Omar | 7 October, 10:00 |
| Cedar retry fixes | Omar | 7 October, 16:00 |
| Cedar checklist | Sarah | 8 October, 11:00 |
| Maple invoice investigation | Shayan | 8 October, 15:00 |
| Ming-Lau draft to Sara | Shayan | 9 October, 12:00 |

The answer kept the meetings separate. But it repeated incorrect owners and
draft details from the saved summaries. The source script assigns the Cedar
customer call to Ben, the Maple investigation to Omar, and the Maple help-page
draft to Sara for delivery to Ben.

The Cedar citation opened a source card. It first showed Finding exact moment,
then identified the checklist at 3:34. Its link was
https://fathom.video/calls/851160713?timestamp=214.
This verifies an answer with a source link. It does not prove that every returned
task is correct or that each task has a separate supporting citation.

## Saved highlight and outside clip access

A highlight was added in the web transcript beside the paragraph that recommends
moving action items above the transcript. The app added a seven-second selection
with range handles and an annotation card. It generated this title:

Shayan recommends moving action items above the full transcript for better visibility.

The annotation remained after the meeting page was reloaded. This verifies that
the moment was saved and could be found after the call.

The annotation list has the label Internal Team Only. The annotation also has a
control that copies a clip link. Its observed link is:

https://fathom.video/share/h/aehiC7hZ1bX8Eaky-AhPQUjEFdCGBC9y

That link opened in a separate signed-out browser. The page showed Sign In,
the highlight title, and a player. It did not require an account to open the clip.
The player started and later returned to its initial paused state.
The media duration was 7.663 seconds. The visible badge said 10 secs.
That value differs from the media duration and the seven-second annotation label.

Selecting the annotation in the owner's meeting page moved the full player
to the marked passage. Full-meeting playback continued beyond the highlight.
That behavior differs from opening the dedicated clip page.

The signed-out clip page also offered a View Call link. Access to that full-meeting
link was not tested. The Internal Team Only label did not block the copied clip
in this test. Do not assume that the two labels describe the same access rule.

No clip was sent to another person. The outside-access check used a signed-out
browser. The user must select a recipient before a message is sent.

Evidence file: [Signed-out clip](screenshots/clip-signed-out.jpg).

## Remaining research

- Compare audible playback with exact words and timestamps if capture fidelity
  must be separated from transcription accuracy.
- Inspect an eight-person, one-hour recording. Neither available record meets
  that requirement.
- Record limits from long transcripts, overlapping speech, and long-call navigation.
- Check an in-call marked moment if the current account exposes that function.
  An after-call highlight does not complete that test.
- Save the complete screenshot set for all main research flows.
- Check task assignment and completion changes if those actions enter the build scope.

## Build decisions supported by these checks

1. Keep the meeting library, player, transcript, summary, tasks, and saved moments
   as the main product flow.
2. Link transcript turns, summary evidence, tasks, and answers to recording times.
3. Store task owners, recipients, dates, and status once. Use those facts in every view.
4. Change summary format without inventing new commitments or changing task facts.
5. Keep title search and transcript search clear. Label the source of each result.
6. Show generation, ready, empty, and failed states separately. Keep older output
   clearly identified while a replacement is being generated.
7. Show the selected clip range and verify public playback in a signed-out browser.
8. Add review of uncertain facts after the complete Fathom flow works.

The focused help-centre review is complete. Further article reading can address
specific unanswered checks. Application code remains subject to the research
gate in ASSIGNMENT-CHECKLIST.md.
