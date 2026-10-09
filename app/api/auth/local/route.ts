import { NextRequest, NextResponse } from "next/server";
import { cookieOptions, createLocalSession, sameOrigin } from "@/lib/capture/auth";
import { appOrigin, SESSION_COOKIE } from "@/lib/capture/config";
import { failure } from "@/lib/capture/http";

export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const origin = appOrigin(request.url);
    const session = await createLocalSession(origin);
    const response = NextResponse.json({ connected: true });
    response.cookies.set(SESSION_COOKIE, session.token, cookieOptions(origin, 30 * 86400));
    return response;
  } catch (error) { return failure(error); }
}
