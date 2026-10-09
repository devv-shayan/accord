import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MeetingReview } from "@/components/meeting-review";
import { currentUser } from "@/lib/capture/auth";
import { accessibleMeeting } from "@/lib/capture/meetings";
export const dynamic = "force-dynamic";

export default async function MeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string; q?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const meeting = await accessibleMeeting(id, await currentUser());
  if (!meeting) notFound();

  const parsedTime = query.t ? Number.parseFloat(query.t) : Number.NaN;
  const initialTime = Number.isFinite(parsedTime) ? parsedTime : null;

  return (
    <AppShell>
      <MeetingReview key={meeting.id} meeting={meeting} initialTime={initialTime} initialQuery={query.q ?? ""} />
    </AppShell>
  );
}
