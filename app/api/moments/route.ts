import { NextRequest, NextResponse } from "next/server";
import { requestUser } from "@/lib/capture/auth";
import { failure } from "@/lib/capture/http";
import { userCaptures } from "@/lib/capture/meetings";

export async function GET(request: NextRequest) {
  try {
    const captures = await userCaptures(await requestUser(request));
    return NextResponse.json({ moments: captures.flatMap((capture) => capture.reviewState?.moments || []) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
