import "server-only";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { OAuth2Client, CodeChallengeMethod, type Credentials } from "google-auth-library";
import { cookies } from "next/headers";
import { appOrigin, googleConfigured, localMode, SESSION_COOKIE } from "./config";
import { decrypt, digest, encrypt, opaqueToken } from "./crypto";
import { deleteDocument, listDocuments, readDocument, storageStatus, withLock, writeDocument } from "./store";
import type { CaptureUser } from "./types";

interface TokenRecord { ownerId: string; expiresAt: number; name?: string; }
export class HttpError extends Error { constructor(public status: number, message: string, public code?: string) { super(message); } }
export function cookieOptions(origin: string, maxAge: number) {
  return { httpOnly: true, secure: new URL(origin).protocol === "https:", sameSite: "lax" as const, path: "/", maxAge };
}
function cookieValue(request: Request, name: string) {
  return request.headers.get("cookie")?.split(";").map((entry) => entry.trim()).find((entry) => entry.startsWith(`${name}=`))?.slice(name.length + 1);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== appOrigin(request.url)) throw new HttpError(403, "Open this action from the Accord page.");
}
export async function requestUser(request: Request, allowExtension = false): Promise<CaptureUser | null> {
  const bearer = request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9_-]{40,100})$/)?.[1];
  const token = bearer || cookieValue(request, SESSION_COOKIE);
  if (!token || (bearer && !allowExtension)) return null;
  const stored = await readDocument<TokenRecord>(bearer ? "extension" : "session", digest(token));
  if (!stored || stored.data.expiresAt <= Date.now()) return null;
  const user = await readDocument<CaptureUser>("user", stored.owner_id);
  return user?.data ?? null;
}
export async function requireUser(request: Request, allowExtension = false) {
  const user = await requestUser(request, allowExtension);
  if (!user) throw new HttpError(401, "Connect your account to use this feature.");
  if (request.method !== "GET" && request.method !== "HEAD" && !/^Bearer [A-Za-z0-9_-]{40,100}$/.test(request.headers.get("authorization") || "")) sameOrigin(request);
  return user;
}
export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const record = await readDocument<TokenRecord>("session", digest(token));
  if (!record || record.data.expiresAt <= Date.now()) return null;
  return (await readDocument<CaptureUser>("user", record.owner_id))?.data ?? null;
}
export async function createSession(user: CaptureUser) {
  await writeDocument("user", user.id, user.id, user);
  const token = opaqueToken();
  await writeDocument("session", digest(token), user.id, { ownerId: user.id, expiresAt: Date.now() + 30 * 86400_000 });
  return token;
}
export async function revokeSession(request: Request) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (token) await deleteDocument("session", digest(token));
}
export async function createLocalSession(origin: string) {
  if (!localMode(origin)) throw new HttpError(403, "Local testing is disabled.");
  const id = `local-${randomUUID()}`;
  const user: CaptureUser = { id, name: "Local recording test", email: "This device", local: true, calendarConnected: false };
  return { user, token: await createSession(user) };
}
export function googleClient(origin: string) {
  if (!googleConfigured()) throw new HttpError(503, "Add the Google client ID and secret to connect your account.");
  return new OAuth2Client({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${origin}/api/auth/google/callback`, transporterOptions: { timeout: 15_000 } });
}
export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events.readonly";
interface GoogleTransaction { state: string; nonce: string; verifier: string; expiresAt: number; ownerId?: string; }
export function mergeGoogleTokens(previous: Credentials, next: Credentials): Credentials {
  const merged = { ...previous };
  for (const [key, value] of Object.entries(next)) if (value != null) Object.assign(merged, { [key]: value });
  delete merged.id_token;
  return merged;
}
export function publicUser(user: CaptureUser) {
  return { id: user.id, name: user.name, email: user.email, local: user.local,
    calendarConnected: user.calendarConnected, calendarNeedsReconnect: !!user.calendarNeedsReconnect };
}
export async function beginGoogleAuth(origin: string, user?: CaptureUser | null) {
  const client = googleClient(origin);
  const storage = await storageStatus();
  if (!storage.ready) throw new HttpError(503, storage.issue || "Cloud storage needs setup before sign-in.");
  const state = opaqueToken();
  const nonce = opaqueToken();
  const verifier = await client.generateCodeVerifierAsync();
  return {
    transaction: await encrypt({ state, nonce, verifier: verifier.codeVerifier, expiresAt: Date.now() + 10 * 60_000,
      ownerId: user && !user.local ? user.id : undefined }),
    url: client.generateAuthUrl({ access_type: "offline", prompt: "consent", include_granted_scopes: true,
      scope: ["openid", "email", "profile", CALENDAR_SCOPE], state, nonce,
      login_hint: user && !user.local ? user.email : undefined,
      code_challenge: verifier.codeChallenge, code_challenge_method: CodeChallengeMethod.S256 }),
  };
}
export async function completeGoogleAuth(origin: string, code: string, state: string, transaction: string) {
  const expected = await decrypt<GoogleTransaction>(transaction);
  if (!Number.isFinite(expected.expiresAt) || expected.expiresAt < Date.now() ||
      typeof expected.state !== "string" || Buffer.byteLength(state) !== Buffer.byteLength(expected.state) ||
      !timingSafeEqual(Buffer.from(state), Buffer.from(expected.state))) throw new HttpError(400, "The sign-in request expired. Try again.");
  const client = googleClient(origin);
  const { tokens } = await client.getToken({ code, codeVerifier: expected.verifier });
  if (!tokens.id_token) throw new HttpError(400, "Google did not return an identity. Try again.");
  const verified = await client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
  const identity = verified.getPayload();
  if (!identity?.sub || !identity.email_verified || (identity as typeof identity & { nonce?: string }).nonce !== expected.nonce) {
    throw new HttpError(400, "Google could not verify this sign-in request.");
  }
  const id = `google-${digest(identity.sub).slice(0, 40)}`;
  if (expected.ownerId && expected.ownerId !== id) throw new HttpError(409, "Use the same Google account to reconnect your calendar.", "google_account_mismatch");
  return withLock(`google-${id}`, async () => {
    const previous = await readDocument<CaptureUser>("user", id);
    const oldTokens = previous?.data.googleTokens ? await decrypt<Credentials>(previous.data.googleTokens) : {};
    const calendarConnected = !!tokens.scope?.split(" ").includes(CALENDAR_SCOPE);
    const user: CaptureUser = { id, name: identity.name || identity.email || "Google account", email: identity.email!, googleSub: identity.sub, googleConnectionId: opaqueToken(),
      local: false, calendarConnected, calendarNeedsReconnect: false, googleTokens: await encrypt(mergeGoogleTokens(oldTokens, tokens)) };
    return { user, token: await createSession(user) };
  });
}
function googleFailure(error: unknown) {
  const value = error as { code?: number | string; response?: { status?: number; data?: { error?: string | { status?: string; errors?: Array<{ reason?: string }> } } } };
  const status = value?.response?.status || Number(value?.code);
  const responseError = value?.response?.data?.error;
  const reason = typeof responseError === "string" ? responseError : responseError?.errors?.[0]?.reason || responseError?.status;
  return { status, reason };
}
export async function calendarFailure(user: CaptureUser, error: unknown): Promise<never> {
  const { status, reason } = googleFailure(error);
  if (reason === "invalid_grant" || status === 401 || reason === "insufficientPermissions") {
    await withLock(`google-${user.id}`, async () => {
      const saved = await readDocument<CaptureUser>("user", user.id);
      if (saved && saved.data.googleConnectionId !== user.googleConnectionId) {
        throw new HttpError(409, "Your calendar connection changed. Select Refresh to load your calls.", "google_calendar_changed");
      }
      if (saved) await writeDocument("user", user.id, user.id, { ...saved.data, googleTokens: undefined, calendarConnected: false, calendarNeedsReconnect: true });
    });
    throw new HttpError(409, "Google Calendar access has expired. Reconnect your calendar to load your calls.", "google_reconnect_required");
  }
  if (status === 403 && ["accessNotConfigured", "SERVICE_DISABLED"].includes(reason || "")) {
    throw new HttpError(503, "Google Calendar needs setup before it can load calls.", "google_calendar_setup_required");
  }
  if (status === 403) throw new HttpError(403, "Google did not allow calendar access. Reconnect your calendar and allow read access.", "google_reconnect_required");
  if (status === 429) throw new HttpError(503, "Google Calendar is busy. Wait a short time, then select Refresh.");
  throw new HttpError(503, "Google Calendar could not load your calls. Select Refresh to try again.");
}
export async function authorizedGoogleClient(user: CaptureUser, origin: string) {
  let requestedAccount = user;
  try {
    return await withLock(`google-${user.id}`, async () => {
      const current = (await readDocument<CaptureUser>("user", user.id))?.data;
      if (!current?.googleTokens || !current.calendarConnected) throw new HttpError(409, "Connect Google Calendar to load your meetings.", "google_reconnect_required");
      requestedAccount = current;
      const client = googleClient(origin);
      const previous = await decrypt<Credentials>(current.googleTokens);
      client.setCredentials(previous);
      await client.getAccessToken();
      const tokens = mergeGoogleTokens(previous, client.credentials);
      client.setCredentials(tokens);
      await writeDocument("user", user.id, user.id, { ...current, googleTokens: await encrypt(tokens) });
      return client;
    });
  } catch (error) {
    if (error instanceof HttpError || (error instanceof Error && /busy|store/.test(error.message))) throw error;
    return calendarFailure(requestedAccount, error);
  }
}
export async function disconnectCalendar(user: CaptureUser, origin: string) {
  await withLock(`google-${user.id}`, async () => {
    const current = (await readDocument<CaptureUser>("user", user.id))?.data;
    if (!current) throw new HttpError(401, "Sign in to manage your calendar.");
    if (current.googleTokens) {
      const credentials = await decrypt<Credentials>(current.googleTokens);
      const token = credentials.refresh_token || credentials.access_token;
      if (token) {
        try { await googleClient(origin).revokeToken(token); }
        catch (error) {
          if (![400, 401].includes(googleFailure(error).status)) throw new HttpError(503, "Google Calendar could not disconnect. Try again.");
        }
      }
    }
    await writeDocument("user", user.id, user.id, { ...current, googleTokens: undefined, calendarConnected: false, calendarNeedsReconnect: false });
  });
}
export async function extensionToken(user: CaptureUser) {
  const token = opaqueToken();
  await writeDocument("extension", digest(token), user.id, { ownerId: user.id, name: "Accord Meet", expiresAt: Date.now() + 30 * 86400_000 });
  return { token, expiresAt: Date.now() + 30 * 86400_000 };
}
export async function revokeExtensions(user: CaptureUser) {
  const extensions = await listDocuments<TokenRecord>("extension", user.id);
  await Promise.all(extensions.map((extension) => deleteDocument("extension", extension.id)));
}
