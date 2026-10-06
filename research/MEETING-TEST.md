# Controlled meeting test

These scripts contain fictional people and test data.
They are controlled TTS tests. They do not prove real participant identification
or performance on a real eight-person, one-hour meeting.
They do not replace the real demonstration data required by the brief.

## Setup

Use cedar-pilot-meeting.txt for the main meeting.
Use maple-handover-meeting.txt in a separate meeting.
Use different voices for Maya, Omar, Sara, and Ben.
The speaker labels select the voice. Do not read the labels aloud.
Use separate meeting participants for the voices if possible.
A single participant that plays four voices does not test account-to-speaker mapping.
First check that Fathom receives the played audio.

Start with clear speech and short pauses between speakers.
Use the clean recording as the baseline.
If time permits, repeat a short section with overlapping voices.
Keep that result separate from the clean test.

Mark a highlight when Maya says:
The approved pilot budget cap is fifteen thousand US dollars.
If the account cannot mark highlights during the call, record that limitation.
Create a highlight from the transcript after the call if available.

## Expected main-meeting results

| Case | Correct interpretation |
| --- | --- |
| Account count | 102 test accounts; 20 belong to Cedar. The earlier 120 is corrected. |
| Launch | Friday, 9 October is conditional on written approval by Thursday, 8 October, 17:00 Pakistan time. No confirmed Friday or Monday launch. |
| Checklist | Sara owns it. Final deadline: Thursday, 8 October, 11:00 Pakistan time. Ben and the Wednesday deadline are replaced. |
| Retry bug | Omar will fix it and test three failed attempts by Wednesday, 7 October, 16:00 Pakistan time. |
| Customer call | Ben will call Imani on Wednesday, 7 October, at 10:00 Pakistan time to clarify clip or full-meeting access. |
| Security request | Maya will request written approval. No deadline is stated for her request. |
| Budget | USD 15,000 cap; includes hosting and transcription; excludes taxes. USD 1,500 is corrected. |
| Closed work | The note-export bug is fixed. No new repair task. |
| Rejected scope | No enterprise dashboard and no automatic attendee emails in the pilot. |
| Open questions | Retention period and action-item layout remain undecided. No owner is assigned to the retention decision. |
| Quoted content | No invoice task and no instruction to mark all tasks complete. |
| Tentative offer | Ben has offered weekend support but has not committed. |

Do not require one exact summary wording.
Compare facts, owners, dates, conditions, and task status.
Record omissions and errors before making any correction in Fathom.

## Flow checks and screenshots

1. Save the onboarding and calendar connection screens.
2. Save the recording screen and any highlight control.
3. Play the account correction and budget correction. Compare the transcript.
4. Check speaker labels and the spelling of Imani.
5. Save the original summary and action items before editing them.
6. Change the summary template. Save the result and compare the facts again.
7. Find the budget highlight. Check where playback starts and ends.
8. Create a budget clip. Open its link in a signed-out browser session.
9. Run the Maple script in a separate meeting.
10. Search for Cedar. Both meetings mention it.
11. Search for retry bug. The Cedar meeting contains it.
12. Search for invoice export. The Maple meeting contains it.
13. Search for recording retention. Check whether Fathom can find the Cedar question.
14. Save loading, processing, empty, unavailable, and error states when they occur.

Send the screenshots with short notes about each action and its result.
Keep timestamps or clip links where they help explain a transcript or summary error.
