# Account and cloud verification

Checked: 8 October 2026.

## Status

Private Supabase storage is configured and passed a live test. Google sign-in,
calendar access, disconnect, and reconnection are implemented and have twelve
provider-mocked tests. The Google client is configured, and both keys are saved
in the ignored `.env` file. Live sign-in, approved calendar consent, calendar
loading, disconnection, and same-account reconnection passed in Chrome.

The live cloud test used disposable server-created QA accounts and supplied
Maple audio. It does not establish Google consent or a new browser recording.
The earlier real Meet capture is in CAPTURE-VERIFICATION.md.

## Cloud project

- Dedicated project: `txijzjbhcnwushfmjjki`.
- Migration: `20261007180112_accord_private_recordings`.
- Tables: `accord_documents` and `accord_locks`.
- Row security is enabled. `anon` and `authenticated` have no table read access.
  `service_role` has access through the Accord server.
- Bucket: `accord-recordings`, private, with a 128 MiB file limit.
- Google credentials are encrypted. Session and clip tokens are stored as hashes.
- The server checks storage access before enabling account setup. Partial cloud
  configuration fails instead of silently saving account data on this computer.

Supabase's security advisor has no WARN or ERROR findings. It reports two INFO
items for RLS tables with no policies. This is intentional: these tables allow
server access only, with browser roles explicitly revoked. Ownership is checked
by Accord's authenticated server routes.

## Live cloud test

Command: `ACCORD_TEST_URL=http://localhost:3004 npm run test:cloud:live`.
The isolated production server had cloud storage enabled, local account creation
disabled, and `ACCORD_EXTERNAL_WORKER=true`.

Passed checks:

1. Account sessions are stored in the private database. The connection response
   contains public account details and no server key.
2. A held cloud lock rejects a concurrent claim and is released after use.
3. Two supplied audio parts upload to the private bucket. Duplicate upload is
   accepted. Downloaded part hashes match the stored values.
4. The stopped capture enters a durable cloud queue. A separate worker reads
   that queue and runs actual Gemini transcription and note generation.
5. The processed audio has 54.13 seconds, seven transcript passages, and two
   action items. These counts describe this run; they are not accuracy claims.
6. Owner playback supports byte-range seeking. Anonymous direct bucket access
   rejects the full recording.
7. A changed moment label and task completion survive reload. A new server
   process reads the same edited record and the same audio hash.
8. An anonymous Accord clip page and its cropped audio return successfully.
   The cropped file is smaller than the complete recording.
9. Anonymous private audio and state return 401. Another account receives 404.
   Anonymous private pages return 404. Another account's search omits the record.
10. A cross-origin state write returns 403. An extension token cannot read the
    private review state.
11. Editing the source moment revokes its old clip. The old audio link returns 404.
12. The worker stops and disposable test accounts, sessions, records, and audio
    are removed. A separate database query confirms zero QA documents, zero
    QA audio objects, and zero remaining locks.

## Google account tests

Twelve tests pass with the Google provider mocked. They check identity and
read-only calendar scopes, PKCE, state, nonce, expiry, encrypted credentials,
identity-only consent, same-account reconnection, retained refresh tokens,
revoked access, disconnect, delayed failures after reconnection, calendar pages,
cancelled and declined events, temporary errors, and incomplete cloud setup.
They preserve the Accord session and saved recordings when calendar access ends.

These tests establish application behavior. A live Google test is still needed
for populated event data and access-token expiry refresh.
Setup steps are in [supabase/README.md](../supabase/README.md).

## Live Google configuration

- Dedicated Google Cloud project: `accord-510919`, name Accord.
- The user completed Google Auth registration and enabled Google Calendar API.
- Audience: External, Testing. Test user: `devvshayan@gmail.com`.
- Web client: Accord Local Web.
- JavaScript origin: `http://localhost:3000`.
- Redirect: `http://localhost:3000/api/auth/google/callback`.
- Scopes: `openid`, email, profile, and `calendar.events.readonly`.
  The consent page describes the calendar scope as viewing events on all calendars.
  Accord requests events from the primary calendar only.
