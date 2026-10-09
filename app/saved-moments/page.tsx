import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { MomentsLibrary } from "@/components/moments-library";

export const metadata: Metadata = { title: "Saved moments — Accord" };

export default function SavedMomentsPage() {
  return (
    <AppShell>
      <MomentsLibrary kind="saved" />
    </AppShell>
  );
}
