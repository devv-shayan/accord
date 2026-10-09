import { NextRequest, NextResponse } from "next/server";
import { beginGoogleAuth, cookieOptions, requestUser, sameOrigin } from "@/lib/capture/auth";
import { appOrigin } from "@/lib/capture/config";
import { failure } from "@/lib/capture/http";

export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const origin = appOrigin(request.url);
    const flow = await beginGoogleAuth(origin, await requestUser(request));
    const response = NextResponse.redirect(flow.url, 303);
    response.cookies.set("accord_google_flow", flow.transaction, cookieOptions(origin, 600));
    return response;
  } catch (error) { return failure(error); }
}
