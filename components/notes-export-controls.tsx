"use client";

import { useState } from "react";
import { CopyIcon, DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotesExportControls({ content, fileName, kind, disabled = false }: {
  content: string;
  fileName: string;
  kind: "summary" | "actions";
  disabled?: boolean;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const label = kind === "summary" ? "Summary" : "Action items";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setStatus(`${label} copied.`);
    } catch {
      setStatus("Copy is not available. Download instead.");
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(`${label} downloaded.`);
  };

  return <div className="flex flex-col gap-1">
    <div className="flex gap-1">
      <Button variant="ghost" size="sm" disabled={disabled} aria-label={`Copy ${kind === "summary" ? "summary" : "action items"}`} onClick={copy}><CopyIcon data-icon="inline-start" aria-hidden="true" />Copy</Button>
      <Button variant="ghost" size="sm" disabled={disabled} aria-label={`Download ${kind === "summary" ? "summary" : "action items"}`} onClick={download}><DownloadIcon data-icon="inline-start" aria-hidden="true" />Download</Button>
    </div>
    {status ? <p className="text-xs text-muted-foreground" role="status">{status}</p> : null}
  </div>;
}
