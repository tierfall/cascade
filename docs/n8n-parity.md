# n8n parity matrix

Living document. Updated in every PR that lands a feature touching this matrix
(see PR template). v0.1 release requires every row to have a non-empty Cascade status.

Legend:

- ✅ covered in current release
- 🟡 planned for vN.x (annotated)
- 🔵 differs intentionally (rationale linked)
- ⚫ explicitly out of scope (rationale linked)

## Core concepts

| n8n feature                     | Cascade status (v0.1)                 | Notes                                                                                                                         |
| ------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Workflows (JSON definition)     | ✅                                    | `cascade-core/src/workflow-schema.ts` is the public contract (spec §9).                                                       |
| Visual editor (drag-drop)       | 🟡 v0.2                               | v0.1 ships a read-only canvas.                                                                                                |
| Nodes (extensible)              | 🟡 v0.7 (plugin SDK)                  | v0.1 has four built-in types: llm, conditional, transform, http.                                                              |
| Credentials (encrypted at rest) | 🟡 v0.1 backlog (`B-API-CREDENTIALS`) | Schema lands in v0.1; UI for managing them is v0.2.                                                                           |
| Per-node provider config        | 🔵 differs                            | Cascade uses TierFall declarative policy instead. See [ADR 0006](adrs/0006-cascade-tokens-as-ssot.md) for the broader stance. |
| Manual trigger                  | ✅                                    | `triggers: [{ kind: 'manual' }]`.                                                                                             |
| Webhook trigger                 | ✅                                    | `triggers: [{ kind: 'webhook', path }]`.                                                                                      |
| Cron trigger                    | 🟡 v0.4                               | Backlog issue `B-TRIG-CRON`.                                                                                                  |
| File watcher trigger            | 🟡 v0.4                               | Backlog issue `B-TRIG-FILE`.                                                                                                  |

## Execution

| n8n feature             | Cascade status (v0.1) | Notes                                                                      |
| ----------------------- | --------------------- | -------------------------------------------------------------------------- |
| Run history             | ✅                    | `Run` + `NodeExecution` tables.                                            |
| Deterministic replay    | ✅                    | Full input + per-node output persisted per run. Spec §12 / constraint #12. |
| Live execution feedback | ✅                    | Socket.IO from API; node-color updates on canvas. Constraint #11.          |
| Execution safety limits | ✅                    | Max nodes / duration / cost / retries env-configurable. Spec §5.7.         |
| Pause/resume            | ⚫                    | Not in roadmap; explicit YAGNI.                                            |
| Subworkflows            | 🟡 v0.4               | Schema-version=`1.1.0` will introduce.                                     |

## Operations

| n8n feature                    | Cascade status (v0.1) | Notes                                                                       |
| ------------------------------ | --------------------- | --------------------------------------------------------------------------- |
| Self-hosted Docker             | ✅                    | Single `docker compose up`. Spec §5.1.                                      |
| Bundled local LLM              | ✅                    | `--profile demo` (Ollama).                                                  |
| Pluggable storage (S3)         | ✅                    | `STORAGE_DRIVER=s3` env var. Spec §5.3.                                     |
| Multi-tenant + RBAC            | 🟡 v0.5               | v0.1 is single-admin. Spec §5.5.                                            |
| Plugin SDK (third-party nodes) | 🟡 v0.7               | Workflow schema is forward-compatible.                                      |
| Marketplace                    | 🟡 v1.0               | Roadmap item.                                                               |
| Cloud edition                  | ⚫ until v1.0         | Architectural neutrality preserved; license (SUL) protects the opportunity. |

## Compatibility

| n8n feature                    | Cascade status (v0.1)    | Notes                               |
| ------------------------------ | ------------------------ | ----------------------------------- |
| Import n8n workflows           | 🟡 community (post-v1.0) | Schema mapper would be third-party. |
| Export workflows as TypeScript | ✅ unique to Cascade     | `@tierfall/cascade-compiler`.       |
