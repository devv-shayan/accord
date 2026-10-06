# Capture test record

Status: PASS.

## Tool and model

The setup session uses the Codex desktop app, runtime version `0.160.1`.
The test sessions use Codex CLI version `0.160.0`.
The exact model is `gpt-6.1-sol` for planning and execution.
The setup uses high reasoning effort. The test sessions use low reasoning effort.
The author is `devv-shayan`. The canary name is Shayan Khan.

## Automatic mechanism

Codex writes its native session files automatically.
Project hooks in `.codex/hooks.json` run at `SessionStart`, `UserPromptSubmit`,
`Stop`, and `SessionEnd`. They call `scripts/capture_hook.py`.
That script exports the session and starts the recovery watcher if necessary.
The watcher uses `scripts/agent_capture.py` to capture changes automatically.
The capture settings are in `agent-capture.json`.
Codex saved folder trust and hook trust in `~/.codex/config.toml` through its
normal hook review screen. No hook trust override was used.

The first test used an interactive Codex CLI session.
The second test used a new Codex CLI session.
Before the second test, the recovery watcher was stopped.
The second session restarted it automatically through `SessionStart`.
The previous watcher PID was `67071`. The new watcher PID was `67706`.
Both sessions ran `UserPromptSubmit` and `Stop` automatically.
Both complete prompt and response pairs matched their native session records.
No export command was run to capture either verified test session.

## Attempts and corrections

The first response only said that the attached file would be read.
The exact tool, model, and capture mechanism were identified after that read.

The first background-service attempt used macOS LaunchAgents.
macOS blocked Python from reading the project folder on the Desktop.
That service was removed. The Codex hooks replaced it.

The first exporter treated Windows paths as relative paths on macOS.
It also included older sessions. The filter now requires an absolute project path,
a session at or after the assignment start time, and a main agent session.
The 77 files from that export remain unchanged in the local folder
`.agent-capture/out-of-scope-exports/`. They are outside the assignment logs.
They were not deleted or included in a Git commit.

A preliminary test used session `01a11143-ff2a-7c62-b7aa-0bfa5d09dae5`.
Its response was initially missed because the installed Codex version records
final messages with the phase `final_answer`.
The exporter now accepts `final` and `final_answer`.
The automatic watcher added that response to its log.
The preliminary test log remains in `.agent-logs/`.

The exporter tests passed. They check complete text, model changes, UTC timestamps,
excluded content, repeated exports, preserved entries, and project scope.

## Verified canary entries

The entries below are copied from the log files without changes.

### Session 1

Session ID: `01a11147-1343-77f2-bada-bf7601595200`.

Log file: `.agent-logs/2026-10-06_12-53-54_01a11147-1343-77f2-bada-bf7601595200.md`.

````text
[LOG_ENTRY type=PROMPT num=1 session=01a11147]
timestamp: 2026-10-06T12:55:16.297Z
model: gpt-6.1-sol

CAPTURE TEST — 8x assignment, Shayan Khan


[LOG_ENTRY type=RESPONSE num=1 session=01a11147]
timestamp: 2026-10-06T12:55:28.461Z
model: gpt-6.1-sol

Capture test response — 8x assignment, Shayan Khan.

The capture status shows a scan from 4 seconds ago and no error. `CAPTURE-TEST.md` is missing. Assignment work must wait until this file records two successful sessions.


````

### Session 2

Session ID: `01a11149-6d9f-78e1-a55d-e75dde92c34c`.

Log file: `.agent-logs/2026-10-06_12-56-28_01a11149-6d9f-78e1-a55d-e75dde92c34c.md`.

````text
[LOG_ENTRY type=PROMPT num=1 session=01a11149]
timestamp: 2026-10-06T12:56:31.512Z
model: gpt-6.1-sol

CAPTURE TEST — 8x assignment, Shayan Khan


[LOG_ENTRY type=RESPONSE num=1 session=01a11149]
timestamp: 2026-10-06T12:56:35.411Z
model: gpt-6.1-sol

Capture test received.


````

