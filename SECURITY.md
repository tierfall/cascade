# Security Policy

## Reporting a Vulnerability

Please email security@cascade.dev with details. Do **not** open a public issue for security
reports. We aim to acknowledge within 48 hours and to publish a fix or mitigation within
14 days of confirmation. Reporters who follow this process are credited in the release
notes (unless they request anonymity).

## Scope

In scope:
- The Cascade application and its packages published to npm under `@tierfall/cascade-*`.
- The Docker images published to `ghcr.io/tierfall/cascade-*`.
- The default docker-compose stack and its security defaults (constraint #23 of the spec).

Out of scope:
- Third-party dependencies — please report those upstream and notify us if it affects Cascade.
- Self-hosted misconfigurations that contradict the documented defaults.

## Supported versions

Only the latest minor release on `main` is supported with security fixes during the v0.x
series. From v1.0, the previous minor will also receive security fixes for 90 days.
