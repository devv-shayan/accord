import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location("capture", Path(__file__).parents[1] / "scripts/agent_capture.py")
capture = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(capture)


class CaptureTests(unittest.TestCase):
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
