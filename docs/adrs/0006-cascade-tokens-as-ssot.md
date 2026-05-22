# ADR 0006: cascade-tokens as the SSOT for visual language across platforms

**Status:** Accepted (2026-05-22)
**Spec reference:** §7

## Context

The mobile app (cascade-mobile in v0.1, full ship post-v1.0) must visually match the web app.
The styling mechanism on each platform should consume a shared source of truth so visual
fidelity is guaranteed at the token layer, not the class-name layer.

## Decision

`packages/cascade-tokens/` is the single source of truth. Web consumes via a Tailwind preset
(`@tierfall/cascade-ui/tailwind-preset`). Mobile consumes via `StyleSheet.create({ color: tokens.colors.tier[0] })`
directly. NO NativeWind.

## Consequences

- Token changes flow to both platforms by construction.
- Web keeps Tailwind ergonomics. Mobile keeps RN's native StyleSheet idiom.
- A future `cascade-ui-native` package (post-v1.0) hand-rolls RN components mirroring
  cascade-ui's prop API; tokens guarantee visual match.

## Alternatives considered

- **NativeWind** — Tailwind-flavored, NOT Tailwind-identical. Compatibility holes
  (`gap`, arbitrary utilities, web-only pseudo-states) create ongoing audit burden.
- **Tamagui everywhere** — single cross-platform styled-system, but requires replacing
  Tailwind on the web side (revisits constraint #4). Too heavy.
