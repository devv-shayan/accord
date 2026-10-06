#!/usr/bin/env python3
"""Codex lifecycle hook: export the session, and start a recovery watcher."""
import json
import os
from pathlib import Path
import subprocess
import sys
import datetime as dt

from agent_capture import messages, write_log

root = Path(__file__).resolve().parents[1]
config = json.loads((root / "agent-capture.json").read_text())
event = json.load(sys.stdin)
runtime = root / ".agent-capture"
runtime.mkdir(exist_ok=True)
with (runtime / "hook-events.jsonl").open("a", encoding="utf-8") as audit:
    audit.write(json.dumps({"timestamp": dt.datetime.now(dt.timezone.utc).isoformat(),
                           "event": event.get("hook_event_name"),
                           "session_id": event.get("session_id"),
                           "model": event.get("model")}) + "\n")
transcript = event.get("transcript_path")
if transcript and Path(transcript).is_file():
    meta, entries = messages(Path(transcript), Path(config["session_store"]).expanduser().parent / "attachments")
    write_log(root, config["author"], meta, entries)

# The prompt hook can run before its transcript line is written. The watcher
# exports it as soon as Codex persists it. It also captures this setup turn.
pid_path = runtime / "watcher.pid"
running = False
if pid_path.exists():
    try:
        os.kill(int(pid_path.read_text()), 0)
        running = True
    except (ProcessLookupError, ValueError):
        pass
if not running:
    with (runtime / "watcher.stderr.log").open("ab") as stderr:
        process = subprocess.Popen([
            "/usr/bin/python3", str(root / "scripts/agent_capture.py"),
            "--root", str(root), "--sessions", str(Path(config["session_store"]).expanduser()),
            "--author", config["author"], "--start-utc", config["capture_start_utc"],
        ], stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=stderr,
            start_new_session=True, close_fds=True)
    pid_path.write_text(str(process.pid))
print("{}")
