import assert from "node:assert/strict";
import { after, afterEach, mock, test } from "node:test";
import { mkdtempSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { OAuth2Client, type Credentials } from "google-auth-library";
import { authorizedGoogleClient, beginGoogleAuth, CALENDAR_SCOPE, completeGoogleAuth, createSession,
  calendarFailure, disconnectCalendar, HttpError, mergeGoogleTokens, publicUser, requestUser } from "../lib/capture/auth";
import { upcomingMeetings } from "../lib/capture/calendar";
import { decrypt, digest, encrypt } from "../lib/capture/crypto";
import { readDocument, storageStatus, writeDocument } from "../lib/capture/store";
import type { CaptureUser } from "../lib/capture/types";

const directory = mkdtempSync(path.join(os.tmpdir(), "accord-google-test-"));
const origin = "http://localhost:3000";
process.env.ACCORD_DATA_DIR = directory;
process.env.ACCORD_APP_URL = origin;
process.env.GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
process.env.GOOGLE_CLIENT_SECRET = "test-secret";
delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SECRET_KEY;
delete process.env.ACCORD_ENCRYPTION_KEY;
afterEach(() => mock.restoreAll());
after(() => rm(directory, { recursive: true, force: true }));

async function account(id: string, credentials: Credentials = { access_token: "old-access", refresh_token: "private-refresh", scope: CALENDAR_SCOPE }) {
  const user: CaptureUser = { id, name: "Google test", email: "test@example.invalid", googleSub: id,
    local: false, calendarConnected: true, googleTokens: await encrypt(credentials) };
  await writeDocument("user", id, id, user);
  return user;
}
function fakeGoogleIdentity(nonce: string, sub = "verified-subject", scope = CALENDAR_SCOPE) {
  const getToken = mock.method(OAuth2Client.prototype, "getToken", async () => ({ tokens: {
    access_token: "private-access", refresh_token: "private-refresh", id_token: "identity-token", scope,
  }, res: null }));
  mock.method(OAuth2Client.prototype, "verifyIdToken", async () => ({ getPayload: () => ({
    sub, email: "test@example.invalid", email_verified: true, name: "Google test", nonce,
  }) }));
  return getToken;
}

test("Google consent uses identity, read-only calendar access, nonce, state, and PKCE", async () => {
  const flow = await beginGoogleAuth(origin);
  const params = new URL(flow.url).searchParams;
  const transaction = await decrypt<{ state: string; nonce: string; verifier: string }>(flow.transaction);
  assert.equal(params.get("redirect_uri"), `${origin}/api/auth/google/callback`);
  assert.equal(params.get("access_type"), "offline");
  assert.equal(params.get("state"), transaction.state);
  assert.equal(params.get("nonce"), transaction.nonce);
  assert.equal(params.get("code_challenge_method"), "S256");
  assert.ok(params.get("code_challenge"));
  assert.ok(transaction.verifier);
  assert.deepEqual(params.get("scope")?.split(" "), ["openid", "email", "profile", CALENDAR_SCOPE]);
  assert.equal(flow.transaction.includes("test-secret"), false);
});

test("invalid state, expired requests, and a wrong identity nonce cannot create a session", async () => {
  const flow = await beginGoogleAuth(origin);
  const tx = await decrypt<{ state: string; nonce: string }>(flow.transaction);
  const tokenCall = fakeGoogleIdentity("wrong-nonce");
  for (const state of ["unrelated", tx.state.replace(/^./, "é"), ""]) {
    await assert.rejects(completeGoogleAuth(origin, "code", state, flow.transaction), /sign-in request expired/);
  }
  await assert.rejects(completeGoogleAuth(origin, "code", tx.state, await encrypt({ ...tx, expiresAt: 0 })), /sign-in request expired/);
  assert.equal(tokenCall.mock.callCount(), 0);
  await assert.rejects(completeGoogleAuth(origin, "code", tx.state, flow.transaction), /could not verify/);
});

test("verified Google sign-in stores encrypted credentials and exposes only account details", async () => {
  const flow = await beginGoogleAuth(origin);
  const tx = await decrypt<{ state: string; nonce: string }>(flow.transaction);
  fakeGoogleIdentity(tx.nonce);
  const session = await completeGoogleAuth(origin, "code", tx.state, flow.transaction);
  assert.equal(session.user.calendarConnected, true);
  assert.equal((await requestUser(new Request(`${origin}/api/connection`, { headers: { cookie: `accord_session=${session.token}` } })))?.id, session.user.id);
  const saved = (await readDocument<CaptureUser>("user", session.user.id))!.data;
  assert.equal(saved.googleTokens?.includes("private-refresh"), false);
  assert.equal((await decrypt<Credentials>(saved.googleTokens!)).refresh_token, "private-refresh");
  assert.equal((await decrypt<Credentials>(saved.googleTokens!)).id_token, undefined);
  assert.equal("googleTokens" in publicUser(saved), false);
  assert.equal("googleSub" in publicUser(saved), false);
  assert.equal("googleConnectionId" in publicUser(saved), false);
});

test("identity-only consent signs in without falsely reporting calendar access", async () => {
  const flow = await beginGoogleAuth(origin);
  const tx = await decrypt<{ state: string; nonce: string }>(flow.transaction);
  fakeGoogleIdentity(tx.nonce, "identity-only", "openid email profile");
  const session = await completeGoogleAuth(origin, "code", tx.state, flow.transaction);
  assert.equal(session.user.calendarConnected, false);
  await assert.rejects(authorizedGoogleClient(session.user, origin), (error: unknown) => error instanceof HttpError && error.code === "google_reconnect_required");
});

test("calendar reconnection cannot switch the signed-in Google account", async () => {
  const user = await account(`google-${digest("original-account").slice(0, 40)}`);
  const flow = await beginGoogleAuth(origin, user);
  const tx = await decrypt<{ state: string; nonce: string }>(flow.transaction);
  fakeGoogleIdentity(tx.nonce, "another-account");
  await assert.rejects(completeGoogleAuth(origin, "code", tx.state, flow.transaction), (error: unknown) => error instanceof HttpError && error.code === "google_account_mismatch");
  assert.equal((await readDocument<CaptureUser>("user", user.id))?.data.calendarConnected, true);
});

test("refresh keeps the long-lived credential when Google returns only a new access token", async () => {
  assert.equal(mergeGoogleTokens({ refresh_token: "retained" }, { refresh_token: undefined }).refresh_token, "retained");
  const user = await account("refresh-account");
  mock.method(OAuth2Client.prototype, "getAccessToken", async function(this: OAuth2Client) {
    this.setCredentials({ access_token: "new-access", expiry_date: Date.now() + 3600_000 });
    return { token: "new-access" };
  });
  await authorizedGoogleClient(user, origin);
  const saved = (await readDocument<CaptureUser>("user", user.id))!.data;
  const credentials = await decrypt<Credentials>(saved.googleTokens!);
  assert.equal(credentials.access_token, "new-access");
  assert.equal(credentials.refresh_token, "private-refresh");
});

test("revoked Google access requests reconnect while preserving the Accord session", async () => {
  const user = await account("revoked-account");
  const session = await createSession(user);
  mock.method(OAuth2Client.prototype, "getAccessToken", async () => { throw { response: { status: 400, data: { error: "invalid_grant" } } }; });
  await assert.rejects(authorizedGoogleClient(user, origin), (error: unknown) => error instanceof HttpError && error.code === "google_reconnect_required");
  const saved = (await readDocument<CaptureUser>("user", user.id))!.data;
  assert.equal(saved.calendarConnected, false);
  assert.equal(saved.calendarNeedsReconnect, true);
  assert.equal(saved.googleTokens, undefined);
  assert.equal((await requestUser(new Request(`${origin}/api/connection`, { headers: { cookie: `accord_session=${session}` } })))?.id, user.id);
});

test("calendar disconnect revokes Google access and preserves the account and its records", async () => {
  const user = await account("disconnect-account");
  const session = await createSession(user);
  await writeDocument("capture", "disconnect-test-record", user.id, { title: "Keep this recording" });
  const revoke = mock.method(OAuth2Client.prototype, "revokeToken", async () => ({ data: {} }));
  await disconnectCalendar(user, origin);
  assert.equal(revoke.mock.calls[0].arguments[0], "private-refresh");
  assert.equal((await readDocument<CaptureUser>("user", user.id))?.data.calendarConnected, false);
  assert.equal((await readDocument("capture", "disconnect-test-record"))?.owner_id, user.id);
  assert.equal((await requestUser(new Request(`${origin}/api/connection`, { headers: { cookie: `accord_session=${session}` } })))?.id, user.id);
});

test("a delayed calendar failure cannot remove credentials from a later reconnection", async () => {
  const old = await account("reconnected-calendar");
  await writeDocument("user",old.id,old.id,{...old,googleConnectionId:"new-connection",googleTokens:await encrypt({refresh_token:"new-refresh"})});
  await assert.rejects(calendarFailure(old,{response:{status:401}}), (error: unknown) => error instanceof HttpError && error.code === "google_calendar_changed");
  const saved = (await readDocument<CaptureUser>("user",old.id))!.data;
  assert.equal(saved.calendarConnected,true);
  assert.equal((await decrypt<Credentials>(saved.googleTokens!)).refresh_token,"new-refresh");
});

test("calendar follows pages and omits ended, declined, cancelled, and duplicate calls", async () => {
  const user = await account("calendar-pages");
  mock.method(OAuth2Client.prototype, "getAccessToken", async () => ({ token: "access" }));
  const now = Date.now();
  const event = { id: "future", summary: "Upcoming call", hangoutLink: "https://meet.google.com/abc-defg-hij",
    start: { dateTime: new Date(now + 3600_000).toISOString() }, end: { dateTime: new Date(now + 7200_000).toISOString() } };
  let pages = 0;
  mock.method(OAuth2Client.prototype, "request", async (options: { url: string }) => {
    pages++;
    const params = new URL(options.url).searchParams;
    assert.equal(params.get("singleEvents"), "true");
    assert.equal(params.get("orderBy"), "startTime");
    if (pages === 1) return { data: { items: [event,
      { ...event, id: "ended", start: { dateTime: new Date(now - 7200_000).toISOString() }, end: { dateTime: new Date(now - 3600_000).toISOString() } },
      { ...event, id: "declined", attendees: [{ self: true, responseStatus: "declined" }] },
      { ...event, id: "cancelled", status: "cancelled" }], nextPageToken: "page-two" } };
    assert.equal(params.get("pageToken"), "page-two");
    return { data: { items: [event, { ...event, id: "other" }] } };
  });
  const meetings = await upcomingMeetings(user, origin);
  assert.equal(pages, 2);
  assert.deepEqual(meetings.map(meeting => meeting.id), ["future", "other"]);
});

test("temporary calendar failures preserve credentials and return an actionable error", async () => {
  const user = await account("busy-calendar");
  mock.method(OAuth2Client.prototype, "getAccessToken", async () => ({ token: "access" }));
  mock.method(OAuth2Client.prototype, "request", async () => { throw { response: { status: 429 } }; });
  await assert.rejects(upcomingMeetings(user, origin), /Google Calendar is busy/);
  assert.equal((await readDocument<CaptureUser>("user", user.id))?.data.calendarConnected, true);
});

test("incomplete cloud settings fail closed instead of saving accounts to local files", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  try {
    const health = await storageStatus();
    assert.equal(health.ready, false);
    assert.equal(health.mode, "supabase");
    await assert.rejects(beginGoogleAuth(origin), /Cloud storage needs setup/);
    await assert.rejects(writeDocument("user", "must-not-save", "must-not-save", {}), /Set ACCORD cloud storage/);
  } finally { delete process.env.SUPABASE_URL; }
});
