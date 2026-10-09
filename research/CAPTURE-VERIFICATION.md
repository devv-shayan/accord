# Google Meet capture verification

Checked: 7 October 2026.

## Scope and status

The local desktop Chrome flow works from a real Google Meet recording to a saved
meeting. Private cloud storage is now configured and tested in a dedicated
Supabase project. Google sign-in is implemented but has no real account test.
See [the later account and cloud checks](INTEGRATIONS-VERIFICATION.md).

The extension detects a joined call and offers capture controls. A person must
click Start recording. This test does not establish silent or automatic capture.
There is no native desktop app or meeting bot.

## Real Chrome recording

The user loaded `extension/accord-meet`, approved the connection to
`http://localhost:3003`, and approved the Meet microphone test. The user started
the capture, supplied the test speech or audio, marked moments, and stopped it.
The Include my microphone option was selected.

- Saved meeting: `rec-9c6155b9-ae6b-4667-9c0c-55cc99e2da59`.
- Meet title: `agb-hyxf-yem`.
- Audio length: 284.52 seconds, shown as 4:44 in the player.
- Transcript: 20 timed passages, with four neutral AI voice groups.
- Action items: three.
- Moments marked during the call: four.
- Outcome and Brief: separate saved Gemini results.
- A note's Listen control sought to its source audio and started playback.
- The selected source range stopped at its end.
- A fresh page opened without browser errors or warnings after the date fix.
- Library search for `200 sample` returned this meeting and its transcript
  passage. The passage link opened the transcript at 2:40 with the search text.
- All four capture marks appeared on Saved moments. The tested Maple clip
  appeared on Shared clips.

This was a solo Meet call. Four AI voice labels do not establish four people.
Independent live tab and microphone input tests were not done. New transcript
times remain approximate. This test establishes working audio playback and
source seeking, but not exact word alignment or verified speaker identities.

Local test data is in `/tmp/accord-capture-qa`. That directory and the server must
remain available to reopen this private meeting. No Google account was connected.

## Supplied audio pipeline and clip

The separate live pipeline test used `public/audio/maple-source.mp3` and the real
Gemini API. It tested upload, audio normalization, transcription, notes, tasks,
and a saved moment. It did not capture that audio through Chrome.

- Saved test meeting: `rec-37774659-dff4-402e-9a84-a5076c78fe31`.
- Processed audio length: 54.13 seconds.
- Selected clip: 15 to 45 seconds.
- Actual cropped file length: 30.008 seconds.
- The clip page played that file and stopped at its end.
- Anonymous HTTP requests could open the clip page and audio.
- Anonymous access to the private page, full audio, and review state was denied.
- Another test account could not open or search the private meeting.
- Editing a shared moment revoked its old clip link.

The Chrome clip check used the existing signed-in profile. The anonymous access
check used HTTP requests without a session cookie. A deployed clip check in a
separate signed-out browser remains open.

Task completion persisted after a page reload and a server read. The task was
restored to its original incomplete state after the test. Cancelled task edits
did not replace the saved task.

## Automated checks

- Ten feature tests pass.
- Eleven capture tests pass.
- Two extension harness tests pass.
- The HTTP regression test passes.
- Lint, TypeScript checks, and the production build pass.

Capture tests check session and extension token scope, account ownership, OAuth
state expiry, encrypted credentials, calendar link validation, neutral voice
labels, time range validation, audio seeking, duplicate upload parts, retry,
processing locks, malformed edits, clip cropping, and link revocation.

A real FFmpeg test creates two seconds of audio with a five-second timestamp
gap. Normalization removes the gap so a saved mark uses the audio timeline.
Another test checks that private library review counts use saved task reviews,
the selected summary, and the current generated task revision.

The extension harness mocks Chrome and media APIs. It checks source binding,
local audio backup, offline upload recovery, pause timing, and device release.
It does not prove those failure cases in real Chrome.

The original capture pass checked worker startup. The later cloud pass processed
a real cloud queue with a separate worker on this computer. It does not establish
deployed host capacity. See INTEGRATIONS-VERIFICATION.md.

## Corrections during verification

- Offscreen extension requests now use the runtime message path.
- Audio is stored before network upload so upload failure has a local backup.
- Private review saves send the state shape that the server validates.
- Ready recordings reject processing retry and keep their saved review changes.
- Shared audio is a cropped file. It does not expose the full private source.
- Cancelled task edits reset when the editor opens again.
- Date text uses the same first render on the server and in the browser.
- Private meeting cards use saved review counts and say AI voice labels.

## Web layout checks

The Record page, private meeting page, and public clip page were checked at a
390-pixel viewport. Their content fit the viewport without horizontal overflow.
This is a web layout check. Capture still requires desktop Chrome.

## Remaining live checks

- Google consent, calendar events, expired token refresh, and reconnect.
- Persistence on the intended deployed host. The dedicated Accord project's
  schema, private storage, and restart persistence passed the later local test.
  No schema was applied to another application's project.
- A cloud worker processing a queued recording on the intended host.
- Separate live tab and microphone audio.
- Microphone denial, missing tab audio, and capture interruption.
- A real network outage or Chrome restart during upload.
- A real hour-long Meet recording and its processing time.
- Public deployment and a clip opened by a separate signed-out browser.

No Git commit or staging action was made during this capture work.

## Screenshots

- [Real captured meeting](screenshots/capture-real-meet-review.jpg).
- [Private meeting at phone width](screenshots/capture-real-meet-mobile.jpg).
- [Record setup at phone width](screenshots/capture-setup-mobile.jpg).
- [Cropped clip](screenshots/capture-saved-clip.jpg).
- [Cropped clip at phone width](screenshots/capture-public-clip-mobile.jpg).
- [Extension connection](screenshots/capture-extension-setup.jpg).
