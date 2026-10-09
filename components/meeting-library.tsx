"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRightIcon, AudioLinesIcon, SearchIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import {
  readAccordState,
  subscribeAccordState,
  type AccordState,
} from "@/lib/client-state";
import type { MeetingCatalogItem } from "@/lib/types";
import { meetingReviewCount } from "@/lib/review-count";

interface SearchResult {
  id: string;
  meetingId: string;
  meetingTitle: string;
  kind: "meeting" | "transcript";
  label: string;
  snippet: string;
  time: number | null;
}

export function MeetingLibrary({ meetings }: { meetings: MeetingCatalogItem[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [persisted, setPersisted] = useState<AccordState>({ version: 1, meetings: {} });

  const updateQuery = (value: string) => {
    setQuery(value);
    setResults([]);
    setSearching(value.trim().length >= 2);
    setSearchError(null);
  };

  useEffect(() => {
    const refresh = () => setPersisted(readAccordState());
    refresh();
    return subscribeAccordState(refresh);
  }, []);

  const filteredMeetings = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (normalized.length >= 2) return meetings;
    if (!normalized) return meetings;

    return meetings.filter((meeting) =>
      `${meeting.title} ${meeting.description} ${meeting.sourceLabel}`
        .toLocaleLowerCase()
        .includes(normalized)
    );
  }, [meetings, query]);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(normalized)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search could not load. Try again.");
        const data = (await response.json()) as { results: SearchResult[]; total: number };
        if (!controller.signal.aborted) { setResults(data.results); setTotalResults(data.total); }
      } catch (error) {
        if (!controller.signal.aborted) setSearchError(error instanceof Error ? error.message : "Search could not load. Try again.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const isSearchMode = query.trim().length >= 2;

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-5 border-b border-border pb-6 md:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Meetings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Recordings, notes, and action items.</p>
          <Link href="/record" className={buttonVariants({ size: "sm", className: "mt-4" })}>Record a meeting</Link>
        </div>
        <Field className="gap-2">
          <FieldLabel htmlFor="meeting-search">Search meetings</FieldLabel>
          <InputGroup>
            <InputGroupAddon><SearchIcon aria-hidden="true" /></InputGroupAddon>
            <InputGroupInput id="meeting-search"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Try budget, retention, or speaker 4"
            />
            {query ? <InputGroupAddon align="inline-end"><InputGroupButton size="icon-xs" aria-label="Clear meeting search" onClick={() => updateQuery("")}><XIcon aria-hidden="true" /></InputGroupButton></InputGroupAddon> : null}
          </InputGroup>
        </Field>
      </section>

      {isSearchMode ? (
        <section aria-live="polite">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Search results</h2>
            <span className="font-mono text-xs text-muted-foreground">
              {searching ? "Searching…" : searchError ? "Search unavailable" : `${results.length} of ${totalResults} matches`}
            </span>
          </div>
          <div className="border-y border-border">
            {results.length === 0 && !searching ? (
              <p className="px-1 py-10 text-sm text-muted-foreground" role={searchError ? "alert" : "status"}>{searchError || "No title or transcript match. Try a different word."}</p>
            ) : null}
            {results.map((result, index) => {
              const href =
                result.time === null
                  ? `/meetings/${result.meetingId}`
                  : `/meetings/${result.meetingId}?t=${result.time.toFixed(3)}&q=${encodeURIComponent(query.trim())}`;

              return (
                <div key={`${result.meetingId}-${result.id}`}>
                  {index > 0 ? <Separator /> : null}
                  <Link
                    href={href as Route}
                    className="grid gap-3 px-1 py-5 outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:items-start"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={result.kind === "transcript" ? "outline" : "secondary"}>
                        {result.kind}
                      </Badge>
                      <span className="font-mono text-[11px] text-muted-foreground">{result.label}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{result.meetingTitle}</div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {result.snippet}
                      </p>
                    </div>
                    <ArrowUpRightIcon aria-hidden="true" className="mt-0.5 text-muted-foreground" />
                  </Link>
                </div>
              );
            })}
          </div>
          {!searching && totalResults > results.length ? <p className="mt-3 text-xs text-muted-foreground">Up to four passages per meeting. Open a passage to see all matches in its transcript.</p> : null}
        </section>
      ) : (
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">All meetings</h2>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{filteredMeetings.length} meetings</span>
          </div>
          <div className="border-y border-border">
            {filteredMeetings.map((meeting, index) => (
              <div key={meeting.id}>
                {index > 0 ? <Separator /> : null}
                <Link
                  href={`/meetings/${meeting.id}` as Route}
                  className="flex items-start gap-4 rounded-lg px-3 py-6 outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary"><AudioLinesIcon className="size-6" aria-hidden="true" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold tracking-[-0.02em]">{meeting.title}</h3>
                      <Badge variant={meeting.sourceKind === "public-reference" ? "default" : "outline"}>
                        {meeting.sourceKind === "recording" ? "Your recording" : meeting.sourceKind === "public-reference" ? "Public reference" : "Scripted test"}
                      </Badge>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{meeting.description}</p>
                    <p className="mt-3 text-xs text-muted-foreground">{meeting.recordedDate} · {meeting.durationLabel} · {meeting.speakerCount} {meeting.sourceKind === "recording" ? "AI voice labels" : meeting.sourceKind === "controlled-test" ? "script roles" : "speakers"}</p>
                    {currentReviewCount(meeting, persisted) > 0 ? <p className="mt-2 text-xs text-primary">{currentReviewCount(meeting, persisted)} {currentReviewCount(meeting, persisted) === 1 ? "fact" : "facts"} to review</p> : null}
                  </div>
                  <ArrowUpRightIcon aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function currentReviewCount(meeting: MeetingCatalogItem, state: AccordState) {
  return meeting.sourceKind === "recording" ? meeting.reviewCount : meetingReviewCount(meeting, state.meetings[meeting.id]);
}
