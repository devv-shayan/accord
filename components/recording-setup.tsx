"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLinesIcon, CalendarDaysIcon, CheckIcon, CloudIcon, GlobeIcon, ExternalLinkIcon, LoaderCircleIcon, MicIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ACCORD_EXTENSION_ID } from "@/lib/extension-info";
import { formatTime } from "@/lib/format";
import type { CaptureConnection, CaptureStatus, CalendarMeeting } from "@/lib/capture/types";

interface RecordingRow { id: string; title: string; createdAt: string; status: CaptureStatus; durationSeconds: number; error?: string; processingStartedAt?: string }
interface BrowserRuntime {
  lastError?: { message?: string };
  sendMessage: (id: string, message: unknown, callback: (reply: { installed?: boolean; pending?: boolean; error?: string }) => void) => void;
}
function extensionMessage(message: unknown) {
  return new Promise<{ installed?: boolean; pending?: boolean; error?: string }>((resolve, reject) => {
    const runtime = (window as Window & { chrome?: { runtime?: BrowserRuntime } }).chrome?.runtime;
    if (!runtime?.sendMessage) { reject(new Error("Add Accord Meet to Chrome first. Then reload this page.")); return; }
    const timer = setTimeout(() => reject(new Error("The extension did not respond. Reload this page and try again.")),5000);
    runtime.sendMessage(ACCORD_EXTENSION_ID, message, (reply) => {
      clearTimeout(timer);
      if (runtime.lastError || !reply) reject(new Error("Add Accord Meet to Chrome first. Then reload this page."));
      else if (reply.error) reject(new Error(reply.error)); else resolve(reply);
    });
  });
}
const statusLabel: Record<CaptureStatus,string> = { recording:"Recording", queued:"Waiting for processing", transcribing:"Making the transcript", summarizing:"Making the notes", ready:"Ready", error:"Processing needs retry" };

