# Accord

Accord is a meeting review web app for the 8x Fathom assignment.
Record a Google Meet call in Chrome. Open its audio, transcript, notes, tasks,
and marked moments in one meeting page. Select a note to hear its source.

[Open the live app](https://accord-pi-hazel.vercel.app/meetings).
The supplied meetings can be reviewed without an account. Google sign-in is
in Testing and accepts approved test accounts only.

## Current status

The Chrome capture flow works on the local test server. A real solo Meet call
produced a 4:44 recording, 20 transcript passages, three action items, and four
moments marked during capture. Outcome and Brief have separate saved Gemini
results. Source playback was checked in Chrome.

The candidate also completed a short Google Meet recording and processing test
on the production host. The walkthrough shows the recording, its processed
meeting, and source playback. This was a solo call with controlled test audio.

Google sign-in and calendar routes are implemented. The Google client is
configured in project `accord-510919`, and its keys are saved in `.env`.
Live sign-in, calendar consent, calendar loading, disconnection, and same-account
reconnection passed. The primary calendar has no upcoming Meet calls.
The private Supabase store is
configured and tested in project `txijzjbhcnwushfmjjki`. A separate worker
processed supplied audio from the cloud queue. Private playback, saved edits,
account separation, and cropped clip access passed live HTTP checks.
The local recording test used a local account. It did not test Google sign-in.
See [capture tests](research/CAPTURE-VERIFICATION.md) and
[account and cloud tests](research/INTEGRATIONS-VERIFICATION.md).

## Implemented features

- Separate Meetings, Saved moments, Shared clips, Record, and meeting pages.
- Chrome extension detection of joined Google Meet calls, with a prompt and
  visible controls. A person starts each recording from the extension.
- Meet tab audio and optional microphone input. Timer, pause, resume, microphone
  control, marked moments, Stop and save, local backup, and upload retry.
- Audio saved in the extension before upload. Closing the popup does not stop
  capture. Leaving the call stops it. Upload parts can be retried.
- Gemini transcription of the new audio, with approximate times and neutral
  voice labels. Gemini then generates notes and tasks from that transcript.
- Separate Outcome and Brief summaries, with source playback and regeneration.
  Action items has the single task list. Summary changes preserve task edits.
- Private server storage for captured meetings and edits. Public examples keep
  their review changes in each browser.
- Google account sessions and encrypted calendar credentials. Upcoming Meet
  calls, calendar refresh, disconnect, and reconnection after expired access.
  These account flows have provider-mocked tests and a live account test.
- Search across accessible meetings, transcript search, speaker filters, audio
  seeking, notes copy and download, task edits, completion, and review.
- Saved moments with editable ranges, preview, and Undo. Captured clip links
  contain a separate cropped audio file and expire after seven days. Editing or
  removing the source moment revokes its old clip link.
- A public one-hour ICSI reference with eight corpus speakers and 2,557 timed
  transcript passages. Cedar and Maple remain labelled controlled test records.

## Run locally

Use Node.js 24. The build was checked with Node.js 24.20.0.
Install dependencies, copy `.env.example` to `.env`, and set `GEMINI_API_KEY`.

```bash
npm install
npm run build
npm start
```

Open [Accord](http://localhost:3000). The supplied examples work without a login
or an AI key. New transcription and summary requests need the server key.

For a local capture test, set these values in `.env` before starting the server:

```dotenv
ACCORD_APP_URL=http://localhost:3000
ACCORD_LOCAL_MODE=true
```

Open `/record` and select **Start a local recording test**. Local mode only works
on a loopback address and is refused on Vercel. Local data is saved in `.accord/`
by default. Set `ACCORD_DATA_DIR` to use another private directory. Keep the local
server and its data directory when you want to reopen a recording.

The completed test in this workspace uses `http://localhost:3003` and the private
local directory `/tmp/accord-capture-qa`. The extension is connected to that
origin. A server on a different port needs its own connection approval.

## Connect Google and cloud storage

The schema is already installed in this workspace's dedicated Accord project.
Its private database and audio bucket are available. The two Google client
values are saved in `.env`. Local Google sign-in and calendar access were tested.
See [the setup guide](supabase/README.md) for the exact settings.

1. Use a dedicated Supabase project for Accord. Apply `supabase/accord.sql`.
   It creates private document tables, job locks, and a private audio bucket.
2. Set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` on the server. Use the secret
   key or legacy service-role key. A publishable key is insufficient for this
   store. Never put the secret key in browser code. See [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).
3. Generate one 32-byte base64 key and save it as `ACCORD_ENCRYPTION_KEY` in the
   server environment. The web server and recording worker must use the same
   key. Keep it when restarting; it encrypts stored Google credentials.
4. Enable Google Calendar API in the Google project. Create a Web application
   OAuth client. Add the exact callback, for example
   `http://localhost:3000/api/auth/google/callback`, or the same path on the
   public HTTPS origin. Configure the consent screen and test users as needed.
   See [Google's web-server OAuth guide](https://developers.google.com/identity/protocols/oauth2/web-server).
5. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and the exact `ACCORD_APP_URL`.
   Set `ACCORD_LOCAL_MODE=false` for the public app. Restart the server.
6. Open `/record`, select **Connect Google**, and allow calendar event read
   access. Accord requests identity information and calendar events only.
   It shows upcoming Meet calls from the primary calendar for the next seven days.
   Granting identity access alone signs you in and shows **Allow calendar access**.
   **Disconnect calendar** revokes Google access and keeps your Accord session
   and recordings. Use **Reconnect calendar** after Google access expires.
7. Complete the extension connection below. Record a short call, then check
   that its private meeting survives reload and a new server session.

Public capture refuses a local file store. It needs the cloud configuration.
No cloud schema was applied to another application's Supabase project.

## Install and use Accord Meet

The extension is supplied as source and a downloadable ZIP. It is not published
in the Chrome Web Store. Use desktop Chrome 116 or later.

1. On `/record`, select **Download extension** and unzip it. Or use the source
   folder `extension/accord-meet` from this repository.
2. Open Chrome Extensions. Enable Developer mode. Select **Load unpacked** and
   choose that folder. Pin Accord Meet and reload the Accord page.
3. Select **Connect extension** in Accord. In the extension's connection page,
   approve this exact Accord origin. Its limited token cannot open private
   meeting pages. The Google and Gemini keys stay on the server.
4. Enable the microphone from the extension if you want to record your words.
   Join a Google Meet call. Click Accord in the toolbar, then **Start recording**.
5. Mark useful moments while recording. Use Accord's microphone control when
   you mute yourself. Its microphone control is separate from Meet's mute state.
6. Select **Stop and save**. Open `/record` to see upload and processing progress.
   Open the meeting when it is ready. If upload fails, use **Retry upload** in
   the extension. A local audio backup remains available.

Chrome requires a person to invoke tab capture. A detected call or calendar
entry does not start recording silently. See [Chrome tab capture](https://developer.chrome.com/docs/extensions/reference/api/tabCapture).

## Recording processing and hosting

The Node server uses FFmpeg to make continuous audio times and cropped clips.
`ffmpeg-static` supplies a binary for the install platform. Install dependencies
on the target operating system. `FFMPEG_PATH` can select another installed binary.

For short recordings, the server starts processing after the upload finishes.
The route requests a 300-second runtime, but the host must support it. For long
recordings on a host with short request limits, set `ACCORD_EXTERNAL_WORKER=true`
on the web server and run a persistent Node worker:

```bash
npm run capture:worker
```

Give the worker the same cloud, Gemini, origin, and encryption settings. It reads
queued or stalled jobs and claims a lock before processing them. Use a host that
supports a persistent process. Do not run this worker as a short scheduled request.
The current limits are two hours, 128 MiB per recording, and 3 MiB per uploaded
part. These are input limits. A real hour-long capture and its processing time
remain untested.

## Speaker and timing limits

New recordings use AI voice groups such as **Speaker 1**. These are not verified
participant identities. A spoken name does not assign that name to a voice.
A solo call with test audio is not evidence of several participants. The meeting
page therefore describes the result as AI voice labels.

New transcript times are approximate. Source playback works, but exact word
alignment is not established. The ICSI example uses corpus times and corpus
speaker labels. Cedar and Maple use script roles and approximate audio anchors.
No real eight-person, one-hour Meet capture was tested.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run test:capture
npm run test:extension
npm run test:google
npm run build
```

Ten feature tests, eleven capture tests, two extension harness tests, and twelve
Google account tests pass. Google tests mock the provider. They cover consent
parameters, rejected state and nonce, encrypted credentials, partial consent,
refresh, calendar pagination, disconnect, and a stale failure after reconnection.
Capture tests include ownership, session and extension scope, upload retry,
range requests, malformed edits, actual FFmpeg pause-gap normalization, clip
cropping, link revocation, and saved review counts. The extension tests use mocked Chrome and media
interfaces; they do not replace the real Chrome recording test.

`npm run test:capture:live` sends the supplied Maple audio to Gemini and writes
an isolated local test account. `npm run test:capture:http` uses that private
account to test saved edits, anonymous clip access, and account separation. The
HTTP test requires the live harness result and its server to remain available.
It restores its review changes. Neither command prints the session cookie.

`npm run test:cloud:live` uses the configured private Supabase project and a local
server at port 3004. Start the server with `ACCORD_EXTERNAL_WORKER=true`,
`ACCORD_LOCAL_MODE=false`, and the matching `ACCORD_APP_URL`. The test creates
disposable QA accounts, uploads the supplied Maple source, runs a separate
worker with real Gemini processing, and checks private playback, durable edits,
clip access, and account separation. It removes only its own test records and
audio. It does not test Google consent or a live browser recording.

Phone layout checks apply to the web app. Recording remains a desktop Chrome
feature. Populated calendar calls, access-token expiry refresh, live microphone denial, and a real
Chrome restart during a failed upload remain release checks. The unit harness
covers retry and pause behavior, but those failure cases need browser tests.
Cloud processing passed on a local persistent worker. Live HTTPS sign-in and
calendar loading passed on Vercel. The candidate completed a short recording
and processing test on the production host. A real hour-long capture remains
untested.

## Vercel hosting

Live app: https://accord-pi-hazel.vercel.app

On 8 October 2026, the approved server settings were added to Production and
the app was redeployed with the Vercel CLI. Google Cloud accepts the live
origin and `/api/auth/google/callback`. The live test account signed in,
loaded its primary calendar, and stayed connected after a page reload.
Private cloud storage checks passed. The calendar had no upcoming Meet calls.
Google OAuth remains in Testing; only approved Google test accounts can sign in.

Deploy Production with:

```bash
npx vercel deploy --prod --yes --scope shayankhanx1xgmailcoms-projects
```

Preview: https://accord-preview-shayankhanx1x.vercel.app

The Vercel CLI deployed the app on 8 October 2026. The configured preview build
passed. Project `accord` uses Node.js 24 and Fluid Compute. Server keys are saved
as protected Vercel environment variables; `.env` is excluded from uploads.
The preview uses private Supabase storage and disables local account mode.

Redeploy with the Vercel CLI, then assign the fixed address to the returned URL:

```bash
npx vercel deploy --target preview --yes --scope shayankhanx1xgmailcoms-projects
npx vercel alias set <deployment-url> accord-preview-shayankhanx1x.vercel.app --scope shayankhanx1xgmailcoms-projects
```

The preview has a separate `ACCORD_APP_URL`. Its Google callback is registered,
but it has not received the production sign-in test. Anonymous visitor access
and live recording processing on this host still need checks.
The current recording routes have a 300-second processing limit. The local
persistent-worker test does not prove that long recordings finish within it.

## Data and attribution

The long reference is ICSI Meeting Corpus Bmr007, used under CC BY 4.0.
See [source and licence details](research/data/ICSI-ATTRIBUTION.md).
Fathom research and comparison screenshots are in `research/`. They show tested
interactions and recorded limits. They do not establish better AI accuracy.

## Agent capture record

The repository includes the complete restored assignment logs in `.agent-logs/`.
See [capture tests](CAPTURE-TEST.md) and [the recovery record](CAPTURE-RECOVERY.md).
The recovery record explains missing capture and commit history. It does not
claim that recovered logs were committed at the time of their original turns.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui with Base UI,
TanStack Virtual, Google GenAI SDK, Google Auth Library, FFmpeg, and Supabase.
The capture extension uses Chrome Manifest V3 and IndexedDB.
