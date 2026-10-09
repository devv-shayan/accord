# Account and storage setup

The Accord schema is installed in Supabase project `txijzjbhcnwushfmjjki`.
The project URL is `https://txijzjbhcnwushfmjjki.supabase.co`.
Migration: `20261007180112_accord_private_recordings`.
The private audio bucket is `accord-recordings`.

Accord verifies Google sign-in on its server. Supabase stores account records,
sessions, encrypted Google credentials, meeting data, and private audio.
The server checks the account before returning a private recording.

## Google setup

Local setup is configured in Google Cloud project `accord-510919` (Accord).
Google Calendar API is enabled. The client is Accord Local Web. The audience is
External, Testing, with `devvshayan@gmail.com` as a test user. Both Google keys
are saved in the ignored `.env` file. Live sign-in, calendar consent, the empty
upcoming-call state, disconnection, and same-account reconnection passed.

The steps below describe these settings for another environment.

1. Open the Google Cloud project that will own Accord's OAuth client.
2. Enable **Google Calendar API**.
3. Open **Google Auth Platform**. Set the app name to Accord. Configure the
   audience. For an external app in testing, add your Google account as a test user.
4. Add the scopes `openid`, `email`, `profile`, and
   `https://www.googleapis.com/auth/calendar.events.readonly`.
5. Create an OAuth client with the type **Web application**.
6. Add `http://localhost:3000` as an authorized JavaScript origin. Add
   `http://localhost:3000/api/auth/google/callback` as an authorized redirect URI.
7. Put the client ID and client secret in the project's ignored `.env` file:

   ```dotenv
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   ACCORD_APP_URL=http://localhost:3000
   ACCORD_LOCAL_MODE=false
   ```

8. Keep the existing `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and
   `ACCORD_ENCRYPTION_KEY` values. Restart the server if it does not load the changes.
9. Open [Record a meeting](http://localhost:3000/record). Select **Connect Google**,
   choose the test account, and allow calendar read access.
10. Check **Calendar connected** and **Upcoming calls**. The list uses the primary
    calendar and the next seven days. It omits ended, cancelled, and declined calls.
11. Use **Disconnect calendar** to revoke Google access. Your Accord account and
    recordings remain available. Select **Allow calendar access** to reconnect.
    If access expires, Accord shows **Reconnect calendar**.

Use the same account when reconnecting a calendar. To use another account,
sign out first. The extension needs a new connection if the account changes.

Google testing mode can expire refresh tokens after seven days for calendar
scopes. A public release can also require Google's app verification. The live
Google test must record the actual account and consent state.

Official references:

- [Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server)
- [OAuth consent setup](https://developers.google.com/workspace/guides/configure-oauth-consent)
- [Google Calendar events](https://developers.google.com/workspace/calendar/api/v3/reference/events/list)
- [Google OAuth token expiry](https://developers.google.com/identity/protocols/oauth2#expiration)

## Server storage

Keep `SUPABASE_SECRET_KEY` and `ACCORD_ENCRYPTION_KEY` on the server. The web
server and recording worker must use the same encryption key. Preserve it across
restarts so that saved calendar credentials can still be read.

For another dedicated Accord project, apply [accord.sql](accord.sql) before
connecting an account. It enables row security and removes direct access for
anonymous and browser-authenticated database roles. Only the server role can
read or write the two tables. The private bucket has no public storage policy.
Shared clips use separate cropped files and expiring Accord links.

For deployment, set the exact public HTTPS origin in `ACCORD_APP_URL` and add
its `/api/auth/google/callback` URL to the Google client. Set
`ACCORD_LOCAL_MODE=false`. Check worker runtime, cloud access, and Google consent
on that host. Read [the main README](../README.md) for worker and extension setup.

## Verification

Run `npm run test:google` for provider-mocked account tests. These tests do not
need live Google credentials.

The live cloud test needs the configured Supabase and Gemini keys. Start an
isolated production server with a separate build directory:

```bash
ACCORD_BUILD_DIR=.next-cloud ACCORD_APP_URL=http://localhost:3004 ACCORD_EXTERNAL_WORKER=true npm run build
ACCORD_BUILD_DIR=.next-cloud ACCORD_APP_URL=http://localhost:3004 ACCORD_LOCAL_MODE=false ACCORD_EXTERNAL_WORKER=true npm run start -- --port 3004
```

In another terminal:

```bash
ACCORD_TEST_URL=http://localhost:3004 npm run test:cloud:live
```

The test creates disposable accounts, uploads supplied audio, starts a separate
worker, and checks private playback, saved edits, clip access, and account
separation. It removes only its own test documents and audio. It keeps an
unfinished processing record if recovery is needed. It does not print keys or
session cookies. Keep this test server separate from the live Google callback
at port 3000.
