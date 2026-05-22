# cascade-web-e2e — Claude context

**Purpose:** Playwright suite. Runs against the **full docker compose stack**
(spec §8.3) — not against a dev server, not against mocked services.

## Local runs

```bash
docker compose up -d --wait
PLAYWRIGHT_BASE_URL=http://localhost:3001 pnpm --filter @tierfall/cascade-web-e2e e2e
docker compose down -v
```

## What it covers in v0.1

- Home page renders with the design system applied (dark mode default).
- Tier ramp displays (5 badges).
- Cascade-branded CTA renders.

Subsequent v0.1 backlog issues add: workflow graph displays from API, live execution
feedback via WebSocket updates node colors, CLI-triggered run appears in UI history,
webhook trigger creates a visible run, error states display correctly, keyboard
navigation works.

## Hard rules

- baseURL must be the compose-host URL (default port 3001), not a Next dev server.
- `forbidOnly` enabled in CI — `.only` in committed tests fails the build.
- Retries=1 in CI for genuine flake recovery, NOT to mask broken tests. Flake policy
  in spec §8.4: a test that needs >1 retry is broken; quarantine with a tracked issue.
