# Automatic agent capture

Codex project hooks start the capture process automatically.
The process reads the native session files and writes prompts and final responses
to `.agent-logs/`. It checks for changes once each second.

The capture process uses the model name and UTC timestamp from each session record.
It excludes tool calls, reasoning, intermediate responses, and subagent sessions.
It includes the complete text of pasted text attachments.
It preserves existing log entries. It updates the session metadata when a prompt is added.

The capture start time is in `agent-capture.json`.
Sessions before this time are outside this assignment.
The author is `devv-shayan`, from the signed-in GitHub account.

## Installation

The hooks are installed and trusted on this computer.
To install the capture process on another computer:

1. Install Codex and sign in.
2. Set the author and capture start time in `agent-capture.json`.
3. Run `python3 scripts/install_agent_capture.py` from the repository.
4. Open Codex in this repository. Trust the folder.
5. Use `/hooks` to review and trust the four capture hooks.
6. Run two capture tests in separate sessions.

The project hook configuration is `.codex/hooks.json`.
Codex saves the local trust decisions in `~/.codex/config.toml`.
The installer preserves other project hooks.

## Operation

Use normal Codex sessions. Do not use `--ephemeral`.
No capture command is necessary for each prompt or response.
The `SessionStart`, `UserPromptSubmit`, `Stop`, and `SessionEnd` hooks run automatically.
The hooks restart the recovery watcher if it stops.

Check `.agent-capture/status.json` for a recent scan and `"error": null`.
Local process records are in `.agent-capture/`. Git excludes this folder.
Git includes `.agent-logs/`.

Commit the logs with the related changes.
The final response to a turn is available after that turn ends.
Include that response in the next commit.

## Verification

Run `python3 -m unittest discover -s tests -v` to check the exporter.
See `CAPTURE-TEST.md` for the two tests with real Codex sessions.

Official reference: [Codex hooks](https://learn.chatgpt.com/docs/hooks).
