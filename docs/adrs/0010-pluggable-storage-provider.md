# ADR 0010: Pluggable StorageProvider with local FS default

**Status:** Accepted (2026-05-22)
**Spec reference:** §5.3

## Context

File uploads and workflow artifacts need to land somewhere. Self-hosters on a home server
want local FS. Production self-hosters on k8s want S3-compatible (AWS S3, MinIO, R2, B2).

## Decision

`StorageProvider` interface in `cascade-api`. Two implementations: `LocalFsStorage`
(default, mounts to `/data/storage` volume) and `S3Storage` (activated by
`STORAGE_DRIVER=s3`). MinIO available as an opt-in compose profile (`--profile minio`).

## Consequences

- Single line of env config switches the storage backend.
- No assumption about storage shape leaks into the business logic.

## Alternatives considered

- **Local FS only** — too restrictive for production self-hosters.
- **Bundle MinIO by default** — adds ~200MB image + extra port; only valuable for users
  who want S3 semantics.
