import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { MeetingLibrary } from "@/components/meeting-library";
import { currentUser } from "@/lib/capture/auth";
import { meetingCatalog } from "@/lib/capture/meetings";

export const metadata: Metadata = { title: "Meetings — Accord" };

export const dynamic = "force-dynamic";
export default async function MeetingsPage() {
  return (
    <AppShell>
      <MeetingLibrary meetings={await meetingCatalog(await currentUser())} />
    </AppShell>
  );
}
