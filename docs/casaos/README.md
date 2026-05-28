# Cascade on CasaOS

This directory contains the [CasaOS app store spec](cascade.yaml) for one-click
installation of Cascade on CasaOS. **Target: Cascade v0.6**, landed here as a
specification in v0.1 so the architecture stays compatible (no breaking
`docker-compose.yml` changes after v0.1).

## Why a spec in v0.1?

The CasaOS app store entry is a YAML wrapper around the same images that ship
in `docker-compose.yml`. If we change the API image's environment contract
(env vars, ports, volume layout) after v0.1, this spec breaks and every CasaOS
installation breaks with it.

Landing the YAML in `v0.1` doesn't ship the app to CasaOS — it locks in the
shape of the environment so we don't paint ourselves into a corner.

## What v0.6 will add

- Submission to the [CasaOS app store](https://awesome.casaos.io/) via PR to
  [IceWhaleTech/CasaOS-AppStore](https://github.com/IceWhaleTech/CasaOS-AppStore).
- Multi-arch image publishing (amd64 + arm64) — currently only amd64 is built
  by `release.yml`.
- A `STORAGE_DRIVER=local` smoke test in the CasaOS sandbox to confirm volume
  mounts behave the same on the CasaOS runtime as in plain docker compose.

## Compatibility contract

The CasaOS spec depends on these v0.1 architectural facts. If any of them
change, this spec must be updated in the same PR:

- API container exposes port 3000 (HTTP + WS multiplexed).
- Web container exposes port 3000 (Next.js default), mapped to host 3001.
- API container reads `DATABASE_URL` and `REDIS_URL` from env.
- API container persists user storage under `/data/storage` (configurable via
  `STORAGE_LOCAL_DIR`).
- `POSTGRES_*` env vars are accepted by the API container for the initial
  Prisma connection string.
- `/health` is reachable at the container port without authentication.

## Why not ship in v0.1?

- We do not have multi-arch images yet (only amd64). Many CasaOS users run on
  Raspberry Pi (arm64) or other ARM SBCs.
- The single-admin first-boot setup wizard needs a thoughtful "what is this
  for?" UX before non-technical users hit it.
- We haven't validated upgrade behavior across image versions in a CasaOS
  install — needed before we expose this to a non-developer audience.
