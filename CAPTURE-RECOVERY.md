# Agent capture recovery record

Recovery date: 9 October 2026, UTC.

The candidate authorized restoration of all missing assignment records on this date.
The recovery used the original Codex session files. Full user prompts and available
final responses were restored. Their text, UTC timestamps, and model names were
kept. No entry was shortened, cleaned, redacted, or selected by subject.
Thinking, tool calls, and intermediate output are excluded by the capture format.
A prompt without a final response in its source remains without an invented response.

## Records restored

- `.agent-logs/2026-09-29_10-57-07_01a0eccf-a8e6-7190-93a8-5e4450dc3ec7.md`
- `.agent-logs/2026-10-08_16-02-53_01a11c40-cb81-70b3-b85a-b47023309631.md`
- `.agent-logs/2026-10-08_16-25-00_01a11c55-0b56-7d02-b545-6dde5186e624.md`

The older assignment chat began on 29 September 2026. It includes application
context, research, planning, and later assignment preparation. The former scan
filter rejected it because its original session start was before capture setup.
Some earlier recovery copies also selected turns and omitted private preparation.
Those partial copies are no longer the publication record.

The preparation chat includes video work, live application checks, test reports,
and capture-scope changes. Its project log had been deleted and excluded at the
candidate's request. Its native Codex source remained available. The full source
record, including the earlier exclusion requests, is now restored.

The greeting-only chat contains one user prompt and no final response. It is also
included. The six prior build and canary logs remain in the record.

## Timing and original history

The two successful capture tests are documented in CAPTURE-TEST.md. They ran on
6 October before the main application build. Earlier product research and planning
occurred before capture setup. The original dates remain visible in the record.

The recovered logs were not all captured and committed at the time of each original
turn. This recovery does not recreate the missing original commit sequence. Git
commit dates are not changed. Historical hook audit entries that had been removed
were not fabricated; the native prompt and final-response records are the source.

## Automatic capture after recovery

The current chat exclusion and local Git log exclusions were removed. The recovery
watcher was restarted. Its status reports a recent scan with no error. The older
assignment session is explicitly included through local capture settings. That
exception does not include other projects or unnamed older sessions. Hooks use
the same rule. The six capture tests pass, including preservation of prior entries,
project boundaries, recovery of an older named session, and hook capture of it.

All nine current log files were compared with their native source records. The
restored record includes personal application information and the full video and
submission discussions. Environment files and private runtime data remain ignored.
No commit or GitHub upload was made as part of this recovery.
