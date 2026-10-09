import { NextRequest, NextResponse } from "next/server";
import { cookieOptions, requireUser, revokeExtensions, revokeSession } from "@/lib/capture/auth";
import { appOrigin, SESSION_COOKIE } from "@/lib/capture/config";
import { failure } from "@/lib/capture/http";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await revokeExtensions(user);
    await revokeSession(request);
    const response = NextResponse.json({ signedOut: true });
    response.cookies.set(SESSION_COOKIE, "", cookieOptions(appOrigin(request.url), 0));
    return response;
  } catch (error) { return failure(error); }
}
