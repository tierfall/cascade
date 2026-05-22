# ADR 0002: Compose profiles, not overlay files

**Status:** Accepted (2026-05-22)
**Spec reference:** §5.1

## Context

Hard constraint #3 of the kickoff requires `docker compose up` at the repo root to bring up the
full stack. The bundled-demo (Ollama) and bundled-S3 (MinIO) are tradeoffs: useful for some
self-hosters, multi-GB or extra-port overhead for others.

## Decision

Single `docker-compose.yml`. Optional services tagged with `profiles: [demo]` or `profiles: [minio]`.
Activate via `docker compose --profile demo up` / `--profile minio`. **No** overlay files
(`-f compose.demo.yml`).

## Consequences

- One file, one mental model. `docker compose ps` shows base by default.
- Activation syntax is `--profile`, not `-f`.
- Self-hosters with their own Ollama / MinIO opt out by ignoring the profiles.

## Alternatives considered

- Minimal-only (no profiles) — rejected; the bundled-demo path is too valuable.
- Full-always (Ollama always bundled) — rejected; image bloat and runtime collision risk.
- Overlay files — rejected; profiles are idiomatic in Compose v2.
