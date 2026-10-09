"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AiSummaryDraft, SummaryTemplate } from "@/lib/client-state";

interface GenerationState { generating: boolean; error: string | null }
const idle: GenerationState = { generating: false, error: null };

export function useAiSummary({ meetingId, active, hydrated, format, drafts, onSave }: {
  meetingId: string;
  active: boolean;
  hydrated: boolean;
  format: SummaryTemplate;
  drafts: Partial<Record<SummaryTemplate, AiSummaryDraft>>;
  onSave: (format: SummaryTemplate, draft: AiSummaryDraft) => void;
}) {
  const requests = useRef(new Map<SummaryTemplate, AbortController>());
  const attempted = useRef(new Set<SummaryTemplate>());
  const [states, setStates] = useState<Partial<Record<SummaryTemplate, GenerationState>>>({});

  useEffect(() => {
    const pending = requests.current;
    const tried = attempted.current;
    return () => {
      for (const [requestedFormat, controller] of pending) {
        controller.abort();
        tried.delete(requestedFormat);
      }
      pending.clear();
      tried.clear();
    };
  }, [meetingId]);

  const generate = useCallback(async (requestedFormat: SummaryTemplate) => {
    if (requests.current.has(requestedFormat)) return;
    const controller = new AbortController();
    requests.current.set(requestedFormat, controller);
    attempted.current.add(requestedFormat);
    setStates((current) => ({ ...current, [requestedFormat]: { generating: true, error: null } }));
    try {
      const response = await fetch("/api/ai/summary", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, format: requestedFormat }), signal: controller.signal,
      });
      const payload = await response.json() as { draft?: AiSummaryDraft; error?: string };
      if (!response.ok || !payload.draft) throw new Error(payload.error || "The summary could not load. Try again.");
      if (payload.draft.format !== requestedFormat) throw new Error("Gemini returned a different summary format. Try again.");
      if (!controller.signal.aborted && requests.current.get(requestedFormat) === controller) onSave(requestedFormat, payload.draft);
    } catch (error) {
      if (!controller.signal.aborted) setStates((current) => ({ ...current, [requestedFormat]: {
        generating: false, error: error instanceof Error ? error.message : "The summary could not load. Try again.",
      } }));
    } finally {
      if (requests.current.get(requestedFormat) === controller) {
        requests.current.delete(requestedFormat);
        setStates((current) => ({ ...current, [requestedFormat]: { ...(current[requestedFormat] ?? idle), generating: false } }));
      }
    }
  }, [meetingId, onSave]);

  useEffect(() => {
    if (active && hydrated && !drafts[format] && !attempted.current.has(format)) void generate(format);
  }, [active, hydrated, format, drafts, generate]);

  const cancel = () => {
    const controller = requests.current.get(format);
    if (!controller) return;
    controller.abort();
    requests.current.delete(format);
    setStates((current) => ({ ...current, [format]: { generating: false, error: "Summary generation stopped. Select Retry to try again." } }));
  };

  return { ...(states[format] ?? idle), generate: () => void generate(format), cancel };
}
