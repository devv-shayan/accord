#!/usr/bin/env python3
"""Install the project lifecycle hooks and start the automatic capture process."""
import json
import os
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
config = json.loads((root / "agent-capture.json").read_text())
runtime = root / ".agent-capture"
runtime.mkdir(exist_ok=True)
folder = root / ".codex"
folder.mkdir(exist_ok=True)
path = folder / "hooks.json"
definition = json.loads(path.read_text()) if path.exists() else {"hooks": {}}
command = '/usr/bin/python3 "$(git rev-parse --show-toplevel)/scripts/capture_hook.py"'
for name in ["SessionStart", "UserPromptSubmit", "Stop", "SessionEnd"]:
    groups = definition["hooks"].setdefault(name, [])
    if not any(hook.get("command") == command for group in groups for hook in group.get("hooks", [])):
        groups.append({"hooks": [{"type": "command", "command": command, "timeout": 3 if name == "SessionEnd" else 30}]})
path.write_text(json.dumps(definition, indent=2) + "\n")
# Remove only the failed launch agent installed by the first attempt.
old_install = runtime / "installation.json"
if old_install.exists():
    old = json.loads(old_install.read_text())
    subprocess.run(["launchctl", "bootout", old["target"]], capture_output=True)
    Path(old["plist"]).unlink(missing_ok=True)
    old_install.rename(runtime / "failed-launchd-installation.json")
subprocess.run(["/usr/bin/python3", str(root / "scripts/capture_hook.py")],
               input=json.dumps({"hook_event_name": "Setup"}), text=True, check=True)
print("Project hook configuration installed: " + str(path))
