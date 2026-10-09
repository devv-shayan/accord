"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { ActionFact } from "@/lib/types";

type EditableActionFields = Pick<
  ActionFact,
  "title" | "owner" | "due" | "condition" | "recipient"
>;

interface ActionReviewSheetProps {
  action: ActionFact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: EditableActionFields) => void;
}

function toDraft(action: ActionFact | null): Record<keyof EditableActionFields, string> {
  return {
    title: action?.title ?? "",
    owner: action?.owner ?? "",
    due: action?.due ?? "",
    condition: action?.condition ?? "",
    recipient: action?.recipient ?? "",
  };
}

export function ActionReviewSheet({ action, open, onOpenChange, onSave }: ActionReviewSheetProps) {
  return <Sheet open={open} onOpenChange={onOpenChange}>
    {action ? <ActionEditor key={`${action.id}:${open}`} action={action} onOpenChange={onOpenChange} onSave={onSave} /> : null}
  </Sheet>;
}

function ActionEditor({ action, onOpenChange, onSave }: Omit<ActionReviewSheetProps, "open" | "action"> & { action: ActionFact }) {
  const [draft, setDraft] = useState(() => toDraft(action));

  const update = (field: keyof EditableActionFields, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const submit = () => {
    if (!draft.title.trim()) return;
    onSave(action.id, {
      title: draft.title.trim(),
      owner: draft.owner.trim() || null,
      due: draft.due.trim() || null,
      recipient: draft.recipient.trim() || null,
      condition: draft.condition.trim() || null,
    });
    onOpenChange(false);
  };

  return (
      <SheetContent className="sm:max-w-md">
        <form className="flex h-full min-h-0 flex-col" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <SheetHeader>
          <SheetTitle>Edit action</SheetTitle>
          <SheetDescription>
            Keep values blank when the source does not confirm them.
          </SheetDescription>
        </SheetHeader>

        <FieldGroup className="min-h-0 flex-1 gap-4 overflow-y-auto px-4 pb-4">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="action-title">Action</FieldLabel>
            <Input
              id="action-title"
              value={draft.title}
              onChange={(event) => update("title", event.target.value)}
            />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="action-owner">Owner</FieldLabel>
            <Input
              id="action-owner"
              value={draft.owner}
              placeholder="Unknown"
              onChange={(event) => update("owner", event.target.value)}
            />
            <FieldDescription>Leave blank when the source does not name an owner.</FieldDescription>
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="action-due">Due</FieldLabel>
            <Input
              id="action-due"
              value={draft.due}
              placeholder="Not confirmed"
              onChange={(event) => update("due", event.target.value)}
            />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="action-recipient">Recipient</FieldLabel>
            <Input
              id="action-recipient"
              value={draft.recipient}
              placeholder="None"
              onChange={(event) => update("recipient", event.target.value)}
            />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="action-condition">Condition</FieldLabel>
            <Textarea
              id="action-condition"
              value={draft.condition}
              placeholder="No condition recorded"
              onChange={(event) => update("condition", event.target.value)}
            />
          </Field>
        </FieldGroup>

        <SheetFooter>
          <Button type="submit" disabled={!draft.title.trim()}>
            Save changes
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </SheetFooter>
        </form>
      </SheetContent>
  );
}
