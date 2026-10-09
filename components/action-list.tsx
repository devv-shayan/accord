"use client";

import { CheckIcon, Edit3Icon, PlayIcon, Undo2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActionFact } from "@/lib/types";

export interface ActionListProps {
  actions: ActionFact[];
  onListen: (action: ActionFact) => void;
  onEdit: (id: string) => void;
  onComplete: (id: string, completed: boolean) => void;
  onReview: (id: string, state: ActionFact["reviewState"]) => void;
  compact?: boolean;
}

export function ActionList({ actions, onListen, onEdit, onComplete, onReview, compact = false }: ActionListProps) {
  const visible = actions.filter((action) => action.reviewState !== "dismissed");
  const dismissed = actions.filter((action) => action.reviewState === "dismissed");
  const hasDraft = visible.some((action) => action.origin === "ai");
  const groups = hasDraft
    ? [{ label: "AI draft actions", rows: visible.filter((action) => action.origin === "ai") }, { label: "Saved actions", rows: visible.filter((action) => action.origin !== "ai") }]
    : [{ label: "", rows: visible }];
  return (
    <div>
      {visible.length === 0 ? <Empty className="min-h-40"><EmptyHeader><EmptyTitle>No actions</EmptyTitle><EmptyDescription>{dismissed.length ? "You removed all actions from this review." : "No tasks were extracted from this meeting."}</EmptyDescription></EmptyHeader></Empty> : null}
      {groups.map((group) => group.rows.length ? (
        <section key={group.label}>
          {group.label ? <h3 className="mb-2 mt-5 text-xs font-medium text-muted-foreground">{group.label}</h3> : null}
          <div className="divide-y divide-border">
            {group.rows.map((action) => (
              <div key={action.id} className={cn("group/action flex items-start gap-3 py-4", compact ? "gap-2" : "")}> 
                <div className="pt-1.5">
                  {action.reviewState === "open"
                    ? <span className="block size-4 rounded-full border border-border" aria-label="Open question" />
                    : <Checkbox checked={Boolean(action.completed)} onCheckedChange={(checked) => onComplete(action.id, checked)} aria-label={`${action.completed ? "Reopen" : "Complete"} ${action.title}`} />}
                </div>
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => onListen(action)}
                    className={cn("source-row w-full text-left text-[15px] font-medium leading-6", action.completed ? "text-muted-foreground line-through" : "text-foreground")}
                    aria-label={`${action.sourceStartSeconds === null ? "Check" : "Listen to"} source for ${action.title}`}>
                    {action.title}
                  </button>
                  {action.owner || action.due ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{[action.owner, action.due].filter(Boolean).join(" · ")}</p> : null}
                  {action.condition ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{action.condition}</p> : null}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {action.reviewState === "open" ? <span className="text-xs text-muted-foreground">Open question</span> : null}
                    {action.sourceStartSeconds !== null ? <button type="button" className="source-time" onClick={() => onListen(action)} aria-label={`Play ${action.title} at ${formatTime(action.sourceStartSeconds)}`}><PlayIcon aria-hidden="true" />{formatTime(action.sourceStartSeconds)}</button> : null}
                    {action.sourceStartSeconds === null ? <span className="text-xs text-muted-foreground">Source not linked</span> : null}
                    {action.reviewState === "needs-review" ? <Button variant="ghost" size="xs" onClick={() => onReview(action.id, "accepted")} aria-label={`Accept ${action.title}`}><CheckIcon data-icon="inline-start" />Review</Button> : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                  <Button variant="ghost" size="icon-sm" onClick={() => onEdit(action.id)} aria-label={`Edit ${action.title}`}><Edit3Icon aria-hidden="true" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => onReview(action.id, "dismissed")} aria-label={`Dismiss ${action.title}`}><XIcon aria-hidden="true" /></Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null)}
      {dismissed.length ? <details className="mt-5 border-t border-border pt-4"><summary className="cursor-pointer text-xs text-muted-foreground">Removed actions ({dismissed.length})</summary><div className="mt-2 flex flex-col gap-2">{dismissed.map((action) => <div key={action.id} className="flex items-center justify-between gap-3 text-sm text-muted-foreground"><span>{action.title}</span><Button variant="ghost" size="sm" onClick={() => onReview(action.id, "needs-review")} aria-label={`Restore ${action.title}`}><Undo2Icon data-icon="inline-start" />Restore</Button></div>)}</div></details> : null}
    </div>
  );
}
