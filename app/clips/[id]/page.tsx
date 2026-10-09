import { notFound } from "next/navigation";
import { ClipPlayer } from "@/components/clip-player";
import { currentUser } from "@/lib/capture/auth";
import { accessibleMeeting } from "@/lib/capture/meetings";
export const dynamic = "force-dynamic";

export default async function ClipPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ start?: string; end?: string; label?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const meeting = await accessibleMeeting(id, await currentUser());
  if (!meeting) notFound();

  const rawStart = Number.parseFloat(query.start ?? "0");
  const rawEnd = Number.parseFloat(query.end ?? "30");
  const maximumStart = Math.max(0, meeting.durationSeconds - 0.5);
  const startSeconds = Number.isFinite(rawStart) ? Math.max(0, Math.min(maximumStart, rawStart)) : 0;
  const requestedEnd = Number.isFinite(rawEnd) ? rawEnd : startSeconds + 30;
  const endSeconds = Math.min(
    meeting.durationSeconds,
    Math.max(startSeconds + 0.5, requestedEnd)
  );

  return (
    <ClipPlayer
      meetingId={meeting.id}
      meetingTitle={meeting.title}
      recordedDate={meeting.recordedDate}
      audioSrc={meeting.audioSrc}
      startSeconds={startSeconds}
      endSeconds={endSeconds}
      label={query.label?.slice(0, 120) || "Shared meeting moment"}
    />
  );
}
