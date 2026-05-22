# cascade-cli — Claude context

**Purpose:** Headless `cascade run` binary. v0.1 has one command; cron / file-watcher /
upload-workflow / list-runs land in later versions.

## What lives here

- `src/bin.ts` — entry. argv → parseArgs → runCommand. Handles `--help`.
- `src/parse-args.ts` — argv parser. Strict: unknown flag = error.
- `src/run.ts` — invokes cascade-sdk to trigger a run, prints the result.

## Hard rules

- 95% coverage threshold.
- `--wait` is a v0.1 backlog issue (B-CLI-WAIT) — it logs a notice today.
- `console.log` is allowed here ONLY (eslint config carves an exception for this package).
- No interactive prompts. JSON via `--input` or stdin (stdin is a backlog issue).
