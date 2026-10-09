import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { MomentsLibrary } from "@/components/moments-library";

export const metadata: Metadata = { title: "Shared clips — Accord" };

export default function SharedClipsPage() {
  return (
    <AppShell>
      <MomentsLibrary kind="shared" />
    </AppShell>
  );
}
