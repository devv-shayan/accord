"use client";

import { PauseIcon, PlayIcon, RotateCcwIcon, RotateCwIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/format";

const speeds = [0.75, 1, 1.25, 1.5, 2].map((value) => ({ value, label: `${value}×` }));

export function PlaybackControls({ currentTime, duration, start = 0, end = duration, playing, buffering, error, speed, muted, onSeek, onToggle, onSpeed, onMute, onRetry, clip = false }: {
  currentTime: number; duration: number; start?: number; end?: number; playing: boolean; buffering: boolean;
  error: string | null; speed: number; muted: boolean; onSeek: (time: number) => void;
  onToggle: () => void; onSpeed: (speed: number) => void; onMute: () => void; onRetry: () => void; clip?: boolean;
}) {
  return (
    <section aria-label={clip ? "Clip player" : "Recording player"} className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{clip ? "Clip playback" : "Recording"}</h2>
        <span className="text-xs text-muted-foreground" aria-live="polite">{buffering ? "Loading audio…" : playing ? "Playing" : "Paused"}</span>
      </div>
      <div className="my-5 flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" aria-label="Back 10 seconds" onClick={() => onSeek(currentTime - 10)}>
          <RotateCcwIcon aria-hidden="true" />
        </Button>
        <Button size="icon-lg" aria-label={playing ? (clip ? "Pause clip" : "Pause") : (clip ? "Play clip" : "Play")} onClick={onToggle}>
          {playing ? <PauseIcon aria-hidden="true" /> : <PlayIcon aria-hidden="true" />}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Forward 10 seconds" onClick={() => onSeek(currentTime + 10)}>
          <RotateCwIcon aria-hidden="true" />
        </Button>
      </div>
      <Slider value={currentTime} min={start} max={Math.max(start + 0.5, end)} step={0.1}
        onValueChange={(value) => onSeek(Array.isArray(value) ? value[0] : value)} aria-label={clip ? "Clip position" : "Recording position"} />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          <span className="text-foreground">{formatTime(clip ? currentTime - start : currentTime)}</span> / {formatTime(clip ? end - start : duration)}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={muted ? "Unmute recording" : "Mute recording"} onClick={onMute}>
            {muted ? <VolumeXIcon aria-hidden="true" /> : <Volume2Icon aria-hidden="true" />}
          </Button>
          <Select items={speeds} value={speed} onValueChange={(value) => { if (value !== null) onSpeed(Number(value)); }}>
            <SelectTrigger className="w-20" aria-label="Playback speed"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>{speeds.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
        </div>
      </div>
      {error ? <Alert className="mt-4"><AlertTitle>Audio unavailable</AlertTitle><AlertDescription>{error}<Button variant="outline" size="sm" onClick={onRetry}>Retry audio</Button></AlertDescription></Alert> : null}
    </section>
  );
}
