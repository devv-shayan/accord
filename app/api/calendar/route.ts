import { NextRequest, NextResponse } from "next/server";
import { disconnectCalendar, requireUser } from "@/lib/capture/auth";
import { appOrigin } from "@/lib/capture/config";
import { upcomingMeetings } from "@/lib/capture/calendar";
import { failure } from "@/lib/capture/http";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request, true);
    return NextResponse.json({ meetings: await upcomingMeetings(user, appOrigin(request.url)) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await disconnectCalendar(user, appOrigin(request.url));
    return NextResponse.json({ disconnected: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
