import { NextRequest, NextResponse } from "next/server";
import { getMeeting, getMeetingIds } from "@/lib/meeting-data";
import { requestUser } from "@/lib/capture/auth";
import { userCaptures } from "@/lib/capture/meetings";
import { formatTime } from "@/lib/format";

interface SearchResult {
  id: string;
  meetingId: string;
  meetingTitle: string;
  kind: "meeting" | "transcript";
  label: string;
  snippet: string;
  time: number | null;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const normalized = query.toLocaleLowerCase();

  if (normalized.length < 2) {
    return NextResponse.json({ results: [] satisfies SearchResult[], total: 0 });
  }

  const results: SearchResult[] = [];
  let total = 0;

  const user = await requestUser(request);
  const records = [...(await userCaptures(user)).flatMap((capture) => capture.record ? [capture.record] : []), ...getMeetingIds().map(getMeeting)];
  for (const meeting of records) {
    if (!meeting) continue;

    const meetingText = `${meeting.title} ${meeting.description} ${meeting.sourceLabel}`.toLocaleLowerCase();
    if (meetingText.includes(normalized)) {
      total += 1;
      results.push({
        id: `${meeting.id}-meeting`,
        meetingId: meeting.id,
        meetingTitle: meeting.title,
        kind: "meeting",
        label: meeting.recordedDate,
        snippet: meeting.description,
        time: null,
      });
    }

    let meetingTranscriptMatches = 0;
    for (const segment of meeting.transcript) {
      if (!`${segment.speakerLabel} ${segment.text}`.toLocaleLowerCase().includes(normalized)) continue;
      total += 1;
      if (meetingTranscriptMatches >= 4) continue;

      results.push({
        id: segment.id,
        meetingId: meeting.id,
        meetingTitle: meeting.title,
        kind: "transcript",
        label:
          segment.startSeconds === null
            ? segment.speakerLabel
            : `${segment.speakerLabel} · ${formatTime(segment.startSeconds)}`,
        snippet: segment.text,
        time: segment.startSeconds,
      });
      meetingTranscriptMatches += 1;

    }

  }

  return NextResponse.json({ results, total }, { headers: { "Cache-Control": "no-store" } });
}
