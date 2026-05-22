# cascade-docs — Claude context

**Purpose:** Fumadocs site bundled into the Docker compose stack at port 3001.
Air-gapped self-hosters can read docs without internet. Vercel public deploy is a
post-v0.1 follow-up (no Vercel-specific code lives here).

## What lives here

- `content/docs/*.mdx` — the actual content. Add new pages here; nav comes from
  the Fumadocs auto-tree.
- `app/docs/[[...slug]]/page.tsx` — the Fumadocs page renderer.
- `source.config.ts` — Fumadocs source config.

## No coverage threshold

Per spec §4.5 — this package is content, not logic. Adding logic here (custom
React components, JS-driven nav) is a yellow flag; consider whether the logic
belongs in cascade-ui instead.

## Hard rules

- No client-side JS heavier than Fumadocs-builtin needs. Keep the bundle small
  so self-hosters with limited resources can still serve docs.
- Every spec reference in docs uses the relative path
  `/docs/superpowers/specs/2026-05-22-cascade-kickoff-design.md` (not a GH URL)
  so air-gapped readers can follow it.