export function RecordingSetup({ initialError, initialNotice }: { initialError?: string; initialNotice?: string }) {
  const [connection,setConnection] = useState<CaptureConnection | null>(null);
  const [installed,setInstalled] = useState(false);
  const [meetings,setMeetings] = useState<CalendarMeeting[]>([]);
  const [recordings,setRecordings] = useState<RecordingRow[]>([]);
  const [error,setError] = useState<string | null>(initialError || null);
  const [checkedAt,setCheckedAt] = useState(0);
  const [calendarError,setCalendarError] = useState<string | null>(null);
  const [calendarLoading,setCalendarLoading] = useState(false);
  const [calendarLoaded,setCalendarLoaded] = useState(false);
  const [calendarReconnect,setCalendarReconnect] = useState(false);
  const [notice,setNotice] = useState<string | null>(initialNotice || null);
  const [working,setWorking] = useState<string | null>(null);
  const [setupOpen,setSetupOpen] = useState(false);
  const mounted = useRef(true);
  const connectionRequest = useRef(0);
  const calendarRequest = useRef(0);
  const calendarAccount = useRef<string | null>(null);
  const pendingRecording = useRef(false);
  const lastLoaded = useRef(0);
  const cancelCalendar = useCallback(() => { calendarRequest.current++; },[]);
  const load = useCallback(() => {
    const request = ++connectionRequest.current;
    const current = () => mounted.current && request === connectionRequest.current;
    return fetch("/api/connection",{cache:"no-store"}).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The connection could not load. Try again.");
      return result;
    }).then(async result => {
      if (!current()) return;
      const account = result.user?.calendarConnected ? result.user.id : null;
      if (calendarAccount.current !== account) {
        calendarAccount.current = account; cancelCalendar();
        setMeetings([]); setCalendarLoaded(false); setCalendarLoading(false);
      }
      setConnection(result);
      setCheckedAt(Date.now());
      lastLoaded.current = Date.now();
      if (result.user) {
        const response = await fetch("/api/recordings",{cache:"no-store"}); const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Your recordings could not load.");
        if (current()) {
          setRecordings(data.captures);
          pendingRecording.current = data.captures.some((capture: RecordingRow) => !["ready","error"].includes(capture.status));
        }
      } else { pendingRecording.current = false; setRecordings([]); setMeetings([]); }
    }).catch(error => { if (current()) throw error; });
  },[cancelCalendar]);
  const loadCalendar = useCallback(() => {
    const request = ++calendarRequest.current;
    const current = () => mounted.current && request === calendarRequest.current;
    return fetch("/api/calendar",{cache:"no-store"}).then(async response => {
      const data = await response.json();
      if (!response.ok) {
        if (current() && data.code === "google_reconnect_required") { setCalendarReconnect(true); setMeetings([]); }
        throw new Error(data.error || "Google Calendar could not load. Try again.");
      }
      return data;
    }).then(data => {
      if (current()) { setMeetings(data.meetings); setCalendarError(null); setCalendarReconnect(false); setCalendarLoaded(true); }
    }).catch(error => {
      if (current()) setCalendarError(error instanceof Error ? error.message : "Calendar could not load.");
    }).finally(() => { if (current()) setCalendarLoading(false); });
  },[]);
  useEffect(() => {
    mounted.current = true;
    const showError = (error: Error) => { if (mounted.current) setError(error.message); };
    void load().catch(showError);
    void extensionMessage({type:"ping"}).then(reply => { if (mounted.current) setInstalled(!!reply.installed); }).catch(() => { if (mounted.current) setInstalled(false); });
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && (pendingRecording.current || Date.now() - lastLoaded.current >= 30_000)) void load().catch(showError);
    },5000);
    return () => { mounted.current = false; cancelCalendar(); clearInterval(timer); };
  },[load,cancelCalendar]);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("connected") || url.searchParams.has("error")) {
      url.searchParams.delete("connected"); url.searchParams.delete("error");
      window.history.replaceState(window.history.state,"",`${url.pathname}${url.search}${url.hash}`);
    }
  },[]);
  useEffect(() => {
    if (!connection?.user?.calendarConnected) return;
    void loadCalendar(); const timer = setInterval(() => { if (document.visibilityState === "visible") { setCalendarLoading(true); void loadCalendar(); } },60_000);
    return () => { cancelCalendar(); clearInterval(timer); };
  },[connection?.user?.id,connection?.user?.calendarConnected,loadCalendar,cancelCalendar]);
  async function action(id: string, work: () => Promise<void>) {
    setWorking(id); setError(null);
    try { await work(); await load(); }
    catch (error) { setError(error instanceof Error ? error.message : "The action could not finish. Try again."); }
    finally { setWorking(null); }
  }
  async function post(path: string) {
    const response = await fetch(path,{method:"POST"}); const result = await response.json();
    if (!response.ok) throw new Error(result.error || "The action could not finish."); return result;
  }
  const linked = !!connection?.user;
  const reconnect = calendarReconnect || !!connection?.user?.calendarNeedsReconnect;
  const calendarConnected = !!connection?.user?.calendarConnected && !reconnect;
  const loadingCalendar = calendarLoading || (calendarConnected && !calendarLoaded && !calendarError);
  return <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
    <header className="border-b border-border pb-6">
      <p className="mb-2 text-xs font-medium text-primary">Google Meet · Chrome</p>
      <h1 className="text-3xl font-semibold tracking-tight">Record a meeting</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Connect your calendar. Start recording from Chrome when you join a call. Accord saves the audio, transcript, notes, and marked moments together.</p>
    </header>
    {error ? <Alert className="mt-6" variant="destructive"><AlertTitle>The action needs attention</AlertTitle><AlertDescription>{error}<Button size="sm" variant="outline" onClick={() => void action("reload",load)}>Retry</Button></AlertDescription></Alert> : null}
    {connection?.storageIssue ? <Alert className="mt-6" variant="destructive"><AlertTitle>Storage needs attention</AlertTitle><AlertDescription>{connection.storageIssue}<Button size="sm" variant="outline" disabled={!!working} onClick={() => void action("reload",load)}>Check connection</Button></AlertDescription></Alert> : null}
    {notice ? <p className="mt-5 text-sm text-primary" role="status">{notice}</p> : null}
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <section aria-label="Recording setup" className="divide-y divide-border rounded-xl border border-border bg-card px-5">
          <SetupStep icon={CalendarDaysIcon} title="1. Connect Google">
            <p className="break-words">{linked ? connection.user!.email : "Sign in and allow read access to your calendar. Accord uses it to show your Meet calls."}</p>
            {connection?.user?.local ? <p className="mt-2 text-xs text-primary">Local recording test. Google Calendar is not connected.</p> : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {calendarConnected ? <Badge variant="outline"><CheckIcon aria-hidden="true" />Calendar connected</Badge> : <form action="/api/auth/google" method="post"><Button size="sm" type="submit" disabled={!connection?.googleConfigured || !connection.storageReady || !!working}>{reconnect ? "Reconnect calendar" : linked && !connection.user!.local ? "Allow calendar access" : "Connect Google"}</Button></form>}
              {calendarConnected ? <Button size="sm" variant="ghost" disabled={!!working} onClick={() => void action("calendar-disconnect",async () => {
                const response = await fetch("/api/calendar",{method:"DELETE"}); const result = await response.json();
                if (!response.ok) throw new Error(result.error || "Calendar could not disconnect.");
                setMeetings([]); setCalendarError(null); setCalendarReconnect(false);
                setNotice("Google Calendar is disconnected. You remain signed in, and your recordings remain saved.");
              })}>Disconnect calendar</Button> : null}
              {linked ? <Button size="sm" variant="ghost" disabled={!!working} onClick={() => void action("logout",async () => { await post("/api/auth/logout"); setNotice(null); setCalendarError(null); setCalendarReconnect(false); })}>Sign out</Button> : null}
            </div>
            {connection && !connection.googleConfigured && !linked ? <p className="mt-2 text-xs">The Google connection needs setup before sign-in is available.</p> : null}
            {connection?.localMode && connection.storageReady && !linked ? <Button size="sm" className="mt-3" variant="outline" disabled={!!working} onClick={() => void action("local",async () => { await post("/api/auth/local"); })}>Start a local recording test</Button> : null}
          </SetupStep>
          <SetupStep icon={GlobeIcon} title="2. Add Accord Meet to Chrome">
            <p>The extension records the Meet tab and your microphone. The web app stores the recording and makes your notes.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {installed ? <Badge variant="outline"><CheckIcon aria-hidden="true" />Extension installed</Badge> : <a className={buttonVariants({size:"sm",variant:"outline"})} href="/downloads/accord-meet.zip" download onClick={() => setSetupOpen(true)}>Download extension</a>}
              <Button size="sm" variant="ghost" onClick={() => setSetupOpen(!setupOpen)}>Install steps</Button>
            </div>
            {setupOpen ? <ol className="mt-4 list-decimal space-y-2 pl-5"><li>Unzip the download into a folder.</li><li>Open Chrome Extensions and turn on Developer mode.</li><li>Select Load unpacked and choose the unzipped folder.</li><li>Pin Accord Meet, then reload this Accord page.</li></ol> : null}
          </SetupStep>
          <SetupStep icon={MicIcon} title="3. Connect the extension">
            <p>Approve this Accord site in the extension. Then enable your microphone from its controls.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {connection?.extensionConnected && installed ? <Badge variant="outline"><CheckIcon aria-hidden="true" />Extension connected</Badge> : null}
              <Button size="sm" disabled={!linked || !installed || !!working} onClick={() => void action("pair",async () => { const token = await post("/api/extension/pair"); await extensionMessage({type:"pair",origin:window.location.origin,...token}); setNotice("The Chrome connection page is open. Select Connect this site to finish."); })}>{working === "pair" ? "Connecting…" : "Connect extension"}</Button>
              {connection?.extensionConnected ? <Button size="sm" variant="ghost" disabled={!!working} onClick={() => void action("revoke",async () => { const response = await fetch("/api/extension/pair",{method:"DELETE"}); if (!response.ok) throw new Error("Extension access could not be revoked."); setNotice("Extension access was revoked. Your recordings remain saved."); })}>Revoke extension access</Button> : null}
            </div>
          </SetupStep>
        </section>
        <section className="mt-8" aria-label="Upcoming Google Meet calls">
          <div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold">Upcoming calls</h2>{calendarConnected ? <Button size="xs" variant="ghost" disabled={loadingCalendar} onClick={() => { setCalendarLoading(true); void loadCalendar(); }}>{loadingCalendar ? "Loading…" : "Refresh"}</Button> : null}</div>
          {calendarConnected ? <p className="mt-1 text-xs text-muted-foreground">Your primary Google calendar · Next seven days</p> : null}
          {calendarError ? <p className="mt-3 text-sm text-destructive" role="alert">{calendarError}</p> : null}
          {meetings.length ? <div className="mt-3 divide-y divide-border border-y border-border">{meetings.map(meeting => <div key={meeting.id} className="flex items-start justify-between gap-4 py-4"><div className="min-w-0"><h3 className="break-words text-sm font-medium">{meeting.title}</h3><p className="mt-1 text-xs text-muted-foreground">{new Date(meeting.startsAt).toLocaleString(undefined,{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</p></div><a href={meeting.meetUrl} target="_blank" rel="noreferrer" className={buttonVariants({size:"sm",variant:"outline"})}>Join<ExternalLinkIcon aria-hidden="true" /></a></div>)}</div> : !calendarError ? <p className="mt-3 text-sm leading-6 text-muted-foreground" role={loadingCalendar ? "status" : undefined}>{calendarConnected ? calendarLoaded ? "No Meet calls are scheduled in the next seven days. You can also record a call that you start directly in Meet." : "Loading your Meet calls…" : "Connect Google Calendar to see your upcoming calls."}</p> : null}
        </section>
        <section className="mt-8" aria-label="Recording progress">
          <h2 className="text-base font-semibold">Your recordings</h2>
          {recordings.length ? <div className="mt-3 divide-y divide-border border-y border-border">{recordings.map(recording => <div key={recording.id} className="py-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-sm font-medium">{recording.title}</h3><p className="mt-1 text-xs text-muted-foreground">{new Date(recording.createdAt).toLocaleString()} {recording.durationSeconds ? `· ${formatTime(recording.durationSeconds)}` : ""}</p></div>{recording.status === "ready" ? <Link href={`/meetings/${recording.id}` as Route} className={buttonVariants({size:"sm",variant:"outline"})}>Open meeting</Link> : <Badge variant="outline">{!["error","recording"].includes(recording.status) ? <LoaderCircleIcon aria-hidden="true" className="animate-spin" /> : null}{statusLabel[recording.status]}</Badge>}</div>
            {recording.error ? <p className="mt-3 text-sm text-destructive">{recording.error}</p> : null}
            {recording.status === "recording" ? <p className="mt-2 text-xs text-muted-foreground">Use Stop and save in the extension. If the call was interrupted, use Retry upload there.</p> : null}
            {recording.status === "error" || (["transcribing","summarizing"].includes(recording.status) && checkedAt - Date.parse(recording.processingStartedAt || "") > 10 * 60_000) ? <Button className="mt-3" size="sm" variant="outline" disabled={!!working} onClick={() => void action(recording.id,async () => { await post(`/api/recordings/${recording.id}/retry`); })}>Retry processing</Button> : null}
          </div>)}</div> : <div className="mt-3 rounded-xl border border-dashed border-border p-5"><AudioLinesIcon className="size-5 text-muted-foreground" aria-hidden="true" /><p className="mt-3 text-sm text-muted-foreground">Your first recording will appear here. Prepared examples are in Meetings.</p><Link href="/meetings" className="mt-3 inline-block text-sm text-primary underline underline-offset-4">Browse examples</Link></div>}
        </section>
      </div>
      <aside className="rounded-xl border border-border bg-muted/20 p-5">
        <div className="mb-5 border-b border-border pb-5"><div className="flex items-center gap-2"><CloudIcon className="size-4 text-primary" aria-hidden="true" /><h2 className="text-sm font-semibold">{connection?.storage === "supabase" ? "Private cloud storage" : "Recording storage"}</h2></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{!connection ? "Checking your connection…" : !connection.storageReady ? "Storage is not connected yet." : connection.storage === "supabase" ? "Connected. Your recordings and edits are saved to your account." : "Recordings are saved on this computer."}</p>{connection?.storageReady ? <Badge className="mt-3" variant="outline"><CheckIcon aria-hidden="true" />{connection.storage === "supabase" ? "Connected" : "Available locally"}</Badge> : null}</div>
        <h2 className="text-base font-semibold">When the call starts</h2><ol className="mt-4 list-decimal space-y-4 pl-5 text-sm leading-6 text-muted-foreground"><li>Join the call in Google Meet.</li><li>Click Accord in the Chrome toolbar and select Start recording.</li><li>Mark useful moments while you talk. Use Accord’s microphone control when you mute yourself.</li><li>Select Stop and save. Open the meeting when its transcript and notes are ready.</li></ol>
        <p className="mt-5 border-t border-border pt-4 text-xs leading-6 text-muted-foreground">You can close the popup during recording. If an upload fails, the extension keeps the audio and offers Retry. Your full recordings stay private. Shared clip links contain only the selected audio and expire after seven days.</p>
      </aside>
    </div>
  </main>;
}
function SetupStep({icon: Icon,title,children}: { icon: typeof MicIcon; title: string; children: React.ReactNode }) {
  return <div className="py-5"><div className="flex items-start gap-3"><Icon className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" /><div className="min-w-0 flex-1"><h2 className="font-semibold text-foreground">{title}</h2><div className="mt-1 text-sm leading-6 text-muted-foreground">{children}</div></div></div></div>;
}
