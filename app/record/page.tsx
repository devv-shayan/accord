import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { RecordingSetup } from "@/components/recording-setup";

export const metadata: Metadata = { title: "Record — Accord" };
export default async function RecordPage({ searchParams }: { searchParams: Promise<{ error?: string; connected?: string }> }) {
  const { error, connected } = await searchParams;
  const messages: Record<string, string> = {
    google: "Google sign-in could not finish. Try again. If it still fails, check the Google connection setup.",
    google_cancelled: "Google sign-in was cancelled. Select Connect Google when you are ready.",
    google_account_mismatch: "Use the same Google account to reconnect your calendar. Sign out first to use another account.",
  };
  const notice = connected === "google" ? "Google is connected. Your upcoming Meet calls can now load." :
    connected === "account" ? "You are signed in. Allow calendar access to load your upcoming Meet calls." : undefined;
  return <AppShell><RecordingSetup initialError={error ? messages[error] : undefined} initialNotice={notice} /></AppShell>;
}
