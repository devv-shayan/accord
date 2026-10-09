"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { BookmarkIcon, CopyIcon, ExternalLinkIcon, PencilIcon, PlayIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { clipHref, type SavedMoment } from "@/lib/client-state";
import { formatTime, parseTime } from "@/lib/format";

interface MomentManagerProps {
  meetingId: string; meetingTitle: string; duration: number; currentTime: number; moments: SavedMoment[];
  onSave: (moment: Omit<SavedMoment, "id" | "createdAt" | "shared">) => SavedMoment;
  onEdit: (id: string, patch: Pick<SavedMoment, "label" | "startSeconds" | "endSeconds">) => void;
  onPreview: (start: number, end: number) => void;
  onShare: (id: string) => Promise<string>;
  onRemove: (id: string) => void;
  onRestore: (moment: SavedMoment) => void;
}

export function MomentManager({ meetingId, meetingTitle, duration, currentTime, moments, onSave, onEdit, onPreview, onShare, onRemove, onRestore }: MomentManagerProps) {
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [range, setRange] = useState<[number, number]>([0, Math.min(30, duration)]);
  const [times, setTimes] = useState(["0:00", formatTime(Math.min(30, duration))]);
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [removed, setRemoved] = useState<SavedMoment | null>(null);
  const [readyClipId, setReadyClipId] = useState<string | null>(null);
  const [sharing, setSharing] = useState<string | null>(null);
  const safeDuration = Math.max(1, Math.floor(duration));
  const updateRange = (next: [number, number]) => { setRange(next); setTimes(next.map(formatTime)); setRangeError(null); };
  const begin = (moment?: SavedMoment) => {
    const start = moment?.startSeconds ?? Math.max(0, Math.min(Math.floor(currentTime), safeDuration - 1));
    updateRange([Math.floor(start), Math.floor(moment?.endSeconds ?? Math.min(safeDuration, start + 30))]);
    setLabel(moment?.label ?? "");
    setEditingId(moment?.id ?? null);
    setStatus(null);
    setEditing(true);
  };
  const changeTime = (index: number, value: string) => {
    setTimes((current) => current.map((time, position) => position === index ? value : time));
    const seconds = parseTime(value);
    if (seconds !== null && seconds <= safeDuration) setRange((current) => index === 0 ? [seconds, current[1]] : [current[0], seconds]);
  };
  const validRange = (): [number, number] | null => {
    const start = parseTime(times[0]);
    const end = parseTime(times[1]);
    if (start === null || end === null) { setRangeError("Use minutes:seconds or hours:minutes:seconds."); return null; }
    if (end - start < 1 || end > safeDuration) { setRangeError(`Choose at least one second within 0:00–${formatTime(safeDuration)}.`); return null; }
    setRangeError(null);
    return [start, end];
  };
  const save = () => {
    const valid = validRange();
    if (!valid) return;
    const patch = { label: label.trim() || "Saved moment", startSeconds: valid[0], endSeconds: valid[1] };
    if (editingId) onEdit(editingId, patch);
    else onSave({ meetingId, meetingTitle, ...patch });
    setStatus(`${editingId ? "Updated" : "Saved"} ${formatTime(valid[0])}–${formatTime(valid[1])}.`);
    setEditing(false);
  };
  const share = async (moment: SavedMoment) => {
    setSharing(moment.id);
    try {
      const path = await onShare(moment.id);
      setReadyClipId(moment.id);
      try { await navigator.clipboard.writeText(`${window.location.origin}${path}`); setStatus("Clip link copied."); }
      catch { setStatus("Clip created. Open the clip to copy its address."); }
    } catch (error) { setStatus(error instanceof Error ? error.message : "The clip could not be created. Try again."); }
    finally { setSharing(null); }
  };
  return (
    <section aria-label="Saved moments">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Saved moments <span className="ml-1 text-muted-foreground">{moments.length || ""}</span></h2>
        <Button size="sm" variant="outline" onClick={() => begin()}><BookmarkIcon aria-hidden="true" />Mark moment</Button>
      </div>
      {editing ? <form className="mt-4 rounded-lg border border-border bg-card p-4" onSubmit={(event) => { event.preventDefault(); save(); }}>
        <FieldGroup className="gap-4">
          <Field className="gap-2"><FieldLabel htmlFor="moment-label">Moment name</FieldLabel><Input id="moment-label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Budget decision" autoFocus /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field className="gap-2"><FieldLabel htmlFor="moment-start">Start</FieldLabel><Input id="moment-start" value={times[0]} onChange={(event) => changeTime(0, event.target.value)} aria-invalid={!!rangeError} /></Field>
            <Field className="gap-2"><FieldLabel htmlFor="moment-end">End</FieldLabel><Input id="moment-end" value={times[1]} onChange={(event) => changeTime(1, event.target.value)} aria-invalid={!!rangeError} /></Field>
          </div>
          <Slider value={range} min={0} max={safeDuration} step={1} onValueChange={(value) => { if (Array.isArray(value) && value.length === 2) updateRange([value[0], value[1]]); }} aria-label="Saved moment range" thumbLabels={["Moment start", "Moment end"]} />
        </FieldGroup>
        {rangeError ? <p className="mt-3 text-xs text-destructive" role="alert">{rangeError}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" type="submit">{editingId ? "Save changes" : "Save moment"}</Button>
          <Button size="sm" type="button" variant="outline" onClick={() => { const valid = validRange(); if (valid) onPreview(...valid); }}><PlayIcon aria-hidden="true" />Preview</Button>
          <Button size="sm" type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </form> : null}
      {moments.length ? <div className="mt-4 max-h-80 overflow-y-auto">
        {moments.map((moment) => <div key={moment.id} className="border-b border-border py-3 last:border-0">
          <button type="button" className="source-row w-full text-left" onClick={() => onPreview(moment.startSeconds, moment.endSeconds)}>
            <span className="block text-sm font-medium">{moment.label}</span>
            <span className="mt-1 block font-mono text-xs text-muted-foreground">{formatTime(moment.startSeconds)}–{formatTime(moment.endSeconds)}</span>
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <Button size="xs" variant="ghost" onClick={() => onPreview(moment.startSeconds, moment.endSeconds)}><PlayIcon aria-hidden="true" />Play clip</Button>
            <Button size="xs" variant="ghost" disabled={sharing === moment.id} onClick={() => share(moment)}><CopyIcon aria-hidden="true" />{sharing === moment.id ? "Creating…" : moment.shared ? "Copy link" : "Create clip"}</Button>
            <Button size="icon-xs" variant="ghost" aria-label={`Edit ${moment.label}`} onClick={() => begin(moment)}><PencilIcon aria-hidden="true" /></Button>
            <Button size="icon-xs" variant="ghost" aria-label={`Remove ${moment.label}`} onClick={() => { setRemoved(moment); onRemove(moment.id); setStatus("Moment removed."); }}><Trash2Icon aria-hidden="true" /></Button>
            {moment.shared || readyClipId === moment.id ? <Link href={clipHref(moment) as Route} target="_blank" className="source-time ml-1">Open clip<ExternalLinkIcon className="size-3" aria-hidden="true" /></Link> : null}
          </div>
        </div>)}
      </div> : <p className="mt-4 text-sm leading-6 text-muted-foreground">Mark a point in the recording to save or share it.</p>}
      {status ? <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground" role="status"><span>{status}</span>
        {removed ? <Button size="xs" variant="outline" onClick={() => { onRestore(removed); setRemoved(null); setStatus("Moment restored."); }}>Undo</Button> : null}
      </div> : null}
    </section>
  );
}
