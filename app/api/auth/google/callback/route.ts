import { NextRequest, NextResponse } from "next/server";
import { completeGoogleAuth, cookieOptions, HttpError, requestUser, revokeExtensions, revokeSession } from "@/lib/capture/auth";
import { appOrigin, SESSION_COOKIE } from "@/lib/capture/config";

export async function GET(request: NextRequest) {
  const origin = appOrigin(request.url);
  const response = NextResponse.redirect(`${origin}/record`, 303);
  response.cookies.set("accord_google_flow", "", cookieOptions(origin, 0));
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const transaction = request.cookies.get("accord_google_flow")?.value;
    if (request.nextUrl.searchParams.get("error") === "access_denied") {
      response.headers.set("Location", `${origin}/record?error=google_cancelled`);
      return response;
    }
    if (!code || !state || !transaction || request.nextUrl.searchParams.has("error")) throw new Error("Sign-in cancelled.");
    const previous = await requestUser(request);
    const session = await completeGoogleAuth(origin, code, state, transaction);
    if (previous && previous.id !== session.user.id) await revokeExtensions(previous);
    await revokeSession(request);
    response.cookies.set(SESSION_COOKIE, session.token, cookieOptions(origin, 30 * 86400));
    response.headers.set("Location", `${origin}/record?connected=${session.user.calendarConnected ? "google" : "account"}`);
    return response;
  } catch (error) {
    const reason = error instanceof HttpError && error.code === "google_account_mismatch" ? "google_account_mismatch" : "google";
    response.headers.set("Location", `${origin}/record?error=${reason}`);
    return response;
  }
}
