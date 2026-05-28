# Tier-ramp demo workflow

This is the v0.1 demo workflow that ships in `apps/cascade-api/src/assets/demo-workflow.json`. It
exercises **two TierFall adapters** to make vendor-neutrality concrete (spec §10.3):

- **Primary (tier 0):** `@tierfall/adapter-ollama` — free, local.
- **Fallback (tier 2 or 3):** `@tierfall/adapter-openai-compatible` or `@tierfall/adapter-anthropic` — cloud.

## What it does

1. **`summarize`** — an LLM node that summarizes the input `text` in one sentence. TierFall picks the
   primary adapter when local Ollama is healthy and the maxCostUsd budget allows; otherwise it falls
   back to the cloud adapter chain.
2. **`wrap`** — a `transform` node that reshapes the output to `{ summary, vendor }` so the canvas
   can color-code which tier handled the call.

## Running it

The demo is reachable via:

```bash
docker compose --profile demo up
```

The fallback adapters require user-provided API keys set in `.env`. The setup wizard surfaces this
on first boot (`apps/cascade-web/...`).

## Seeding

The workflow JSON ships with `cascade-api` as an asset. The setup-wizard flow seeds it into the
`Workflow` table on first boot when no workflows exist yet — see the seeding code that lands with
the broader run-executor work (#7, B-API-RUN-EXECUTE).

Until the seeding flow is wired, you can import the demo manually via:

```bash
curl -X POST http://localhost:3000/workflows \
  -H 'Content-Type: application/json' \
  -H 'Cookie: cascade_session=…' \
  -d @apps/cascade-api/src/assets/demo-workflow.json
```

## Tier attribution

After a run completes, the canvas displays which TierFall tier handled each LLM call. The `wrap`
node above lifts the adapter name into the output payload so the demo's success is observable
without opening the run-history panel.
