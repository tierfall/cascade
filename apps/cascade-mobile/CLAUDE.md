# cascade-mobile — Claude context

**Purpose:** v0.1 React-Native-boundary smoke test (spec §7.2). NOT a shipping app.

## What it proves

- `@tierfall/cascade-tokens` resolves and type-checks under the React Native bundler.
- `@tierfall/cascade-sdk` constructor runs on RN with NO DOM polyfill.
- The token-direct styling approach (spec §7.1) produces a visually-correct
  Cascade-branded screen using the same tokens cascade-web does.

## What it does NOT have

- Any features. One screen, no navigation, no API calls.
- A `cascade-ui-native` companion package. That's post-v1.0.
- Unit tests. The smoke test IS the build itself — if the bundle compiles, the
  boundary holds.

## Hard rules

- Stays excluded from `nx run-many` default sets. CI builds it via a dedicated
  job that catches RN-boundary breakage when cascade-tokens/core/sdk are touched.
- ANY new dependency must work under the RN bundler. If a token type changes and
  it doesn't flow through here, you've broken the platform-neutral contract.
- When `apps/cascade-mobile` becomes a real shipping app (post-v1.0), this file
  is replaced wholesale by that effort's design doc.