- The one-time client secret and client ID were saved directly to `.env`.
  The secret was not displayed in the response or added to project documents.
- The local app enables Connect Google and confirms private cloud storage access.
- Real Google sign-in shows Accord and accepts the configured test account.
  The user approved calendar read access before the permission was granted.
- The callback returns to `/record` with the account and Calendar connected.
  The real primary-calendar request returns the empty state: no Meet calls in
  the next seven days. Refresh and page reload preserve the connection.
- Disconnect calendar removes the grant and calendar list while keeping the
  Accord session. Same-account consent restores the connection and calendar
  loading. The app is left signed in and connected.

This establishes client setup, an Accord account session, a real calendar
request, manual refresh, grant removal, and reconnection. It does not establish
populated event rows or access-token expiry refresh. No calendar event was created.

During reconnection, React reported a recoverable hydration mismatch. The error
shows an injected `definer-bubble-host` element in the app tree. This is evidence
of browser extension DOM interference. It did not stop authentication or calendar
loading. The app was reloaded; no account or calendar error was shown.

Screenshot: `screenshots/integrations-google-connected.jpg`.

## Web checks

The `/record` page shows **Private cloud storage · Connected** only after actual
database and bucket checks succeed. Google setup is disabled with a clear
message while credentials are missing. The installed Chrome extension is detected.
The existing three setup steps remain in place. Phone width is 390 CSS pixels.
The page document is also 390 pixels wide, with no horizontal overflow.
The cancellation message and Retry control were checked through the known
application error route. Retry removes the message and loads the connection.
This checks the application UI; it does not establish a real Google cancellation.
The final browser page has no console warnings or errors.

Screenshots:

- `screenshots/integrations-setup-desktop.jpg`
- `screenshots/integrations-setup-mobile.jpg`

The browser viewport was reset after the check. Capture still requires desktop
Chrome. The phone check applies to the web pages.

Live HTTP checks also confirm that missing Google setup returns 503, a cross-origin
sign-in request returns 403, and cancelled or invalid callbacks redirect with
safe application errors. Callback responses use `no-store` and `no-referrer`.

Lint, TypeScript checking, and the final production build pass. The complete
automated suite has 35 passing tests: ten review, eleven capture, two extension,
and twelve Google tests. A scan of client JavaScript confirms that configured
server credential values are absent. The temporary cloud test server was stopped.
The main app remains available at `http://localhost:3000`.

## Live Vercel sign-in — 8 October 2026

The live address is https://accord-pi-hazel.vercel.app. Its first production
deployment lacked the server environment settings. Connect Google was disabled
and the page reported a missing `ACCORD_APP_URL`. The keys had been saved only
for Preview.

With the user's approval, the existing server keys were saved to Production,
the live origin was set, and the app was redeployed through the Vercel CLI.
Google Cloud saved the live origin and exact `/api/auth/google/callback` URI.
Existing localhost and preview callback entries were retained.

Vercel reports Ready for `dpl_9RAAt1ysT4jiTeJfrfjSXQQj5uJa`. The live browser
showed Google account selection and Google's unverified test-app notice. The
flow then returned to Accord with `devvshayan@gmail.com`, Calendar connected,
and successful private cloud storage checks. The primary calendar loaded with
no Meet calls in the next seven days. A page reload retained the account and
calendar connection. The extension was detected; it was not paired to the
live site during this sign-in test.

Screenshots: `screenshots/production-google-callback-saved.png` and
`screenshots/production-google-connected.png`.

This test does not establish anonymous visitor access, a live hosted recording,
or long recording processing. Google OAuth remains External, Testing, with
the existing approved test user. No scope or test-user list change was made.

## Remaining checks

- Real consent cancellation, populated calendar events, and access-token expiry refresh.
- Cloud recording processing on the intended deployment host.
- A captured browser recording saved through a real Google account.
- The earlier outstanding browser failure and long-recording checks.

No Git commit or staging action was made. Automatic session capture remains active.
