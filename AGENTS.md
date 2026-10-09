Your response should be in ASD-STE100.

Automatic capture is required for this assignment.
Codex project hooks and a recovery watcher export prompts and final responses
from the native Codex session files. The hook configuration is .codex/hooks.json.
The exporter source is scripts/agent_capture.py.
Do not use ephemeral sessions. Do not edit or delete entries in .agent-logs/.
Do not add .agent-logs/ to .gitignore.
Before assignment work, check .agent-capture/status.json for a recent scan and no error.
Commit capture logs with the related work. Include the final response from the
previous turn in the next commit after automatic capture records it.
Do not start assignment work until CAPTURE-TEST.md records two successful sessions.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
