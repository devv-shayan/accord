import { notFound } from "next/navigation";
import { ClipPlayer } from "@/components/clip-player";
import { sharedAudio } from "@/lib/capture/shares";

export const dynamic = "force-dynamic";
export default async function SharedClipPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await sharedAudio(token);
  if (!share) notFound();
  return <ClipPlayer meetingId={share.captureId} meetingTitle={share.title} label={share.label} recordedDate={share.recordedDate}
    startSeconds={0} endSeconds={share.duration} audioSrc={`/api/shared-audio/${token}`} publicClip />;
}
