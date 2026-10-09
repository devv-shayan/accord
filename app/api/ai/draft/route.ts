import { NextRequest, NextResponse } from "next/server";
import { generateMeetingDraft } from "@/lib/ai-draft";
import { accessibleMeeting } from "@/lib/capture/meetings";
import { requestUser, sameOrigin } from "@/lib/capture/auth";
import { failure, smallJson } from "@/lib/capture/http";

export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const body = await smallJson(request);
    const meeting = typeof body.meetingId === "string" ? await accessibleMeeting(body.meetingId, await requestUser(request)) : null;
    if (!meeting) return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    return NextResponse.json({ draft: await generateMeetingDraft(meeting) });
  } catch (error) { return failure(error); }
}
