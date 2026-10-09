"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRightIcon, BookmarkIcon, Link2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { clipHref, readAccordState, subscribeAccordState, type AccordState, type SavedMoment } from "@/lib/client-state";
import { formatTime } from "@/lib/format";

export function MomentsLibrary({ kind }: { kind: "saved" | "shared" }) {
  const [persisted, setPersisted] = useState<AccordState | null>(null);
  const [recordedMoments, setRecordedMoments] = useState<SavedMoment[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sharedOnly = kind === "shared";
  const title = sharedOnly ? "Shared clips" : "Saved moments";
  const Icon = sharedOnly ? Link2Icon : BookmarkIcon;

  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => {
      setPersisted(readAccordState());
      void fetch("/api/moments", { signal: controller.signal }).then(async (response) => {
        if (!response.ok) throw new Error("Your saved moments could not load. Reload this page to try again.");
        const result = await response.json(); setRecordedMoments(result.moments); setLoadError(null);
      }).catch((error) => { if (!controller.signal.aborted) setLoadError(error.message); });
    };
    refresh();
    const unsubscribe = subscribeAccordState(refresh);
    return () => { controller.abort(); unsubscribe(); };
  }, []);

  const moments = useMemo(() => {
    if (!persisted) return [];
    return [...Object.entries(persisted.meetings).filter(([id]) => !id.startsWith("rec-")).flatMap(([, meeting]) => meeting.moments ?? []), ...recordedMoments]
      .filter((moment) => !sharedOnly || moment.shared)
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [persisted, recordedMoments, sharedOnly]);

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {sharedOnly
            ? "Clips you created from saved moments."
            : "Selected moments from your meetings. Recordings are saved to your account. Sample moments stay in this browser."}
        </p>
      </header>

      <section aria-busy={!persisted} aria-label={title}>
        {loadError ? <p className="mb-4 text-sm text-destructive" role="alert">{loadError}</p> : null}
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-base font-semibold">{sharedOnly ? "All shared clips" : "All saved moments"}</h2>
          <span className="font-mono text-xs text-muted-foreground" aria-live="polite">
            {persisted
              ? `${moments.length} ${sharedOnly ? (moments.length === 1 ? "clip" : "clips") : (moments.length === 1 ? "moment" : "moments")}`
              : "Loading…"}
          </span>
        </div>

        {!persisted ? (
          <div className="flex flex-col gap-6 border-y border-border py-6" role="status" aria-label={`Loading ${title.toLowerCase()}`}>
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-start gap-4 px-3" aria-hidden="true">
                <Skeleton className="size-10 shrink-0" />
                <div className="flex flex-1 flex-col gap-3">
                  <Skeleton className="h-4 w-3/4 max-w-sm" />
                  <Skeleton className="h-3 w-1/2 max-w-60" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : moments.length === 0 ? (
          <Empty className="min-h-60 border-y border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon"><Icon aria-hidden="true" /></EmptyMedia>
              <EmptyTitle>{sharedOnly ? "No shared clips yet" : "No saved moments yet"}</EmptyTitle>
              <EmptyDescription>
                {sharedOnly
                  ? "Open a meeting, save a moment, and create a clip link."
                  : "Open a meeting and save a playback range to find it here."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" render={<Link href="/meetings" />}>Browse meetings</Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="border-y border-border">
            {moments.map((moment, index) => {
              const href = sharedOnly
                ? clipHref(moment)
                : `/meetings/${moment.meetingId}?t=${moment.startSeconds.toFixed(3)}`;
              return (
                <div key={moment.id}>
                  {index > 0 ? <Separator /> : null}
                  <Link
                    href={href as Route}
                    className="flex items-start gap-4 rounded-lg px-3 py-5 outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-card text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-base font-semibold tracking-[-0.02em]">{moment.label}</h3>
                      <p className="mt-1 break-words text-sm text-muted-foreground">{moment.meetingTitle}</p>
                      <p className="mt-3 font-mono text-xs text-muted-foreground">
                        {formatTime(moment.startSeconds)}–{formatTime(moment.endSeconds)}
                      </p>
                    </div>
                    <ArrowUpRightIcon className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
