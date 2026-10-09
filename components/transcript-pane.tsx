"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDownIcon, ChevronUpIcon, CopyIcon, LocateFixedIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatTime } from "@/lib/format";
import { groupTranscript, transcriptText } from "@/lib/transcript";
import type { TranscriptSegment, TranscriptTiming } from "@/lib/types";
import { cn } from "cn";

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return text;
  const parts = [];
  const lower = text.toLocaleLowerCase();
  const match = query.toLocaleLowerCase();
  let cursor = 0;
  let index = lower.indexOf(match);
  while (index >= 0) {
    parts.push(text.slice(cursor, index), <mark key={index}>{text.slice(index, index + query.length)}</mark>);
    cursor = index + query.length;
    index = lower.indexOf(match, cursor);
  }
  parts.push(text.slice(cursor));
  return parts;
}

export function TranscriptPane({ segments, speakers, timing, currentTime, onSeek, initialQuery = "" }: {
  segments: TranscriptSegment[]; speakers: string[]; timing: TranscriptTiming; currentTime: number;
  onSeek: (seconds: number, segmentId: string) => void; initialQuery?: string;
}) {
  "use no memo"; // TanStack Virtual exposes mutable measurements. Remove when its hook supports React Compiler.
  const initialSpeaker = speakers.find((name) => name.toLocaleLowerCase() === initialQuery.toLocaleLowerCase());
  const [query, setQuery] = useState(initialSpeaker ? "" : initialQuery);
  const [speaker, setSpeaker] = useState(initialSpeaker ?? "all");
  const [followPlayback, setFollowPlayback] = useState(timing !== "unverified");
  const [matchIndex, setMatchIndex] = useState(0);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const normalized = query.trim();
  const speakerItems = useMemo(() => [{ value: "all", label: "All speakers" }, ...speakers.map((name) => ({ value: name, label: name }))], [speakers]);
  const filtered = useMemo(() => segments.filter((segment) =>
    (speaker === "all" || segment.speakerLabel === speaker) &&
    (!normalized || segment.text.toLocaleLowerCase().includes(normalized.toLocaleLowerCase()))
  ), [segments, speaker, normalized]);
  const turns = useMemo(() => groupTranscript(filtered), [filtered]);
  const activeIds = useMemo(() => new Set(timing === "unverified" ? [] : segments.filter((segment) =>
    segment.startSeconds !== null && segment.endSeconds !== null &&
    currentTime >= segment.startSeconds && currentTime < segment.endSeconds
  ).map((segment) => segment.id)), [segments, timing, currentTime]);
  const activeTurn = turns.findIndex((turn) => turn.segments.some((segment) => activeIds.has(segment.id)));
  // eslint-disable-next-line react-hooks/incompatible-library -- This component explicitly opts out of compiler memoization for TanStack Virtual.
  const virtualizer = useVirtualizer({
    count: turns.length,
    getScrollElement: () => parentRef.current,
    getItemKey: (index) => turns[index].id,
    estimateSize: (index) => 66 + Math.ceil(turns[index].segments.reduce((total, segment) => total + segment.text.length, 0) / 75) * 26,
    overscan: 7,
  });
  useEffect(() => { virtualizer.scrollToOffset(0); }, [normalized, speaker, virtualizer]);
  useEffect(() => {
    if (followPlayback && !normalized && activeTurn >= 0) virtualizer.scrollToIndex(activeTurn, { align: "center" });
  }, [activeTurn, followPlayback, normalized, speaker, virtualizer]);
  const showMatch = (next: number) => {
    if (!filtered.length) return;
    const index = (next + filtered.length) % filtered.length;
    setMatchIndex(index);
    const turn = turns.findIndex((item) => item.segments.some((segment) => segment.id === filtered[index].id));
    virtualizer.scrollToIndex(turn, { align: "center" });
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(transcriptText(segments, formatTime)); setCopyStatus("Transcript copied."); }
    catch { setCopyStatus("The browser blocked transcript copy. Allow clipboard access and try again."); }
  };
  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Transcript</h2>
        <Button size="sm" variant="ghost" onClick={copy}><CopyIcon aria-hidden="true" />Copy transcript</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
        <Field className="gap-2"><FieldLabel htmlFor="transcript-search">Search this transcript</FieldLabel>
          <InputGroup>
            <InputGroupAddon><SearchIcon aria-hidden="true" /></InputGroupAddon>
            <InputGroupInput id="transcript-search" value={query} placeholder="Search exact words"
              onChange={(event) => { setQuery(event.target.value); setMatchIndex(0); }} />
            {query ? <InputGroupAddon align="inline-end"><InputGroupButton size="icon-xs" aria-label="Clear transcript search" onClick={() => { setQuery(""); setMatchIndex(0); }}><XIcon aria-hidden="true" /></InputGroupButton></InputGroupAddon> : null}
          </InputGroup>
        </Field>
        <Field className="gap-2"><FieldLabel htmlFor="speaker-filter">Speaker</FieldLabel>
          <Select items={speakerItems} value={speaker} onValueChange={(value) => { setSpeaker(value ? String(value) : "all"); setMatchIndex(0); }}>
            <SelectTrigger id="speaker-filter" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>{speakerItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <span className="text-xs text-muted-foreground" role="status">
          {normalized ? `${filtered.length} matching ${filtered.length === 1 ? "passage" : "passages"}` : `${filtered.length.toLocaleString()} ${speaker === "all" ? "source" : speaker.toLocaleLowerCase()} passages`}
        </span>
        <div className="flex items-center gap-1">
          {normalized && filtered.length ? <>
            <span className="mr-1 text-xs tabular-nums text-muted-foreground">{Math.min(matchIndex + 1, filtered.length)} / {filtered.length}</span>
            <Button size="icon-sm" variant="ghost" aria-label="Previous match" onClick={() => showMatch(matchIndex - 1)}><ChevronUpIcon aria-hidden="true" /></Button>
            <Button size="icon-sm" variant="ghost" aria-label="Next match" onClick={() => showMatch(matchIndex + 1)}><ChevronDownIcon aria-hidden="true" /></Button>
          </> : null}
          {timing !== "unverified" ? <Button size="sm" variant={followPlayback ? "secondary" : "ghost"} aria-pressed={followPlayback}
            onClick={() => { setFollowPlayback(!followPlayback); if (!followPlayback && activeTurn >= 0) virtualizer.scrollToIndex(activeTurn, { align: "center" }); }}>
            <LocateFixedIcon aria-hidden="true" />Follow playback
          </Button> : null}
        </div>
      </div>
      {copyStatus ? <p className="text-xs text-muted-foreground" role="status">{copyStatus}</p> : null}
      {filtered.length === 0 ? <Empty className="min-h-64"><EmptyHeader><EmptyTitle>No matching passages</EmptyTitle><EmptyDescription>Use a different word or speaker.</EmptyDescription></EmptyHeader><Button size="sm" variant="outline" onClick={() => { setQuery(""); setSpeaker("all"); setMatchIndex(0); }}>Clear filters</Button></Empty> : (
        <div ref={parentRef} className="h-[58vh] min-h-80 overflow-auto overscroll-contain pr-2"
          onWheel={() => setFollowPlayback(false)} onTouchMove={() => setFollowPlayback(false)}>
          <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((row) => {
              const turn = turns[row.index];
              const first = turn.segments[0];
              const active = turn.segments.some((segment) => activeIds.has(segment.id));
              return <div key={turn.id} ref={virtualizer.measureElement} data-index={row.index} className="absolute left-0 top-0 w-full pb-3" style={{ transform: `translateY(${row.start}px)` }}>
                <div className={cn("rounded-lg border-l-2 border-transparent px-3 py-3", active && "border-primary bg-primary/5")}>
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-xs font-semibold text-muted-foreground">{turn.speakerLabel}</span>
                    <button type="button" className="source-time" disabled={timing === "unverified" || first.startSeconds === null}
                      aria-label={`Play ${turn.speakerLabel} at ${first.startSeconds === null ? "unknown time" : formatTime(first.startSeconds)}`}
                      onClick={() => { if (first.startSeconds !== null) onSeek(first.startSeconds, first.id); }}>
                      {first.startSeconds === null ? "--:--" : formatTime(first.startSeconds)}
                    </button>
                  </div>
                  <p className="text-[15px] leading-7">
                    {turn.segments.map((segment) => <span key={segment.id}>
                      <button type="button" className={cn("transcript-phrase", activeIds.has(segment.id) && "is-active", normalized && filtered[matchIndex]?.id === segment.id && "is-match")}
                        disabled={timing === "unverified" || segment.startSeconds === null} aria-label={`Play passage: ${segment.text}`}
                        onClick={() => { if (segment.startSeconds !== null) { setFollowPlayback(true); onSeek(segment.startSeconds, segment.id); } }}>
                        <Highlight text={segment.text} query={normalized} />
                      </button>{" "}
                    </span>)}
                  </p>
                </div>
              </div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
