import importlib.util
import json
from pathlib import Path
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location("capture", Path(__file__).parents[1] / "scripts/agent_capture.py")
capture = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(capture)


class CaptureTests(unittest.TestCase):
    @staticmethod
    def settings_fixture(root, sessions):
        runtime = root / ".agent-capture"
        runtime.mkdir(exist_ok=True)
        (runtime / "settings.json").write_text(json.dumps({"excluded_session_ids": sessions}))

    @staticmethod
    def session_fixture(path, root, session_id):
        records = [
            {"type": "session_meta", "payload": {"id": session_id, "timestamp": "2026-10-08T12:00:00.000Z", "cwd": str(root)}},
            {"type": "response_item", "timestamp": "2026-10-08T12:00:01.000Z", "payload": {"type": "message", "role": "user", "content": [{"type": "input_text", "text": "Fixture prompt."}]}},
            {"type": "turn_context", "payload": {"model": "test-model"}},
            {"type": "response_item", "timestamp": "2026-10-08T12:00:02.000Z", "payload": {"type": "message", "role": "assistant", "phase": "final", "content": [{"type": "output_text", "text": "Fixture response."}]}},
        ]
        path.write_text("".join(json.dumps(row) + "\n" for row in records))

    def test_session_exclusion_blocks_scan_and_direct_write_with_cache_refresh(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory).resolve(); root = base / "project"; root.mkdir()
            sessions = base / "sessions"; sessions.mkdir()
            private = sessions / "rollout-private.jsonl"
            public = sessions / "rollout-public.jsonl"
            self.session_fixture(private, root, "private-session")
            self.session_fixture(public, root, "public-session")
            cache = {}
            self.assertEqual(capture.scan(root, sessions, "author", cache), 2)
            private_output = next((root / ".agent-logs").glob("*private-session.md"))
            public_output = next((root / ".agent-logs").glob("*public-session.md"))
            public_before = public_output.read_bytes()
            self.settings_fixture(root, ["private-session"])
            private_output.unlink()
            capture.scan(root, sessions, "author", cache)
            self.assertFalse(private_output.exists())
            meta, entries = capture.messages(private)
            self.assertIsNone(capture.write_log(root, "author", meta, entries))
            self.assertFalse(private_output.exists())
            self.assertEqual(public_output.read_bytes(), public_before)
            # A changed exclusion policy is read even if source files did not change.
            self.settings_fixture(root, [])
            capture.scan(root, sessions, "author", cache)
            self.assertTrue(private_output.exists())

    def test_hook_does_not_export_or_audit_an_excluded_chat(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); scripts = root / "scripts"; scripts.mkdir()
            for name in ("agent_capture.py", "capture_hook.py"):
                shutil.copyfile(Path(__file__).parents[1] / "scripts" / name, scripts / name)
            sessions = root / "sessions"; sessions.mkdir()
            transcript = sessions / "rollout-private.jsonl"
            self.session_fixture(transcript, root, "private-session")
            (root / "agent-capture.json").write_text(json.dumps({"author": "test", "session_store": str(sessions), "capture_start_utc": "2026-10-06T12:00:00.000Z"}))
            self.settings_fixture(root, ["private-session"])
            runtime = root / ".agent-capture"
            # Suppress watcher creation in this fixture by using this live test PID.
            (runtime / "watcher.pid").write_text(str(os.getpid()))
            result = subprocess.run([sys.executable, str(scripts / "capture_hook.py")], input=json.dumps({"hook_event_name": "Stop", "session_id": "private-session", "transcript_path": str(transcript)}), text=True, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertFalse((root / ".agent-logs").exists())
            self.assertFalse((runtime / "hook-events.jsonl").exists())

    def test_named_older_session_is_recovered_without_widening_project_scope(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory).resolve()
            root = base / "project"; root.mkdir()
            sessions = base / "sessions"; sessions.mkdir()
            other_root = base / "other"; other_root.mkdir()
            for session_id, cwd in (("older-session", root),
                                    ("unrequested-session", root),
                                    ("other-project-session", other_root)):
                self.session_fixture(sessions / f"rollout-{session_id}.jsonl", cwd, session_id)
            cache = {}
            start = "2026-10-09T00:00:00.000Z"
            self.assertEqual(capture.scan(root, sessions, "author", cache, start), 0)
            runtime = root / ".agent-capture"; runtime.mkdir(exist_ok=True)
            (runtime / "settings.json").write_text(json.dumps({
                "included_session_ids": ["older-session", "other-project-session"]
            }))
            self.assertEqual(capture.scan(root, sessions, "author", cache, start), 1)
            outputs = list((root / ".agent-logs").glob("*.md"))
            self.assertEqual(len(outputs), 1)
            self.assertIn("older-session", outputs[0].name)

    def test_hook_captures_a_named_older_session(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve(); scripts = root / "scripts"; scripts.mkdir()
            for name in ("agent_capture.py", "capture_hook.py"):
                shutil.copyfile(Path(__file__).parents[1] / "scripts" / name, scripts / name)
            sessions = root / "sessions"; sessions.mkdir()
            transcript = sessions / "rollout-older.jsonl"
            self.session_fixture(transcript, root, "older-session")
            (root / "agent-capture.json").write_text(json.dumps({
                "author": "test", "session_store": str(sessions),
                "capture_start_utc": "2026-10-09T00:00:00.000Z"
            }))
            runtime = root / ".agent-capture"; runtime.mkdir(exist_ok=True)
            (runtime / "settings.json").write_text(json.dumps({
                "included_session_ids": ["older-session"]
            }))
            (runtime / "watcher.pid").write_text(str(os.getpid()))
            result = subprocess.run([sys.executable, str(scripts / "capture_hook.py")],
                input=json.dumps({"hook_event_name": "Stop", "session_id": "older-session",
                                  "transcript_path": str(transcript)}),
                text=True, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            outputs = list((root / ".agent-logs").glob("*.md"))
            self.assertEqual(len(outputs), 1)
            self.assertIn("Fixture response.", outputs[0].read_text())

    def test_full_text_models_filtering_and_immutable_entries(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "rollout-test.jsonl"
            records = []

            def add(kind, payload):
                records.append({"timestamp": "2026-10-06T12:00:00.123Z", "type": kind, "payload": payload})

            add("session_meta", {"id": "test-session", "timestamp": "2026-10-06T12:00:00.123Z", "cwd": str(root)})
            add("response_item", {"type": "message", "role": "user", "content": [
                {"type": "input_text", "text": "hidden context"}],
                "internal_chat_message_metadata_passthrough": {"content_item_kinds": ["environments.environment_context"]}})
            prompt = "  CAPTURE TEST — 8x assignment, Shayan Khan\n\n" + "Full text. " * 3000
            add("response_item", {"type": "message", "role": "user", "content": [{"type": "input_text", "text": prompt}]})
            add("turn_context", {"model": "model-one"})
            add("response_item", {"type": "reasoning", "summary": [{"text": "private thinking"}]})
            add("response_item", {"type": "function_call", "arguments": "tool input"})
            add("response_item", {"type": "message", "role": "assistant", "phase": "commentary", "content": [{"type": "output_text", "text": "intermediate output"}]})
            add("response_item", {"type": "message", "role": "assistant", "phase": "final", "content": [{"type": "output_text", "text": "First response.\n"}]})
            source.write_text("".join(json.dumps(row) + "\n" for row in records))
            meta, entries = capture.messages(source)
            self.assertEqual([row[0] for row in entries], ["PROMPT", "RESPONSE"])
            self.assertEqual(entries[0][4], prompt)
            output = capture.write_log(root, "author", meta, entries)
            first = output.read_text()
            self.assertNotIn("private thinking", first)
            self.assertNotIn("tool input", first)
            self.assertNotIn("intermediate output", first)
            self.assertNotIn("hidden context", first)
            capture.write_log(root, "author", meta, entries)
            self.assertEqual(output.read_text(), first)
            add("response_item", {"type": "message", "role": "user", "content": [{"type": "input_text", "text": "Second prompt."}]})
            add("turn_context", {"model": "model-two"})
            add("response_item", {"type": "message", "role": "assistant", "phase": "final_answer", "content": [{"type": "output_text", "text": "Second response."}]})
            source.write_text("".join(json.dumps(row) + "\n" for row in records) + '{"unfinished":')
            meta, later = capture.messages(source)
            self.assertEqual([row[3] for row in later], ["model-one", "model-one", "model-two", "model-two"])
            capture.write_log(root, "author", meta, later)
            old_body = first[first.index("[LOG_ENTRY"):]
            now = output.read_text()
            self.assertTrue(now[now.index("[LOG_ENTRY"):].startswith(old_body))
            changed = list(later)
            changed[0] = (*changed[0][:4], "Changed prompt")
            with self.assertRaises(ValueError):
                capture.write_log(root, "author", meta, changed)
            self.assertEqual(output.read_text(), now)

    def test_project_scope(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            root = base / "project"
            root.mkdir()
            sessions = base / "sessions"
            sessions.mkdir()
            records = [
                {"type": "session_meta", "payload": {"cwd": str(base / "other")}},
                {"type": "response_item", "payload": {"role": "user", "text": "Other project"}},
            ]
            (sessions / "rollout-other.jsonl").write_text("".join(json.dumps(row) + "\n" for row in records))
            self.assertEqual(capture.scan(root, sessions, "author", {}), 0)
            self.assertFalse((root / ".agent-logs").exists())
            records[0]["payload"]["cwd"] = "D:\\OtherProject"
            (sessions / "rollout-other.jsonl").write_text("".join(json.dumps(row) + "\n" for row in records))
            self.assertEqual(capture.scan(root, sessions, "author", {}), 0)
            self.assertFalse((root / ".agent-logs").exists())


if __name__ == "__main__":
    unittest.main()
