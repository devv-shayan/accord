#!/usr/bin/env python3
"""Automatically export user prompts and final replies from Codex session files."""

import argparse
import datetime as dt
import fcntl
import json
import os
from pathlib import Path
import re
import sys
import time


def local_session_ids(root, key):
    """Read local capture settings on each scan."""
    config_path = root / ".agent-capture" / "settings.json"
    if not config_path.exists():
        return set()
    config = json.loads(config_path.read_text(encoding="utf-8"))
    session_ids = config.get(key, [])
    if not isinstance(session_ids, list) or any(
        not isinstance(value, str) or not re.fullmatch(r"[A-Za-z0-9_-]+", value)
        for value in session_ids
    ):
        raise ValueError("Invalid session IDs in " + key)
    return set(session_ids)


def excluded_session_ids(root):
    return local_session_ids(root, "excluded_session_ids")


def included_session_ids(root):
    """Allow named project sessions that started before capture was installed."""
    return local_session_ids(root, "included_session_ids")


def utc(value):
    return dt.datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(
        dt.timezone.utc
    ).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def messages(path, attachment_root=None):
    """Read only user text and explicit final messages. Never export tool records."""
    records = []
    with path.open(encoding="utf-8") as stream:
        for line in stream:
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                # A running session can have an incomplete last line.
                if not line.endswith("\n"):
                    break
                raise
    if not records or records[0].get("type") != "session_meta":
        raise ValueError("Missing Codex session metadata")
    meta = records[0]["payload"]
    entries = []
    pending = []
    model = None
    number = 0
    has_prompt = False

    def flush_prompts():
        nonlocal number, has_prompt
        if not model:
            return
        while pending:
            timestamp, body = pending.pop(0)
            number += 1
            entries.append(("PROMPT", number, utc(timestamp), model, body))
            has_prompt = True

    for record in records:
        payload = record.get("payload", {})
        kind = record.get("type")
        if kind == "turn_context":
            model = payload.get("model")
            flush_prompts()
        elif kind == "response_item" and payload.get("type") == "message":
            content = payload.get("content", [])
            if payload.get("role") == "user":
                metadata = payload.get("internal_chat_message_metadata_passthrough", {})
                content_kinds = metadata.get("content_item_kinds")
                texts = []
                for index, item in enumerate(content):
                    if item.get("type") != "input_text":
                        continue
                    text = item.get("text", "")
                    if content_kinds is not None:
                        if index >= len(content_kinds) or content_kinds[index] != "user.text":
                            continue
                    elif text.startswith(("<environment_context>", "# AGENTS.md instructions", "<permissions instructions>")):
                        continue
                    texts.append(text)
                if not texts:
                    continue
                body = "\n".join(texts)
                if attachment_root:
                    # The desktop app places pasted files in its attachment store.
                    # Keep the original message and add the complete source text.
                    for match in re.finditer(r"(/[^\n]+/Pasted text\.txt)", body):
                        source = Path(match.group(1)).resolve()
                        if attachment_root.resolve() in source.parents and source.is_file():
                            body += "\n\n[PASTED_FILE path=" + str(source) + "]\n" + source.read_text(encoding="utf-8")
                pending.append((record["timestamp"], body))
                # A new turn_context may follow the prompt. Wait for it.
            elif payload.get("role") == "assistant" and payload.get("phase") in ("final", "final_answer"):
                flush_prompts()
                if not model or not has_prompt:
                    raise ValueError("Final response has no prompt or model")
                text = "\n".join(item["text"] for item in content if item.get("type") == "output_text")
                entries.append(("RESPONSE", number, utc(record["timestamp"]), model, text))
    flush_prompts()
    return meta, entries


def body_for(entries, short_id):
    return "".join(
        "[LOG_ENTRY type={} num={} session={}]\ntimestamp: {}\nmodel: {}\n\n{}\n\n\n".format(
            kind, number, short_id, timestamp, model, body
        ) for kind, number, timestamp, model, body in entries
    )


def write_log(root, author, meta, entries):
    session_id = meta["id"]
    if not re.fullmatch(r"[A-Za-z0-9_-]+", session_id):
        raise ValueError("Invalid session ID")
    locks = root / ".agent-capture" / "log-locks"
    locks.mkdir(parents=True, exist_ok=True)
    with (locks / (session_id + ".lock")).open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if session_id in excluded_session_ids(root):
            return None
        return _write_log(root, author, meta, entries)


