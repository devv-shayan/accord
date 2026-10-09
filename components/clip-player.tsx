"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { PlaybackControls } from "@/components/playback-controls";
import { useAudioPlayback } from "@/hooks/use-audio-playback";
import { formatTime } from "@/lib/format";

export function ClipPlayer({ meetingId, meetingTitle, recordedDate, audioSrc, startSeconds, endSeconds, label, publicClip = false }: {
  meetingId: string; meetingTitle: string; recordedDate: string; audioSrc: string;
  startSeconds: number; endSeconds: number; label: string;
  publicClip?: boolean;
}) {
  const { audioRef, playback } = useAudioPlayback({ src: audioSrc, duration: endSeconds, start: startSeconds, end: endSeconds });
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl items-center px-4 py-12 sm:px-6">
      <audio ref={audioRef} src={audioSrc} preload="metadata" />
      <section className="w-full">
        {!publicClip ? <Link href={`/meetings/${meetingId}?t=${startSeconds}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" aria-hidden="true" />Open full meeting
        </Link> : null}
        <p className="mt-8 text-xs font-medium uppercase tracking-widest text-primary">Shared clip</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{label}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{meetingTitle} · {recordedDate}</p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">{publicClip ? `${formatTime(endSeconds)} clip · link expires after seven days` : `${formatTime(startSeconds)}–${formatTime(endSeconds)} in the full recording`}</p>
        <div className="mt-7">
          <PlaybackControls {...playback} start={startSeconds} end={Math.min(endSeconds, playback.duration)} clip
            onSeek={playback.seek} onToggle={playback.toggle} onSpeed={playback.setPlaybackSpeed}
            onMute={playback.toggleMute} onRetry={playback.retry} />
        </div>
      </section>
    </main>
  );
}
