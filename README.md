# Cascade

> Self-hosted visual AI workflow editor built on TierFall. Tier routing is on the canvas,
> not in a settings panel.

## Why

n8n alternatives are everywhere. Cascade is the one that:

- **Self-hosts by default.** One `docker compose up` brings up the full stack.
- **Compiles workflows to TypeScript.** The editor is scaffolding; the artifact you own
  is a `.ts` file that imports `@tierfall/core` and runs without Cascade.
- **Routes locally first, falls to cloud only when needed.** TierFall's `fall, never climb`
  policy makes vendor neutrality concrete.

## Quick start

```bash
git clone https://github.com/tierfall/cascade.git
cd cascade
cp .env.example .env
docker compose up -d
```

Open <http://localhost:3001> → hit `/setup` → finish the wizard.

To run the bundled demo (local Ollama + cloud fallback via TierFall):

```bash
docker compose --profile demo up -d
```

## Docs

- [Getting Started](http://localhost:3002/docs/getting-started) (or browse `apps/cascade-docs/content/docs/`)
- [Architecture spec](docs/superpowers/specs/2026-05-22-cascade-kickoff-design.md)
- [n8n parity matrix](docs/n8n-parity.md)
- [Testing strategy](docs/testing.md)
- [ADRs](docs/adrs/)

## License

Cascade ships under the [n8n Sustainable Use License](LICENSE) — free self-hosting
(individual, commercial, internal), restrictions on hosting Cascade as a service for
third parties.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Cascade follows the same conventions as TierFall:
pnpm, Nx, Node 24, Conventional Commits, DCO sign-off, no `--no-verify`.