def _write_log(root, author, meta, entries):
    if not entries:
        return None
    session_id = meta["id"]
    if not re.fullmatch(r"[A-Za-z0-9_-]+", session_id):
        raise ValueError("Invalid session ID")
    short_id = session_id[:8]
    started = utc(meta["timestamp"])
    date = started[:10]
    filename = started[:19].replace("T", "_").replace(":", "-") + "_" + session_id + ".md"
    folder = root / ".agent-logs"
    folder.mkdir(exist_ok=True)
    path = folder / filename
    prompts = [entry for entry in entries if entry[0] == "PROMPT"]
    header = (
        "---\nsession_id: {}\ndate: {}\nauthor: {}\nmodel: {}\ntool: {}\nproject: {}\n"
        "total_exchanges: {}\nfirst_prompt_time: {}\nlast_prompt_time: {}\n---\n\n"
        "# Session Log - {}\n\nSession: `{}` | Project: `{}` | Author: `{}`\n\n---\n\n"
    ).format(
        session_id, date, author, entries[0][3],
        "codex-desktop" if meta.get("originator") == "codex_work_desktop" else "codex-cli",
        root.name, len(prompts), prompts[0][2], prompts[-1][2], date, short_id, root.name, author
    )
    body = body_for(entries, short_id)
    if path.exists():
        previous = path.read_text(encoding="utf-8")
        marker = "[LOG_ENTRY type="
        old_body = previous[previous.index(marker):]
        if old_body.startswith(body) and len(old_body) > len(body):
            # A hook and the recovery watcher can read different snapshots.
            return path
        if not body.startswith(old_body):
            raise ValueError("Refusing to change existing log entries: " + str(path))
        old_header = previous[:previous.index(marker)]
        if old_header == header:
            if len(body) > len(old_body):
                with path.open("a", encoding="utf-8") as stream:
                    stream.write(body[len(old_body):])
                    stream.flush()
                    os.fsync(stream.fileno())
            return path
        # Only front matter changes; all prior entry bytes remain identical.
    temporary = path.with_suffix(".md.tmp")
    with temporary.open("w", encoding="utf-8") as stream:
        stream.write(header + body)
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temporary, path)
    return path


def scan(root, sessions, author, cache, start_utc=None):
    exported = 0
    excluded = excluded_session_ids(root)
    included = included_session_ids(root)
    policy = (tuple(sorted(excluded)), tuple(sorted(included)))
    for path in sessions.rglob("rollout-*.jsonl"):
        stat = path.stat()
        signature = (stat.st_mtime_ns, stat.st_size, policy)
        if cache.get(str(path)) == signature:
            continue
        with path.open(encoding="utf-8") as stream:
            first = stream.readline()
        if not first.endswith("\n"):
            continue
        metadata = json.loads(first).get("payload", {})
        if metadata.get("id") in excluded:
            cache[str(path)] = signature
            continue
        raw_cwd = Path(metadata.get("cwd", "/"))
        if not raw_cwd.is_absolute() or (
            start_utc and utc(metadata["timestamp"]) < start_utc
            and metadata.get("id") not in included
        ):
            cache[str(path)] = signature
            continue
        if isinstance(metadata.get("source"), dict) and "subagent" in metadata["source"]:
            cache[str(path)] = signature
            continue
        cwd = raw_cwd.resolve()
        if cwd != root and root not in cwd.parents:
            cache[str(path)] = signature
            continue
        meta, entries = messages(path, sessions.parent / "attachments")
        if write_log(root, author, meta, entries):
            exported += 1
        cache[str(path)] = signature
    return exported


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--sessions", type=Path, required=True)
    parser.add_argument("--author", required=True)
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--start-utc")
    args = parser.parse_args()
    root = args.root.resolve()
    runtime = root / ".agent-capture"
    runtime.mkdir(exist_ok=True)
    cache = {}
    with (runtime / "exporter.lock").open("w") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            sys.exit("The capture process is already running.")
        while True:
            try:
                count = scan(root, args.sessions, args.author, cache, args.start_utc)
                status = {"pid": os.getpid(), "last_scan_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
                          "exported_sessions_this_scan": count, "error": None}
            except Exception as error:
                status = {"pid": os.getpid(), "error": str(error)}
                print(str(error), file=sys.stderr, flush=True)
                if args.once:
                    raise
            (runtime / "status.json").write_text(json.dumps(status) + "\n", encoding="utf-8")
            if args.once:
                break
            time.sleep(1)


if __name__ == "__main__":
    main()
