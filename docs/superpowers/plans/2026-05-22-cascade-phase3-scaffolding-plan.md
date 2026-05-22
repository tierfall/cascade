---
date: 2026-05-22
status: draft (awaiting approval)
authors: [ronyv89]
spec: ../specs/2026-05-22-cascade-kickoff-design.md
target-phase: 3 (scaffolding)
target-commits: 19
---

# Cascade Phase 3 Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the `cascade/` repository to the Phase 3 exit criteria from the kickoff spec: a green-CI Nx monorepo with three apps, seven packages, three test layers wired (unit + Testcontainers + Playwright), Docker-compose-up-able stack, GitHub Projects backlog populated, and TierFall consumed via npm.

**Architecture:** pnpm + Nx monorepo mirroring the TierFall sibling repo's conventions. Three platform-neutral packages (`cascade-tokens`, `cascade-core`, `cascade-sdk`) enforce a React-Native-ready boundary via ESLint + a CI build job. Apps consume packages via Nx project references. Docker compose uses Compose profiles (single file) for the `--profile demo` (Ollama) and `--profile minio` (S3-compatible) opt-ins. Coverage gates wired via Codecov per per-package thresholds from spec §4.5.

**Tech Stack:**
- pnpm 10.x, Node 24, Nx (latest stable), TypeScript 6.x
- jest 29.7.0 + ts-jest 29.4.10 (Jest 30 explicitly forbidden by spec)
- ESLint 9 flat config + `typescript-eslint` strict-type-checked + Prettier
- Husky + lint-staged + commitlint + DCO sign-off
- NestJS (cascade-api) + Prisma + BullMQ + Socket.IO
- Next.js 15 (cascade-web) + Radix UI + Tailwind + Zustand + ReactFlow 12
- Fumadocs (cascade-docs)
- Expo (cascade-mobile, RN-boundary smoke test)
- Playwright (cascade-web-e2e) + Supertest/Testcontainers (cascade-api-e2e)
- fast-check (property-based tests in `cascade-core`)
- Codecov (patch coverage gate)

---

## File Structure (top-level)

```
cascade/
├── apps/
│   ├── cascade-api/                 # NestJS + Prisma
│   ├── cascade-api-e2e/             # Testcontainers integration suite
│   ├── cascade-web/                 # Next.js 15
│   ├── cascade-web-e2e/             # Playwright suite
│   ├── cascade-docs/                # Fumadocs
│   └── cascade-mobile/              # Expo skeleton (excluded from default build)
├── packages/
│   ├── cascade-tokens/              # platform-neutral
│   ├── cascade-core/                # platform-neutral
│   ├── cascade-sdk/                 # platform-neutral
│   ├── cascade-ui/                  # web-only (Tailwind + Radix)
│   ├── cascade-nodes/               # server-side node registry
│   ├── cascade-compiler/            # graph → .ts scaffold
│   └── cascade-cli/                 # `cascade run` binary
├── docs/
│   ├── adrs/                        # 12 ADR stubs (one per spec decision)
│   ├── testing.md                   # 3-layer testing strategy
│   ├── n8n-parity.md                # parity matrix
│   └── superpowers/
│       ├── specs/2026-05-22-cascade-kickoff-design.md  # already exists
│       └── plans/2026-05-22-cascade-phase3-scaffolding-plan.md  # this file
├── .github/
│   ├── workflows/{ci,e2e,release,coverage}.yml
│   ├── pull_request_template.md
│   └── CODEOWNERS
├── .husky/{pre-commit,commit-msg,prepare-commit-msg}
├── docker-compose.yml               # base + profile-tagged Ollama and MinIO
├── package.json, pnpm-workspace.yaml, nx.json, tsconfig.base.json
├── eslint.config.mjs, .lintstagedrc.mjs, commitlint.config.mjs
├── codecov.yml, knip.json, .gitignore, .gitattributes, .editorconfig
├── .nvmrc, .npmrc
├── LICENSE                          # n8n Sustainable Use License
├── CODE_OF_CONDUCT.md (Contributor Covenant 2.1)
├── CONTRIBUTING.md, SECURITY.md, README.md
└── CLAUDE.md, AGENTS.md             # root project context
```

---

## ADR Roster (one per major decision in the spec)

Each ADR lives at `docs/adrs/NNNN-slug.md`. ADRs are created in **Task 19**. The roster:

| # | Slug | Topic | Spec ref |
|---|---|---|---|
| 0001 | `mirror-tierfall-toolchain` | pnpm 10.x, Node 24, DCO, Nx | §2 |
| 0002 | `compose-profiles-not-overlays` | Modular via Compose profiles | §5.1 |
| 0003 | `prisma-as-orm` | Prisma over TypeORM/Drizzle | §4.2 |
| 0004 | `zustand-for-canvas-state` | Zustand for ReactFlow | §6.1 |
| 0005 | `n8n-sustainable-use-license` | Fair-code over Apache/MIT | §10.1 |
| 0006 | `cascade-tokens-as-ssot` | Tokens as SSOT, web + mobile both consume | §7 |
| 0007 | `codecov-for-coverage` | Codecov over jest-coverage-report-action | §4.3 |
| 0008 | `fast-check-from-v01-stryker-deferred` | Property tests now, mutation tests later | §4.4 |
| 0009 | `docs-bundled-in-compose` | Docs in Docker, Vercel later | §5.2 |
| 0010 | `pluggable-storage-provider` | Local FS default, S3 env-switched | §5.3 |
| 0011 | `synchronized-versioning-via-nx` | Fixed mode in Nx/Changesets | §10.2 |
| 0012 | `single-admin-auth-in-v01` | First-to-/setup becomes admin | §5.5 |

ADR template (used for all twelve in Task 19):

```markdown
# ADR NNNN: <title>

**Status:** Accepted (2026-05-22)
**Spec reference:** `docs/superpowers/specs/2026-05-22-cascade-kickoff-design.md` §<section>

## Context
<one paragraph framing the decision>

## Decision
<the chosen option, plainly stated>

## Consequences
<positive and negative consequences, including any deferred work>

## Alternatives considered
<options rejected, with one-line reasoning each>
```

---

## Conventions enforced by this plan

1. **Every task ends with a Conventional-Commit-formatted commit, DCO-signed.** Commit body for each task is provided literally — copy-paste it. DCO sign-off via `git commit -s` (the `prepare-commit-msg` hook installed in Task 3 also appends `Signed-off-by:` automatically). **Do not add any AI/assistant co-author trailers** (no `Co-Authored-By: Claude …`, etc.) — commits are attributed solely to the human author.
2. **Every test step shows the test code AND the expected failure mode.** TDD ordering: failing test → minimal impl → passing test → commit.
3. **No `--no-verify`.** If pre-commit fails, fix the issue, re-stage, retry. Never bypass.
4. **No `nx g` magic without inspection.** When a step says `pnpm exec nx g @nx/X:app FOO`, the executor must `git status` afterward to see what was generated, and remove any unwanted boilerplate (Vite when we want Webpack, jest config when we already have ours, etc.) BEFORE committing.
5. **Patch coverage = 100%.** If a step adds code, that step also adds a test for it. Untestable lines need `/* istanbul ignore next */` justified in the commit body.

---

## Tasks at a glance (19 total)

| # | Conventional commit | What it produces |
|---|---|---|
| 1 | `chore: initialize repo with license, code of conduct, and base configuration` | git init, LICENSE (SUL), CoC, .gitignore, .editorconfig, .nvmrc, .npmrc, SECURITY.md |
| 2 | `chore: add pnpm workspace, Nx, TypeScript, ESLint, Prettier, commitlint` | Workspace files + root configs |
| 3 | `chore: add Husky pre-commit hooks and DCO sign-off` | Husky hooks, lint-staged |
| 4 | `feat(tokens): scaffold cascade-tokens package` | Pure-TS tokens + 100% threshold |
| 5 | `feat(core): scaffold cascade-core with Zod schemas and fast-check` | Workflow schemas, graph utils, property tests |
| 6 | `feat(sdk): scaffold cascade-sdk fetch-based client` | Typed API client |
| 7 | `chore(eslint): enforce platform-neutral boundary on tokens, core, sdk` | no-restricted-imports rule + RN-target CI build |
| 8 | `feat(ui): scaffold cascade-ui with Tailwind preset and Radix primitives` | Button + TierBadge + preset |
| 9 | `feat(nodes): scaffold cascade-nodes registry` | LLM/Conditional/Transform/HTTP stubs |
| 10 | `feat(compiler): scaffold cascade-compiler skeleton` | Graph → .ts emitter (no-op for v0.1) |
| 11 | `feat(cli): scaffold cascade-cli with cascade run command` | Bin entry, oclif-light setup |
| 12 | `feat(api): scaffold cascade-api NestJS app with Prisma` | NestJS + Prisma + health endpoint |
| 13 | `feat(web): scaffold cascade-web Next.js app consuming cascade-ui` | Next 15 app + theme |
| 14 | `feat(docs): scaffold cascade-docs Fumadocs site` | Docs site with one page |
| 15 | `feat(mobile): scaffold cascade-mobile Expo skeleton with tokens smoke test` | One screen, RN-boundary smoke test |
| 16 | `test(e2e): scaffold cascade-api-e2e (Testcontainers) and cascade-web-e2e (Playwright)` | One integration test, one Playwright test |
| 17 | `chore(docker): add docker-compose.yml with profiles and per-app Dockerfiles` | Compose + multi-stage Dockerfiles |
| 18 | `chore(ci): add GitHub Actions workflows for lint, test, e2e, build, coverage` | 4 workflow files + codecov.yml |
| 19 | `docs: add README, CONTRIBUTING, testing.md, n8n-parity.md, ADRs, PR template, root CLAUDE.md, AGENTS.md` | All docs + gitnexus initial index + push develop |

---

---

## Task 1: Initialize repo with license, CoC, and base configuration

**Files:**
- Create: `.gitignore`, `.gitattributes`, `.editorconfig`, `.nvmrc`, `.npmrc`, `LICENSE`, `CODE_OF_CONDUCT.md`, `SECURITY.md`
- The existing `docs/superpowers/specs/2026-05-22-cascade-kickoff-design.md` and `docs/superpowers/plans/2026-05-22-cascade-phase3-scaffolding-plan.md` are picked up in this first commit.

- [ ] **Step 1: `git init` in the cascade repo**

```bash
cd /home/ronyv/Develop/Projects/cascade
git init -b develop
git config user.email "ronyv250289@gmail.com"
git config user.name "ronyv89"
```

- [ ] **Step 2: Write `.gitignore`**

```gitignore
# Node / pnpm
node_modules/
.pnpm-store/
*.log
npm-debug.log*
pnpm-debug.log*

# Nx
.nx/cache
.nx/workspace-data

# Build outputs
dist/
build/
out/
.next/
.turbo/
.expo/
coverage/

# Env files (never commit secrets)
.env
.env.local
.env.*.local
!.env.example

# IDE / OS
.idea/
.vscode/*
!.vscode/settings.json.example
.DS_Store
Thumbs.db

# Testing
playwright-report/
test-results/
.testcontainers/

# Generated
*.tsbuildinfo
.gitnexus/cache/

# Prisma
apps/cascade-api/prisma/migrations/dev.db*
```

- [ ] **Step 3: Write `.gitattributes`**

```gitattributes
* text=auto eol=lf
*.png binary
*.jpg binary
*.ico binary
*.woff binary
*.woff2 binary
pnpm-lock.yaml linguist-generated=true
```

- [ ] **Step 4: Write `.editorconfig`**

```editorconfig
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 5: Write `.nvmrc`**

```
24
```

- [ ] **Step 6: Write `.npmrc`** (mirror TierFall)

```
save-exact=true
engine-strict=true
auto-install-peers=true
strict-peer-dependencies=false
```

- [ ] **Step 7: Write `LICENSE`** (n8n Sustainable Use License v1.0)

Fetch the canonical SUL text from https://docs.n8n.io/sustainable-use-license/ and paste verbatim. Replace `n8n` with `Cascade` only in the headline title and copyright line — the license body stays unchanged. Copyright line: `Copyright (c) 2026-present Cascade contributors.`

If the URL is unreachable in the executor environment, use this exact LICENSE text (the SUL v1.0 body):

```
Sustainable Use License v1.0

Copyright (c) 2026-present Cascade contributors.

Portions of this software are licensed as follows:

* All content that resides under the "apps/" or "packages/" directories of this
  repository, if those directories exist, is licensed under the terms defined
  below.
* All third-party components incorporated into this software are licensed under
  the original license provided by the owner of the applicable component.
* Content outside the above-mentioned directories or restrictions above is
  available under the "Common Clause License Condition v1.0" as described
  below.

The Sustainable Use License (the "License") permits use, copying, modification,
and distribution of the Software, subject to the following restrictions:

1. You may use, copy, modify, and distribute the Software only for your own
   internal business purposes or for non-commercial or personal use.

2. You may not alter, remove, or obscure any licensing, copyright, or other
   notices of the licensor in the Software. Any use of the licensor's trademarks
   is subject to applicable law.

3. You may not provide the Software to third parties as a hosted or managed
   service, where the service provides users with access to any substantial set
   of the features or functionality of the Software.

If you wish to make commercial use of the Software in violation of these
restrictions, please contact the Cascade maintainers to discuss licensing
options.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT.
```

- [ ] **Step 8: Write `CODE_OF_CONDUCT.md`** — Contributor Covenant 2.1, contact email `conduct@cascade.dev`. Use the canonical text from https://www.contributor-covenant.org/version/2/1/code_of_conduct/. Replace the contact placeholder.

- [ ] **Step 9: Write `SECURITY.md`**

```markdown
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
```

- [ ] **Step 10: Verify, stage, and commit**

```bash
cd /home/ronyv/Develop/Projects/cascade
git status                    # docs/, LICENSE, CoC, SECURITY, .gitignore etc. all untracked
git add .gitignore .gitattributes .editorconfig .nvmrc .npmrc \
        LICENSE CODE_OF_CONDUCT.md SECURITY.md \
        docs/superpowers/specs/2026-05-22-cascade-kickoff-design.md \
        docs/superpowers/plans/2026-05-22-cascade-phase3-scaffolding-plan.md
git commit -s -m "$(cat <<'EOF'
chore: initialize repo with license, code of conduct, and base configuration

- n8n Sustainable Use License v1.0 (spec §10.1, ADR 0005)
- Contributor Covenant 2.1 with security@cascade.dev contact
- Phase 1 kickoff spec and Phase 2 scaffolding plan committed alongsideEOF
)"
```

Expected: clean working tree after commit. Verify with `git log --oneline -1` showing one commit.

---

## Task 2: Add pnpm workspace, Nx, TypeScript, ESLint, Prettier, commitlint

**Files:**
- Create: `package.json` (root), `pnpm-workspace.yaml`, `nx.json`, `tsconfig.base.json`, `eslint.config.mjs`, `.prettierrc.mjs`, `.prettierignore`, `commitlint.config.mjs`, `knip.json`

- [ ] **Step 1: Write root `package.json`** (mirrors TierFall layout; scripts use `nx run-many`)

```json
{
  "name": "cascade",
  "version": "0.0.0",
  "private": true,
  "description": "Self-hosted visual AI workflow editor built on TierFall.",
  "license": "SEE LICENSE IN LICENSE",
  "packageManager": "pnpm@10.33.0",
  "engines": {
    "node": ">=24.0.0 <25.0.0",
    "pnpm": ">=10.0.0"
  },
  "scripts": {
    "build": "nx run-many --target=build",
    "test": "nx run-many --target=test",
    "test:int": "nx run cascade-api-e2e:test",
    "test:e2e": "nx run cascade-web-e2e:e2e",
    "lint": "nx run-many --target=lint",
    "typecheck": "nx run-many --target=typecheck",
    "check": "nx run-many --target=lint,typecheck,test,build --parallel=3",
    "format": "prettier --write --log-level warn \"**/*.{ts,tsx,js,mjs,cjs,json,md,yml,yaml}\"",
    "format:check": "prettier --check --log-level warn \"**/*.{ts,tsx,js,mjs,cjs,json,md,yml,yaml}\"",
    "knip": "knip",
    "compose:up": "docker compose up -d",
    "compose:demo": "docker compose --profile demo up -d",
    "compose:down": "docker compose down -v",
    "prepare": "husky"
  },
  "devDependencies": {
    "@commitlint/cli": "19.6.1",
    "@commitlint/config-conventional": "19.6.0",
    "@eslint-community/eslint-plugin-eslint-comments": "4.4.1",
    "@eslint/js": "9.18.0",
    "@nx/devkit": "20.4.0",
    "@nx/eslint": "20.4.0",
    "@nx/jest": "20.4.0",
    "@nx/js": "20.4.0",
    "@nx/next": "20.4.0",
    "@nx/nest": "20.4.0",
    "@nx/playwright": "20.4.0",
    "@nx/expo": "20.4.0",
    "@types/jest": "29.5.14",
    "@types/node": "24.0.0",
    "eslint": "9.18.0",
    "eslint-config-prettier": "10.0.1",
    "husky": "9.1.7",
    "jest": "29.7.0",
    "knip": "5.39.0",
    "lint-staged": "15.4.1",
    "nx": "20.4.0",
    "prettier": "3.4.2",
    "prettier-plugin-organize-imports": "4.1.0",
    "ts-jest": "29.4.10",
    "ts-node": "10.9.2",
    "tsup": "8.5.1",
    "typescript": "6.0.3",
    "typescript-eslint": "8.59.4"
  }
}
```

- [ ] **Step 2: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

- [ ] **Step 3: Write `nx.json`** (mirrors TierFall; adds `e2e` target type)

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/jest.config.[jt]s"
    ],
    "sharedGlobals": ["{workspaceRoot}/eslint.config.mjs", "{workspaceRoot}/tsconfig.base.json"]
  },
  "targetDefaults": {
    "build": { "cache": true, "inputs": ["production", "^production"], "dependsOn": ["^build"] },
    "test": { "cache": true, "inputs": ["default", "^production"], "dependsOn": ["^build"] },
    "lint": {
      "cache": true,
      "inputs": ["default", "{workspaceRoot}/eslint.config.mjs"],
      "dependsOn": ["^build"]
    },
    "typecheck": { "cache": true, "inputs": ["default", "^production"], "dependsOn": ["^build"] },
    "e2e": { "cache": false, "inputs": ["default", "^production"], "dependsOn": ["^build"] }
  },
  "defaultBase": "develop",
  "release": {
    "projectsRelationship": "fixed",
    "projects": ["packages/*"],
    "version": {
      "preVersionCommand": "pnpm exec nx run-many -t build",
      "conventionalCommits": true
    },
    "changelog": {
      "workspaceChangelog": { "createRelease": "github" }
    }
  }
}
```

- [ ] **Step 4: Write `tsconfig.base.json`** (copy TierFall verbatim, then add the `paths` map for workspace imports)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "useUnknownInCatchVariables": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": false,
    "baseUrl": ".",
    "paths": {
      "@tierfall/cascade-tokens": ["packages/cascade-tokens/src/index.ts"],
      "@tierfall/cascade-core": ["packages/cascade-core/src/index.ts"],
      "@tierfall/cascade-sdk": ["packages/cascade-sdk/src/index.ts"],
      "@tierfall/cascade-ui": ["packages/cascade-ui/src/index.ts"],
      "@tierfall/cascade-nodes": ["packages/cascade-nodes/src/index.ts"],
      "@tierfall/cascade-compiler": ["packages/cascade-compiler/src/index.ts"],
      "@tierfall/cascade-cli": ["packages/cascade-cli/src/index.ts"]
    }
  },
  "exclude": ["node_modules", "dist", "coverage", "**/*.test.ts", "**/*.spec.ts"]
}
```

- [ ] **Step 5: Write `eslint.config.mjs`** (mirror TierFall, then ADD package-specific overrides for cascade-tokens/core/sdk that will be expanded in Task 7)

```javascript
// @ts-check
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/.nx/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/.husky/_/**',
      '**/.expo/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'apps/cascade-docs/.source/**',
      'apps/cascade-api/prisma/generated/**',
    ],
  },
  eslint.configs.recommended,
  eslintComments.recommended,
  prettier,
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': true, 'ts-nocheck': true, 'ts-check': false },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    rules: {
      '@eslint-community/eslint-comments/no-use': ['error', { allow: [] }],
      '@eslint-community/eslint-comments/no-unused-disable': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
  {
    files: ['packages/cascade-cli/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
);
```

- [ ] **Step 6: Write `.prettierrc.mjs`**

```javascript
export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  arrowParens: 'always',
  plugins: ['prettier-plugin-organize-imports'],
};
```

- [ ] **Step 7: Write `.prettierignore`**

```
**/dist/**
**/coverage/**
**/.nx/**
**/.next/**
**/node_modules/**
**/.expo/**
**/playwright-report/**
**/test-results/**
pnpm-lock.yaml
apps/cascade-api/prisma/generated/**
apps/cascade-docs/.source/**
```

- [ ] **Step 8: Write `commitlint.config.mjs`** (copy TierFall verbatim)

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
    ],
    'scope-empty': [0],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
  },
};
```

- [ ] **Step 9: Write `knip.json`** (Cascade-specific workspace map; expanded as packages land)

```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "workspaces": {
    "packages/*": {
      "entry": ["src/index.ts!"],
      "project": ["src/**/*.ts!", "test/**/*.ts"]
    },
    "apps/cascade-api": {
      "entry": ["src/main.ts!"],
      "project": ["src/**/*.ts!"]
    },
    "apps/cascade-web": {
      "entry": ["app/**/*.tsx!", "next.config.js"],
      "project": ["**/*.{ts,tsx}!"]
    },
    "apps/cascade-docs": {
      "entry": ["app/**/*.tsx!", "source.config.ts"],
      "project": ["**/*.{ts,tsx,mdx}!"]
    },
    "apps/cascade-mobile": {
      "entry": ["App.tsx", "app.json"],
      "project": ["**/*.{ts,tsx}!"]
    }
  },
  "ignore": ["**/dist/**", "**/.next/**", "**/.expo/**", "**/coverage/**"]
}
```

- [ ] **Step 10: Install dependencies**

```bash
cd /home/ronyv/Develop/Projects/cascade
pnpm install
```

Expected: pnpm creates `node_modules/` and `pnpm-lock.yaml`. No errors. If peer-dependency warnings appear, note them but proceed — the `.npmrc` sets `strict-peer-dependencies=false`.

- [ ] **Step 11: Verify lint and format machinery run** (smoke test before any source)

```bash
pnpm exec eslint --version          # should print 9.18.0
pnpm exec prettier --version        # should print 3.4.2
pnpm exec tsc --version             # should print Version 6.0.3 (or close)
pnpm exec nx --version              # should print 20.4.0
```

- [ ] **Step 12: Commit**

```bash
git add package.json pnpm-workspace.yaml nx.json tsconfig.base.json \
        eslint.config.mjs .prettierrc.mjs .prettierignore \
        commitlint.config.mjs knip.json pnpm-lock.yaml
git commit -s -m "$(cat <<'EOF'
chore: add pnpm workspace, Nx, TypeScript, ESLint, Prettier, commitlint

- pnpm 10.33.0 workspace covering packages/* and apps/*
- Nx 20.4.0 with defaultBase=develop and fixed-mode release config
- TypeScript 6.0.3 with strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes
- ESLint 9 flat config mirroring TierFall (typescript-eslint strict-type-checked,
  eslint-comments banning every disable directive, ts-ignore/expect-error blocked)
- Prettier 3.4.2 with prettier-plugin-organize-imports
- commitlint with the same type-enum as TierFall
- knip workspace map for the seven packages and four apps that will land in tasks 4-15EOF
)"
```

---

## Task 3: Add Husky pre-commit hooks and DCO sign-off

**Files:**
- Create: `.husky/pre-commit`, `.husky/commit-msg`, `.husky/prepare-commit-msg`, `.lintstagedrc.mjs`

- [ ] **Step 1: Initialize Husky**

```bash
cd /home/ronyv/Develop/Projects/cascade
pnpm exec husky init
```

This creates `.husky/pre-commit` with a placeholder. Overwrite in the next step.

- [ ] **Step 2: Write `.husky/pre-commit`**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm exec lint-staged
pnpm exec tsc --noEmit
pnpm exec nx affected -t test --base=HEAD~1 --head=HEAD --parallel=3 || pnpm exec nx run-many -t test --parallel=3
```

The fallback to `run-many` covers the very-first-commit case where `HEAD~1` doesn't exist.

- [ ] **Step 3: Write `.husky/commit-msg`** (copy TierFall verbatim)

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm exec commitlint --edit "$1"
```

- [ ] **Step 4: Write `.husky/prepare-commit-msg`** — enforces DCO sign-off automatically

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# If the commit message already contains a Signed-off-by trailer, leave it alone.
# Otherwise append one using the configured user.email / user.name. This makes
# `git commit -s` redundant but still safe — and means a forgotten -s no longer
# slips through.
if ! grep -q '^Signed-off-by: ' "$1"; then
  NAME=$(git config user.name)
  EMAIL=$(git config user.email)
  if [ -z "$NAME" ] || [ -z "$EMAIL" ]; then
    echo "DCO hook: git config user.name / user.email must be set" >&2
    exit 1
  fi
  printf '\nSigned-off-by: %s <%s>\n' "$NAME" "$EMAIL" >> "$1"
fi
```

- [ ] **Step 5: Make hooks executable**

```bash
chmod +x .husky/pre-commit .husky/commit-msg .husky/prepare-commit-msg
```

- [ ] **Step 6: Write `.lintstagedrc.mjs`** (copy TierFall, extend for tsx/mdx)

```javascript
export default {
  '*.{ts,tsx,mjs,cjs,js}': ['eslint --max-warnings=0 --no-warn-ignored', 'prettier --check'],
  '*.{json,md,mdx,yml,yaml,css}': ['prettier --check'],
};
```

- [ ] **Step 7: Verify hooks fire** — make a deliberately-failing dummy commit and confirm pre-commit blocks it

```bash
echo "console.log('any' as any);" > /tmp/probe.ts
git add /tmp/probe.ts 2>&1 || true   # file is outside repo; this will no-op
# Instead, touch a tracked file to provoke the hook chain
echo "" >> README.md && touch README.md || echo "" > README.md   # README doesn't exist yet
# Cleanup
git checkout README.md 2>/dev/null || rm -f README.md
```

Skip the probe step if it's too fragile in the executor's environment. Real verification happens in Task 4 onward when actual code lands.

- [ ] **Step 8: Commit**

```bash
git add .husky/pre-commit .husky/commit-msg .husky/prepare-commit-msg .lintstagedrc.mjs
git commit -m "$(cat <<'EOF'
chore: add Husky pre-commit hooks and DCO sign-off

- pre-commit: lint-staged → tsc --noEmit → affected tests
- commit-msg: commitlint --edit
- prepare-commit-msg: auto-append Signed-off-by trailer so a forgotten `-s`
  doesn't block contributors (DCO is still required, just opt-in via config)
- lint-staged: eslint --max-warnings=0 on TS/JS, prettier --check on docs/yaml

Per spec §2 and constraint #15 of the kickoff: `--no-verify` is forbidden;
all merges go through these hooks.EOF
)"
```

Note: the `prepare-commit-msg` hook adds `Signed-off-by` automatically, so omit `-s` here — the trailer is appended by the hook.

---

## Task 4: Scaffold `cascade-tokens` package

**Files:**
- Create: `packages/cascade-tokens/package.json`, `tsconfig.json`, `project.json`, `jest.config.ts`, `tsup.config.ts`, `CLAUDE.md`
- Create: `packages/cascade-tokens/src/{index,colors,spacing,typography,radii,motion}.ts`
- Create: `packages/cascade-tokens/test/tokens.test.ts`

This package is pure TypeScript with **zero DOM, React DOM, Node-only, or Next-only imports** — enforced in Task 7. Coverage threshold per spec §4.5: 100% across all four metrics.

- [ ] **Step 1: Create the directory and write `package.json`**

```bash
mkdir -p packages/cascade-tokens/src packages/cascade-tokens/test
```

`packages/cascade-tokens/package.json`:

```json
{
  "name": "@tierfall/cascade-tokens",
  "version": "0.0.0",
  "description": "Cascade design tokens: colors, spacing, typography, motion, radii. Platform-neutral pure TypeScript — consumed by cascade-ui (web) and cascade-mobile (RN).",
  "license": "SEE LICENSE IN ../../LICENSE",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    },
    "./package.json": "./package.json"
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "node --experimental-vm-modules ../../node_modules/jest/bin/jest.js --coverage",
    "lint": "eslint --max-warnings=0 src test",
    "typecheck": "tsc --noEmit --pretty false"
  },
  "publishConfig": { "access": "public" }
}
```

- [ ] **Step 2: Write `packages/cascade-tokens/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules", "test", "**/*.test.ts"]
}
```

- [ ] **Step 3: Write `packages/cascade-tokens/project.json`** (Nx targets)

```json
{
  "name": "cascade-tokens",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/cascade-tokens/src",
  "projectType": "library",
  "tags": ["scope:platform-neutral", "type:tokens"],
  "targets": {
    "build": { "executor": "nx:run-script", "options": { "script": "build" }, "outputs": ["{projectRoot}/dist"] },
    "test": { "executor": "nx:run-script", "options": { "script": "test" } },
    "lint": { "executor": "nx:run-script", "options": { "script": "lint" } },
    "typecheck": { "executor": "nx:run-script", "options": { "script": "typecheck" } }
  }
}
```

The `scope:platform-neutral` tag is the linchpin for the ESLint boundary rule installed in Task 7.

- [ ] **Step 4: Write `packages/cascade-tokens/tsup.config.ts`**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  treeshake: true,
});
```

- [ ] **Step 5: Write `packages/cascade-tokens/jest.config.ts`** — coverage threshold 100% per spec §4.5

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: { statements: 100, branches: 100, functions: 100, lines: 100 },
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: { module: 'ESNext' } }],
  },
};

export default config;
```

- [ ] **Step 6: Write the failing tests FIRST** (`packages/cascade-tokens/test/tokens.test.ts`)

```typescript
import { describe, expect, it } from '@jest/globals';
import { colors, motion, radii, spacing, typography } from '../src/index.js';

describe('colors', () => {
  it('exposes a five-step tier ramp (tier 0 = local, tier 4 = most expensive cloud)', () => {
    expect(colors.tier).toHaveLength(5);
    colors.tier.forEach((shade) => {
      expect(shade).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('exposes neutral foreground and background pairs in light and dark mode', () => {
    expect(colors.neutral.background.light).toMatch(/^#[0-9a-f]{6}$/i);
    expect(colors.neutral.background.dark).toMatch(/^#[0-9a-f]{6}$/i);
    expect(colors.neutral.foreground.light).toMatch(/^#[0-9a-f]{6}$/i);
    expect(colors.neutral.foreground.dark).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('every color object is frozen (immutable contract)', () => {
    expect(Object.isFrozen(colors)).toBe(true);
    expect(Object.isFrozen(colors.tier)).toBe(true);
    expect(Object.isFrozen(colors.neutral)).toBe(true);
  });
});

describe('spacing', () => {
  it('exposes an 8-step scale in rem units', () => {
    expect(Object.keys(spacing)).toHaveLength(8);
    Object.values(spacing).forEach((value) => {
      expect(value).toMatch(/^\d+(\.\d+)?rem$/);
    });
  });

  it('scale is strictly monotonic increasing', () => {
    const numeric = Object.values(spacing).map((s) => parseFloat(s));
    for (let i = 1; i < numeric.length; i += 1) {
      const prev = numeric[i - 1];
      const curr = numeric[i];
      if (prev === undefined || curr === undefined) throw new Error('unreachable');
      expect(curr).toBeGreaterThan(prev);
    }
  });
});

describe('typography', () => {
  it('exposes font families for sans, serif, and mono', () => {
    expect(typography.fontFamily.sans).toContain('Inter');
    expect(typography.fontFamily.mono).toContain('JetBrains Mono');
  });

  it('exposes a font-size scale with at least display, body, and caption', () => {
    expect(typography.fontSize.display).toBeDefined();
    expect(typography.fontSize.body).toBeDefined();
    expect(typography.fontSize.caption).toBeDefined();
  });
});

describe('radii', () => {
  it('exposes a 5-step border-radius scale', () => {
    expect(Object.keys(radii)).toEqual(expect.arrayContaining(['none', 'sm', 'md', 'lg', 'full']));
  });
});

describe('motion', () => {
  it('exposes durations and easings used across web and mobile', () => {
    expect(motion.duration.fast).toMatch(/^\d+ms$/);
    expect(motion.duration.normal).toMatch(/^\d+ms$/);
    expect(motion.duration.slow).toMatch(/^\d+ms$/);
    expect(motion.easing.standard).toBeDefined();
  });
});
```

- [ ] **Step 7: Run the tests and verify they fail** (because src is empty)

```bash
pnpm --filter @tierfall/cascade-tokens test
```

Expected: jest fails with "Cannot find module '../src/index.js'" or similar import resolution error.

- [ ] **Step 8: Implement `packages/cascade-tokens/src/colors.ts`**

```typescript
const tierRamp = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'] as const;

export const colors = Object.freeze({
  tier: Object.freeze(tierRamp) as readonly string[],
  neutral: Object.freeze({
    background: Object.freeze({ light: '#fafafa', dark: '#0a0a0a' }),
    foreground: Object.freeze({ light: '#0a0a0a', dark: '#fafafa' }),
    border: Object.freeze({ light: '#e5e5e5', dark: '#262626' }),
    muted: Object.freeze({ light: '#737373', dark: '#a3a3a3' }),
  }),
  semantic: Object.freeze({
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',
    info: '#3b82f6',
  }),
});
```

- [ ] **Step 9: Implement `packages/cascade-tokens/src/spacing.ts`**

```typescript
export const spacing = Object.freeze({
  '0': '0rem',
  '1': '0.25rem',
  '2': '0.5rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.5rem',
  '6': '2rem',
  '7': '3rem',
} as const);
```

- [ ] **Step 10: Implement `packages/cascade-tokens/src/typography.ts`**

```typescript
export const typography = Object.freeze({
  fontFamily: Object.freeze({
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
    serif: 'ui-serif, Georgia, serif',
    mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace',
  }),
  fontSize: Object.freeze({
    caption: '0.75rem',
    body: '1rem',
    h3: '1.25rem',
    h2: '1.5rem',
    h1: '2rem',
    display: '3rem',
  }),
  fontWeight: Object.freeze({
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  }),
  lineHeight: Object.freeze({
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  }),
});
```

- [ ] **Step 11: Implement `packages/cascade-tokens/src/radii.ts`**

```typescript
export const radii = Object.freeze({
  none: '0',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '1rem',
  full: '9999px',
} as const);
```

- [ ] **Step 12: Implement `packages/cascade-tokens/src/motion.ts`**

```typescript
export const motion = Object.freeze({
  duration: Object.freeze({
    fast: '120ms',
    normal: '200ms',
    slow: '320ms',
  }),
  easing: Object.freeze({
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    decelerate: 'cubic-bezier(0, 0, 0, 1)',
    accelerate: 'cubic-bezier(0.3, 0, 1, 1)',
  }),
});
```

- [ ] **Step 13: Write `packages/cascade-tokens/src/index.ts`**

```typescript
export { colors } from './colors.js';
export { spacing } from './spacing.js';
export { typography } from './typography.js';
export { radii } from './radii.js';
export { motion } from './motion.js';
```

- [ ] **Step 14: Run the tests and verify they pass with 100% coverage**

```bash
pnpm --filter @tierfall/cascade-tokens test
```

Expected: all tests pass, coverage at 100% across statements/branches/functions/lines. The `coverageThreshold` block will fail the test command if any metric is below 100% — that's the gate, not a separate check.

- [ ] **Step 15: Run the build**

```bash
pnpm --filter @tierfall/cascade-tokens build
```

Expected: `packages/cascade-tokens/dist/` is created with `index.js`, `index.cjs`, `index.d.ts`, `index.d.cts`, and sourcemaps.

- [ ] **Step 16: Write `packages/cascade-tokens/CLAUDE.md`**

```markdown
# cascade-tokens — Claude context

**Purpose:** Single source of truth for Cascade's visual language. Pure TypeScript;
no DOM, no React, no Node-only imports.

## What lives here

- `src/colors.ts` — tier ramp + neutral/semantic palettes (light + dark)
- `src/spacing.ts` — 8-step rem scale
- `src/typography.ts` — fontFamily, fontSize, fontWeight, lineHeight
- `src/radii.ts` — border-radius ramp
- `src/motion.ts` — duration + easing tokens

All exports are deeply `Object.freeze`-d. Mutating them is a type error AND a runtime error.

## Consumers

- `packages/cascade-ui/tailwind-preset.ts` — emits Tailwind theme entries from these tokens.
- `apps/cascade-mobile/App.tsx` — consumes via inline `StyleSheet.create` (RN-boundary smoke test).
- Future `packages/cascade-ui-native/` (post-v1.0) — hand-rolled RN components.

## Hard rules

- Pure TypeScript. NO imports from `react`, `react-dom`, `next`, `node:*`, or anything else
  that wouldn't resolve in a React Native bundler. Enforced by the ESLint
  `no-restricted-imports` rule in the root `eslint.config.mjs` (added in Task 7).
- 100% coverage threshold (statements/branches/functions/lines). Drop below and `pnpm test`
  fails.
- Any new token added here MUST appear in the Tailwind preset (`cascade-ui`) within the
  same PR — that's the contract.
```

- [ ] **Step 17: Commit**

```bash
git add packages/cascade-tokens/
git commit -m "$(cat <<'EOF'
feat(tokens): scaffold cascade-tokens package

- colors: tier ramp (5 steps) + light/dark neutral palette + semantic palette
- spacing: 8-step rem scale (0rem -> 3rem), strictly monotonic
- typography: Inter/JetBrains Mono families + 6-step fontSize scale
- radii: 5-step border-radius scale
- motion: fast/normal/slow durations + standard/decelerate/accelerate easings
- All exports deeply frozen; 100% coverage threshold per spec §4.5
- tsup builds ESM + CJS + .d.ts/.d.cts dual artifacts
- Tagged `scope:platform-neutral` for the ESLint boundary rule landing in Task 7

Per spec §7, this package is the SSOT for visual language across web and RN.
EOF
)"
```

---

## Task 5: Scaffold `cascade-core` with Zod schemas and fast-check property tests

**Files:**
- Create: `packages/cascade-core/{package.json,tsconfig.json,project.json,jest.config.ts,tsup.config.ts,CLAUDE.md}`
- Create: `packages/cascade-core/src/{index,workflow-schema,graph,tier-policy,errors}.ts`
- Create: `packages/cascade-core/test/{workflow-schema,graph,tier-policy}.test.ts`

This is the public-API package: workflow JSON schema (the v0.1 schema-version) lives here. Coverage threshold 100%.

- [ ] **Step 1: Create the package skeleton**

```bash
mkdir -p packages/cascade-core/src packages/cascade-core/test
```

`packages/cascade-core/package.json`:

```json
{
  "name": "@tierfall/cascade-core",
  "version": "0.0.0",
  "description": "Cascade workflow schema, graph utilities, tier-policy types. Platform-neutral, pure TypeScript.",
  "license": "SEE LICENSE IN ../../LICENSE",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    },
    "./package.json": "./package.json"
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "node --experimental-vm-modules ../../node_modules/jest/bin/jest.js --coverage",
    "lint": "eslint --max-warnings=0 src test",
    "typecheck": "tsc --noEmit --pretty false"
  },
  "dependencies": {
    "zod": "3.24.1"
  },
  "devDependencies": {
    "fast-check": "3.23.2"
  },
  "publishConfig": { "access": "public" }
}
```

- [ ] **Step 2: Write `packages/cascade-core/tsconfig.json`** — same shape as cascade-tokens

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules", "test", "**/*.test.ts"]
}
```

- [ ] **Step 3: Write `packages/cascade-core/project.json`**

```json
{
  "name": "cascade-core",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/cascade-core/src",
  "projectType": "library",
  "tags": ["scope:platform-neutral", "type:domain"],
  "targets": {
    "build": { "executor": "nx:run-script", "options": { "script": "build" }, "outputs": ["{projectRoot}/dist"] },
    "test": { "executor": "nx:run-script", "options": { "script": "test" } },
    "lint": { "executor": "nx:run-script", "options": { "script": "lint" } },
    "typecheck": { "executor": "nx:run-script", "options": { "script": "typecheck" } }
  }
}
```

- [ ] **Step 4: Write `packages/cascade-core/tsup.config.ts`** — identical shape to cascade-tokens

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  treeshake: true,
});
```

- [ ] **Step 5: Write `packages/cascade-core/jest.config.ts`** — same shape, 100% threshold

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: { statements: 100, branches: 100, functions: 100, lines: 100 },
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: { module: 'ESNext' } }],
  },
};

export default config;
```

- [ ] **Step 6: Write the failing tests for the workflow schema FIRST** (`packages/cascade-core/test/workflow-schema.test.ts`)

```typescript
import { describe, expect, it } from '@jest/globals';
import fc from 'fast-check';
import { WorkflowSchema, type Workflow } from '../src/workflow-schema.js';

describe('WorkflowSchema', () => {
  it('parses a minimal valid workflow', () => {
    const input: Workflow = {
      schemaVersion: '1.0.0',
      id: 'wf_demo',
      name: 'Demo',
      nodes: [{ id: 'start', type: 'http', config: { url: 'https://example.com' } }],
      edges: [],
      triggers: [],
    };
    const result = WorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects a workflow with no nodes', () => {
    const result = WorkflowSchema.safeParse({
      schemaVersion: '1.0.0',
      id: 'wf_empty',
      name: 'Empty',
      nodes: [],
      edges: [],
      triggers: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an edge that references an unknown node', () => {
    const result = WorkflowSchema.safeParse({
      schemaVersion: '1.0.0',
      id: 'wf_orphan',
      name: 'Orphan edge',
      nodes: [{ id: 'a', type: 'http', config: {} }],
      edges: [{ from: 'a', to: 'b' }],
      triggers: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown node type', () => {
    const result = WorkflowSchema.safeParse({
      schemaVersion: '1.0.0',
      id: 'wf_bad',
      name: 'Bad type',
      nodes: [{ id: 'x', type: 'no-such-type', config: {} }],
      edges: [],
      triggers: [],
    });
    expect(result.success).toBe(false);
  });

  it('property: rejects any workflow whose id is not a non-empty string', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(''), fc.constant(undefined), fc.integer(), fc.boolean()),
        (badId) => {
          const result = WorkflowSchema.safeParse({
            schemaVersion: '1.0.0',
            id: badId,
            name: 'x',
            nodes: [{ id: 'n', type: 'http', config: {} }],
            edges: [],
            triggers: [],
          });
          return result.success === false;
        },
      ),
    );
  });
});
```

- [ ] **Step 7: Write the failing tests for graph utilities** (`packages/cascade-core/test/graph.test.ts`)

```typescript
import { describe, expect, it } from '@jest/globals';
import fc from 'fast-check';
import { hasCycle, topologicalSort, reachableFrom } from '../src/graph.js';

describe('hasCycle', () => {
  it('returns false on an empty graph', () => {
    expect(hasCycle({ nodes: [], edges: [] })).toBe(false);
  });

  it('returns false on a linear chain', () => {
    expect(
      hasCycle({
        nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'c' },
        ],
      }),
    ).toBe(false);
  });

  it('detects a direct self-loop', () => {
    expect(
      hasCycle({ nodes: [{ id: 'a' }], edges: [{ from: 'a', to: 'a' }] }),
    ).toBe(true);
  });

  it('detects a back-edge cycle of length 3', () => {
    expect(
      hasCycle({
        nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'c' },
          { from: 'c', to: 'a' },
        ],
      }),
    ).toBe(true);
  });

  it('property: a randomly-generated tree never has a cycle', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), (n) => {
        const nodes = Array.from({ length: n }, (_, i) => ({ id: `n${i}` }));
        const edges = Array.from({ length: n - 1 }, (_, i) => ({
          from: `n${i}`,
          to: `n${i + 1}`,
        }));
        return hasCycle({ nodes, edges }) === false;
      }),
    );
  });
});

describe('topologicalSort', () => {
  it('returns nodes in dependency order', () => {
    const sorted = topologicalSort({
      nodes: [{ id: 'c' }, { id: 'a' }, { id: 'b' }],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
      ],
    });
    expect(sorted).toEqual(['a', 'b', 'c']);
  });

  it('throws on a cyclic graph', () => {
    expect(() =>
      topologicalSort({
        nodes: [{ id: 'a' }, { id: 'b' }],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'a' },
        ],
      }),
    ).toThrow(/cycle/i);
  });
});

describe('reachableFrom', () => {
  it('returns just the start node when no outgoing edges', () => {
    expect(reachableFrom({ nodes: [{ id: 'a' }], edges: [] }, 'a')).toEqual(new Set(['a']));
  });

  it('walks the full forward closure', () => {
    expect(
      reachableFrom(
        {
          nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
          edges: [
            { from: 'a', to: 'b' },
            { from: 'b', to: 'c' },
            { from: 'a', to: 'd' },
          ],
        },
        'a',
      ),
    ).toEqual(new Set(['a', 'b', 'c', 'd']));
  });

  it('returns empty set when start node is not in the graph', () => {
    expect(reachableFrom({ nodes: [], edges: [] }, 'missing')).toEqual(new Set());
  });
});
```

- [ ] **Step 8: Write the failing tests for tier policy** (`packages/cascade-core/test/tier-policy.test.ts`)

```typescript
import { describe, expect, it } from '@jest/globals';
import { TierPolicySchema, defaultPolicy, mergePolicy } from '../src/tier-policy.js';

describe('TierPolicySchema', () => {
  it('parses a fully-specified policy', () => {
    const result = TierPolicySchema.safeParse({
      preferLocal: true,
      maxCostUsd: 0.1,
      allowedTiers: [0, 1, 2],
      fallbackOnError: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative maxCostUsd', () => {
    expect(
      TierPolicySchema.safeParse({ preferLocal: true, maxCostUsd: -1, allowedTiers: [0], fallbackOnError: false }).success,
    ).toBe(false);
  });

  it('rejects an empty allowedTiers list', () => {
    expect(
      TierPolicySchema.safeParse({ preferLocal: true, maxCostUsd: 1, allowedTiers: [], fallbackOnError: false }).success,
    ).toBe(false);
  });
});

describe('defaultPolicy', () => {
  it('is local-preferring, low-cost, all-tiers-allowed', () => {
    expect(defaultPolicy.preferLocal).toBe(true);
    expect(defaultPolicy.maxCostUsd).toBeLessThanOrEqual(1.0);
    expect(defaultPolicy.allowedTiers).toEqual([0, 1, 2, 3, 4]);
    expect(defaultPolicy.fallbackOnError).toBe(true);
  });
});

describe('mergePolicy', () => {
  it('overrides default fields with provided partial', () => {
    const merged = mergePolicy(defaultPolicy, { maxCostUsd: 0.5 });
    expect(merged.maxCostUsd).toBe(0.5);
    expect(merged.preferLocal).toBe(defaultPolicy.preferLocal);
  });

  it('returns a frozen object', () => {
    const merged = mergePolicy(defaultPolicy, {});
    expect(Object.isFrozen(merged)).toBe(true);
  });
});
```

- [ ] **Step 9: Run all tests; verify they fail** (no source yet)

```bash
pnpm --filter @tierfall/cascade-core test
```

Expected: cannot resolve `../src/*.js` imports.

- [ ] **Step 10: Implement `packages/cascade-core/src/errors.ts`**

```typescript
export class WorkflowValidationError extends Error {
  constructor(message: string, public readonly issues: readonly string[] = []) {
    super(message);
    this.name = 'WorkflowValidationError';
  }
}

export class CycleDetectedError extends Error {
  constructor(public readonly cycle: readonly string[]) {
    super(`cycle detected: ${cycle.join(' -> ')}`);
    this.name = 'CycleDetectedError';
  }
}
```

- [ ] **Step 11: Implement `packages/cascade-core/src/workflow-schema.ts`**

```typescript
import { z } from 'zod';

const NODE_TYPES = ['llm', 'conditional', 'transform', 'http'] as const;

const NodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(NODE_TYPES),
  config: z.record(z.unknown()),
});

const EdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

const TriggerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('webhook'), path: z.string() }),
  z.object({ kind: z.literal('cron'), schedule: z.string() }),
  z.object({ kind: z.literal('manual') }),
]);

export const WorkflowSchema = z
  .object({
    schemaVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    id: z.string().min(1),
    name: z.string().min(1),
    nodes: z.array(NodeSchema).min(1),
    edges: z.array(EdgeSchema),
    triggers: z.array(TriggerSchema),
  })
  .superRefine((wf, ctx) => {
    const ids = new Set(wf.nodes.map((n) => n.id));
    wf.edges.forEach((e, i) => {
      if (!ids.has(e.from)) {
        ctx.addIssue({ code: 'custom', path: ['edges', i, 'from'], message: 'unknown node' });
      }
      if (!ids.has(e.to)) {
        ctx.addIssue({ code: 'custom', path: ['edges', i, 'to'], message: 'unknown node' });
      }
    });
  });

export type Workflow = z.infer<typeof WorkflowSchema>;
export type Node = z.infer<typeof NodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type Trigger = z.infer<typeof TriggerSchema>;
export const NODE_TYPE_LIST = NODE_TYPES;
```

- [ ] **Step 12: Implement `packages/cascade-core/src/graph.ts`**

```typescript
import { CycleDetectedError } from './errors.js';

interface MinimalNode { id: string }
interface MinimalEdge { from: string; to: string }
export interface Graph {
  nodes: readonly MinimalNode[];
  edges: readonly MinimalEdge[];
}

function adjacency(graph: Graph): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  graph.nodes.forEach((n) => adj.set(n.id, []));
  graph.edges.forEach((e) => {
    const list = adj.get(e.from);
    if (list) list.push(e.to);
  });
  return adj;
}

export function hasCycle(graph: Graph): boolean {
  const adj = adjacency(graph);
  const visited = new Set<string>();
  const stack = new Set<string>();
  const dfs = (id: string): boolean => {
    if (stack.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    stack.add(id);
    const out = adj.get(id) ?? [];
    for (const next of out) {
      if (dfs(next)) return true;
    }
    stack.delete(id);
    return false;
  };
  for (const node of graph.nodes) {
    if (dfs(node.id)) return true;
  }
  return false;
}

export function topologicalSort(graph: Graph): string[] {
  if (hasCycle(graph)) {
    throw new CycleDetectedError([]);
  }
  const adj = adjacency(graph);
  const indeg = new Map<string, number>();
  graph.nodes.forEach((n) => indeg.set(n.id, 0));
  graph.edges.forEach((e) => indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1));

  const queue: string[] = [];
  indeg.forEach((d, id) => { if (d === 0) queue.push(id); });
  const sorted: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift();
    if (id === undefined) break;
    sorted.push(id);
    (adj.get(id) ?? []).forEach((next) => {
      const newDeg = (indeg.get(next) ?? 0) - 1;
      indeg.set(next, newDeg);
      if (newDeg === 0) queue.push(next);
    });
  }
  return sorted;
}

export function reachableFrom(graph: Graph, start: string): Set<string> {
  const adj = adjacency(graph);
  const visited = new Set<string>();
  if (!adj.has(start)) return visited;
  const stack: string[] = [start];
  while (stack.length > 0) {
    const id = stack.pop();
    if (id === undefined) break;
    if (visited.has(id)) continue;
    visited.add(id);
    (adj.get(id) ?? []).forEach((next) => stack.push(next));
  }
  return visited;
}
```

- [ ] **Step 13: Implement `packages/cascade-core/src/tier-policy.ts`**

```typescript
import { z } from 'zod';

export const TierPolicySchema = z.object({
  preferLocal: z.boolean(),
  maxCostUsd: z.number().nonnegative(),
  allowedTiers: z.array(z.number().int().min(0).max(4)).min(1),
  fallbackOnError: z.boolean(),
});

export type TierPolicy = z.infer<typeof TierPolicySchema>;

export const defaultPolicy: TierPolicy = Object.freeze({
  preferLocal: true,
  maxCostUsd: 1.0,
  allowedTiers: [0, 1, 2, 3, 4],
  fallbackOnError: true,
});

export function mergePolicy(base: TierPolicy, partial: Partial<TierPolicy>): TierPolicy {
  return Object.freeze({
    preferLocal: partial.preferLocal ?? base.preferLocal,
    maxCostUsd: partial.maxCostUsd ?? base.maxCostUsd,
    allowedTiers: partial.allowedTiers ?? base.allowedTiers,
    fallbackOnError: partial.fallbackOnError ?? base.fallbackOnError,
  });
}
```

- [ ] **Step 14: Write `packages/cascade-core/src/index.ts`**

```typescript
export * from './workflow-schema.js';
export * from './graph.js';
export * from './tier-policy.js';
export { WorkflowValidationError, CycleDetectedError } from './errors.js';
```

- [ ] **Step 15: Run tests, verify pass at 100% coverage**

```bash
pnpm --filter @tierfall/cascade-core test
```

Expected: all suites green, 100% across statements/branches/functions/lines. If coverage falls short on `errors.ts` (constructor branches), add the corresponding `.test.ts` cases — do not lower the threshold.

- [ ] **Step 16: Build**

```bash
pnpm --filter @tierfall/cascade-core build
```

- [ ] **Step 17: Write `packages/cascade-core/CLAUDE.md`**

```markdown
# cascade-core — Claude context

**Purpose:** Public-API shared types for Cascade. Workflow JSON schema (the v0.1
public contract), graph utilities, tier-policy types. Platform-neutral pure TS.

## What lives here

- `src/workflow-schema.ts` — Zod schema for Workflow + node/edge/trigger discriminated unions.
  This is the v0.1 schema-version=`1.0.0` contract. Breaking changes require a schema-version bump
  AND a migration plan in `docs/adrs/`.
- `src/graph.ts` — pure graph utilities: `hasCycle`, `topologicalSort`, `reachableFrom`.
- `src/tier-policy.ts` — `TierPolicy` type + `defaultPolicy` + `mergePolicy`. Maps to TierFall's
  routing semantics — keep aligned with `@tierfall/core` upstream.
- `src/errors.ts` — `WorkflowValidationError`, `CycleDetectedError`. Both are typed; consumers
  pattern-match by `instanceof`.

## Consumers

- `cascade-api` — validates incoming workflow JSON, enforces schema-version on disk.
- `cascade-compiler` — reads validated workflows and emits TypeScript.
- `cascade-cli` — uses `topologicalSort` to dry-run.
- `cascade-sdk` — re-exports `Workflow` and `TierPolicy` types for clients.
- `cascade-nodes` — references `NODE_TYPE_LIST` to gate registry entries.

## Hard rules

- Platform-neutral. NO `react`, `react-dom`, `next`, `node:*`. Enforced in Task 7.
- 100% coverage threshold. fast-check property tests cover the graph utilities AND the
  workflow schema's rejection paths.
- The Zod schema IS the public API. Schema-version changes are semver-breaking on this package.
```

- [ ] **Step 18: Commit**

```bash
git add packages/cascade-core/
git commit -m "$(cat <<'EOF'
feat(core): scaffold cascade-core with Zod schemas and fast-check property tests

- WorkflowSchema (zod): nodes (>=1), edges (referential-integrity verified),
  triggers (webhook/cron/manual discriminated union), schemaVersion semver gate.
- Node types restricted to {llm, conditional, transform, http} for v0.1.
- Graph utilities: hasCycle, topologicalSort, reachableFrom — all pure, all
  covered by both example-based AND fast-check property tests.
- TierPolicySchema + defaultPolicy + mergePolicy aligned with TierFall's routing
  semantics. Defaults: preferLocal=true, maxCostUsd=1.0, all five tiers allowed.
- Typed errors: WorkflowValidationError, CycleDetectedError.
- 100% coverage threshold; build emits ESM + CJS dual artifacts.

Spec ref: §3.2 (platform-neutral boundary), §4.5 (coverage), §9 (workflow
schema as public API), §10.3 (demo workflow uses two adapters via TierFall).
EOF
)"
```

---

## Task 6: Scaffold `cascade-sdk` fetch-based client

**Files:**
- Create: `packages/cascade-sdk/{package.json,tsconfig.json,project.json,jest.config.ts,tsup.config.ts,CLAUDE.md}`
- Create: `packages/cascade-sdk/src/{index,client,errors,types}.ts`
- Create: `packages/cascade-sdk/test/client.test.ts`

100% coverage. NO DOM, NO Node-only imports — uses global `fetch` (available in Node 24, Bun, Deno, browsers, RN).

- [ ] **Step 1: Create skeleton + write `packages/cascade-sdk/package.json`**

```bash
mkdir -p packages/cascade-sdk/src packages/cascade-sdk/test
```

```json
{
  "name": "@tierfall/cascade-sdk",
  "version": "0.0.0",
  "description": "Typed fetch-based client for the Cascade API. Platform-neutral pure TypeScript.",
  "license": "SEE LICENSE IN ../../LICENSE",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    },
    "./package.json": "./package.json"
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "node --experimental-vm-modules ../../node_modules/jest/bin/jest.js --coverage",
    "lint": "eslint --max-warnings=0 src test",
    "typecheck": "tsc --noEmit --pretty false"
  },
  "dependencies": {
    "@tierfall/cascade-core": "workspace:*"
  },
  "publishConfig": { "access": "public" }
}
```

- [ ] **Step 2: Write `packages/cascade-sdk/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules", "test", "**/*.test.ts"]
}
```

- [ ] **Step 3: Write `packages/cascade-sdk/project.json`** — tagged `scope:platform-neutral`

```json
{
  "name": "cascade-sdk",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/cascade-sdk/src",
  "projectType": "library",
  "tags": ["scope:platform-neutral", "type:client"],
  "targets": {
    "build": { "executor": "nx:run-script", "options": { "script": "build" }, "outputs": ["{projectRoot}/dist"] },
    "test": { "executor": "nx:run-script", "options": { "script": "test" } },
    "lint": { "executor": "nx:run-script", "options": { "script": "lint" } },
    "typecheck": { "executor": "nx:run-script", "options": { "script": "typecheck" } }
  }
}
```

- [ ] **Step 4a: Write `packages/cascade-sdk/tsup.config.ts`**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  treeshake: true,
});
```

- [ ] **Step 4b: Write `packages/cascade-sdk/jest.config.ts`** — 100% threshold (platform-neutral)

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: { statements: 100, branches: 100, functions: 100, lines: 100 },
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: { module: 'ESNext' } }],
  },
};

export default config;
```

- [ ] **Step 5: Write failing tests** (`packages/cascade-sdk/test/client.test.ts`)

```typescript
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CascadeClient, CascadeApiError } from '../src/index.js';

describe('CascadeClient', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  it('issues a GET to /health on healthcheck()', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    const client = new CascadeClient({ baseUrl: 'http://api.test' });
    const result = await client.health();
    expect(result.status).toBe('ok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/health',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('throws CascadeApiError on a 500 response', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'boom' }), { status: 500 }),
    );
    const client = new CascadeClient({ baseUrl: 'http://api.test' });
    await expect(client.health()).rejects.toBeInstanceOf(CascadeApiError);
  });

  it('attaches the Authorization header when an api token is configured', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
    const client = new CascadeClient({ baseUrl: 'http://api.test', apiToken: 't0ken' });
    await client.health();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/health',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer t0ken' }),
      }),
    );
  });

  it('listWorkflows() issues a GET to /workflows and returns the parsed array', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 'wf_1', name: 'Demo' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = new CascadeClient({ baseUrl: 'http://api.test' });
    const wfs = await client.listWorkflows();
    expect(wfs).toEqual([{ id: 'wf_1', name: 'Demo' }]);
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/workflows', expect.objectContaining({ method: 'GET' }));
  });

  it('triggerWorkflow() POSTs JSON to /workflows/:id/runs', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'run_1', status: 'queued' }), {
        status: 202,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = new CascadeClient({ baseUrl: 'http://api.test' });
    const run = await client.triggerWorkflow('wf_1', { input: { hello: 'world' } });
    expect(run.id).toBe('run_1');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/workflows/wf_1/runs',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ input: { hello: 'world' } }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('rejects with CascadeApiError when content-type is not JSON', async () => {
    fetchMock.mockResolvedValueOnce(new Response('not json', { status: 200, headers: { 'content-type': 'text/plain' } }));
    const client = new CascadeClient({ baseUrl: 'http://api.test' });
    await expect(client.health()).rejects.toBeInstanceOf(CascadeApiError);
  });
});
```

- [ ] **Step 6: Verify tests fail**

```bash
pnpm --filter @tierfall/cascade-sdk test
```

Expected: import resolution failure.

- [ ] **Step 7: Implement `packages/cascade-sdk/src/errors.ts`**

```typescript
export class CascadeApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly body?: unknown) {
    super(message);
    this.name = 'CascadeApiError';
  }
}
```

- [ ] **Step 8: Implement `packages/cascade-sdk/src/types.ts`**

```typescript
import type { Workflow } from '@tierfall/cascade-core';

export type { Workflow };

export interface HealthResponse {
  status: 'ok' | 'degraded';
}

export interface RunSummary {
  id: string;
  status: 'queued' | 'running' | 'success' | 'error';
  workflowId: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface TriggerInput {
  input?: Record<string, unknown>;
}

export interface ClientOptions {
  baseUrl: string;
  apiToken?: string;
  fetch?: typeof fetch;
}
```

- [ ] **Step 9: Implement `packages/cascade-sdk/src/client.ts`**

```typescript
import { CascadeApiError } from './errors.js';
import type { ClientOptions, HealthResponse, RunSummary, TriggerInput, Workflow } from './types.js';

export class CascadeClient {
  private readonly baseUrl: string;
  private readonly apiToken?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: ClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    if (opts.apiToken !== undefined) this.apiToken = opts.apiToken;
    this.fetchImpl = opts.fetch ?? globalThis.fetch;
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('GET', '/health');
  }

  async listWorkflows(): Promise<Workflow[]> {
    return this.request<Workflow[]>('GET', '/workflows');
  }

  async triggerWorkflow(workflowId: string, input: TriggerInput): Promise<RunSummary> {
    return this.request<RunSummary>('POST', `/workflows/${workflowId}/runs`, input);
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.apiToken !== undefined) headers.Authorization = `Bearer ${this.apiToken}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const init: RequestInit = { method, headers };
    if (body !== undefined) init.body = JSON.stringify(body);

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, init);
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new CascadeApiError(`expected JSON, got ${contentType}`, response.status);
    }
    const data = (await response.json()) as unknown;
    if (!response.ok) {
      throw new CascadeApiError(`HTTP ${response.status.toString()}`, response.status, data);
    }
    return data as T;
  }
}
```

- [ ] **Step 10: Implement `packages/cascade-sdk/src/index.ts`**

```typescript
export { CascadeClient } from './client.js';
export { CascadeApiError } from './errors.js';
export type { ClientOptions, HealthResponse, RunSummary, TriggerInput, Workflow } from './types.js';
```

- [ ] **Step 11: Run tests at 100% coverage**

```bash
pnpm --filter @tierfall/cascade-sdk test
```

Expected: all green at 100%. If `request()`'s `Content-Type` branch is uncovered, add a test that triggers a POST without a body — the test suite above already does this implicitly via `health()` (no body) vs `triggerWorkflow()` (with body), so the branch should be covered.

- [ ] **Step 12: Build**

```bash
pnpm --filter @tierfall/cascade-sdk build
```

- [ ] **Step 13: Write `packages/cascade-sdk/CLAUDE.md`**

```markdown
# cascade-sdk — Claude context

**Purpose:** Typed fetch-based client for the Cascade HTTP API. Platform-neutral —
the same module runs in Node 24, Bun, Deno, browsers, and React Native.

## What lives here

- `src/client.ts` — `CascadeClient` class with `health`, `listWorkflows`, `triggerWorkflow`.
  More methods land as new API endpoints are added (one PR per endpoint pair).
- `src/types.ts` — request/response types. Re-exports `Workflow` from `@tierfall/cascade-core`
  so SDK consumers don't have to import two packages for the basic types.
- `src/errors.ts` — `CascadeApiError`. Consumers `instanceof`-check.

## Consumers

- `apps/cascade-web` — UI calls the API through this client.
- `apps/cascade-mobile` — RN-boundary smoke test imports this to prove portability.
- `packages/cascade-cli` — uses this for `cascade run`.
- Third-party scripts via `npm install @tierfall/cascade-sdk`.

## Hard rules

- NO DOM, NO Node-only, NO React imports. Uses global `fetch` (Node 24+ has it). The
  `fetch` parameter on `ClientOptions` lets tests inject a mock without polyfills.
- 100% coverage threshold.
- Every method returns a fully-typed result; we never expose untyped responses to consumers.
```

- [ ] **Step 14: Commit**

```bash
git add packages/cascade-sdk/
git commit -m "$(cat <<'EOF'
feat(sdk): scaffold cascade-sdk fetch-based client

- CascadeClient: health(), listWorkflows(), triggerWorkflow() — three methods to start.
- CascadeApiError thrown on non-JSON responses AND non-2xx statuses (with body preserved).
- Bearer-token auth opt-in via constructor; injectable fetch for testing without DOM polyfills.
- Re-exports Workflow type from @tierfall/cascade-core so consumers can `import { Workflow }
  from '@tierfall/cascade-sdk'` directly.
- 100% coverage; platform-neutral (no DOM, no Node:* imports, no React).

Spec ref: §3.2 (RN-portability boundary), §4.5 (coverage), §6 (auto-generated OpenAPI
parity will be verified in a later PR against cascade-api).
EOF
)"
```

---

## Task 7: Enforce platform-neutral boundary in ESLint + CI

**Files:**
- Modify: `eslint.config.mjs` (add `no-restricted-imports` rule scoped via overrides)
- Create: `tools/rn-target-tsconfig.json` (minimal RN-compatible tsconfig used by the CI smoke job)
- Create: `tools/check-platform-neutral.mjs` (Node script invoked from CI)
- Modify: nothing in `nx.json` (the CI job runs the script directly)

This task makes constraint #5 of the kickoff concrete: lint blocks DOM/Node imports in the three platform-neutral packages, and a CI smoke job builds them against a minimal RN-target tsconfig to catch type-level leaks (`document`, `window`, `process.env`, etc.) the lint rule can't see.

- [ ] **Step 1: Modify `eslint.config.mjs` — add overrides for the three platform-neutral packages**

Append after the existing test-files block:

```javascript
  // Platform-neutral packages: ban DOM/Node/React imports.
  // Enforces spec §3.2: cascade-tokens, cascade-core, cascade-sdk must remain pure TS
  // with zero web- or Node-only dependencies.
  {
    files: [
      'packages/cascade-tokens/src/**/*.ts',
      'packages/cascade-core/src/**/*.ts',
      'packages/cascade-sdk/src/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'platform-neutral packages cannot import react' },
            { name: 'react-dom', message: 'platform-neutral packages cannot import react-dom' },
            { name: 'next', message: 'platform-neutral packages cannot import next' },
            { name: 'next/server', message: 'platform-neutral packages cannot import next' },
            { name: 'fs', message: 'platform-neutral packages cannot import node:fs' },
            { name: 'path', message: 'platform-neutral packages cannot import node:path' },
            { name: 'process', message: 'platform-neutral packages cannot import node:process' },
            { name: 'child_process', message: 'platform-neutral packages cannot import node:child_process' },
          ],
          patterns: [
            { group: ['node:*'], message: 'platform-neutral packages cannot import node:* modules' },
            { group: ['react-native', 'react-native/*'], message: 'tokens/core/sdk must be cross-platform; do not import RN here' },
            { group: ['@nestjs/*'], message: 'platform-neutral packages cannot import NestJS' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'platform-neutral packages cannot reference window' },
        { name: 'document', message: 'platform-neutral packages cannot reference document' },
        { name: 'navigator', message: 'platform-neutral packages cannot reference navigator' },
        { name: '__dirname', message: 'platform-neutral packages cannot reference __dirname (Node-only)' },
        { name: '__filename', message: 'platform-neutral packages cannot reference __filename (Node-only)' },
      ],
    },
  },
```

- [ ] **Step 2: Write `tools/rn-target-tsconfig.json`** — a tsconfig that mimics the React Native target so type-checking catches DOM/Node leaks

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": [],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "jsx": "react-jsx"
  },
  "include": [
    "../packages/cascade-tokens/src/**/*.ts",
    "../packages/cascade-core/src/**/*.ts",
    "../packages/cascade-sdk/src/**/*.ts"
  ]
}
```

Note the `lib` array OMITS `DOM` and `DOM.Iterable`. `types: []` keeps `@types/node` off the include path, so any `process`, `Buffer`, `__dirname`, `fs` reference fails type-check.

- [ ] **Step 3: Write `tools/check-platform-neutral.mjs`** — runs the lint pass + the RN-target type-check

```javascript
#!/usr/bin/env node
import { execSync } from 'node:child_process';

const lintTargets = [
  'packages/cascade-tokens/src',
  'packages/cascade-core/src',
  'packages/cascade-sdk/src',
];

console.log('==> ESLint: platform-neutral import boundary');
execSync(`pnpm exec eslint --max-warnings=0 ${lintTargets.join(' ')}`, { stdio: 'inherit' });

console.log('==> tsc: RN-target build (lib excludes DOM)');
execSync('pnpm exec tsc --project tools/rn-target-tsconfig.json', { stdio: 'inherit' });

console.log('platform-neutral boundary OK');
```

Make it executable:

```bash
chmod +x tools/check-platform-neutral.mjs
```

- [ ] **Step 4: Verify the lint rule actually blocks a violation**

Write a temporary "tripwire" file:

```bash
cat > packages/cascade-core/src/__tripwire.ts <<'EOF'
import { readFileSync } from 'node:fs';
export const broken = readFileSync;
EOF
pnpm exec eslint packages/cascade-core/src/__tripwire.ts
```

Expected: ESLint exits non-zero with the message `platform-neutral packages cannot import node:fs`. Then remove the tripwire:

```bash
rm packages/cascade-core/src/__tripwire.ts
```

- [ ] **Step 5: Verify the RN-target type-check actually blocks a DOM reference**

Write a temporary tripwire:

```bash
cat > packages/cascade-tokens/src/__tripwire.ts <<'EOF'
export const ua = navigator.userAgent;
EOF
pnpm exec tsc --project tools/rn-target-tsconfig.json
```

Expected: tsc errors with `Cannot find name 'navigator'` (because the lib excludes DOM). Remove the tripwire:

```bash
rm packages/cascade-tokens/src/__tripwire.ts
```

- [ ] **Step 6: Run the full check script**

```bash
node tools/check-platform-neutral.mjs
```

Expected: prints "platform-neutral boundary OK".

- [ ] **Step 7: Commit**

```bash
git add eslint.config.mjs tools/rn-target-tsconfig.json tools/check-platform-neutral.mjs
git commit -m "$(cat <<'EOF'
chore(eslint): enforce platform-neutral boundary on tokens, core, sdk

Two layers of enforcement per spec §3.2 and constraint #5:

1. ESLint no-restricted-imports + no-restricted-globals on
   packages/cascade-{tokens,core,sdk}/src — blocks react, react-dom, next,
   node:*, react-native, @nestjs/*, plus window/document/navigator/__dirname.
2. tools/rn-target-tsconfig.json: a minimal tsconfig that omits DOM lib AND
   @types/node, so the three packages type-check as if compiled for React Native.
   tools/check-platform-neutral.mjs runs both layers; CI invokes it as a
   dedicated job (added in Task 18).

Tripwire-tested: a `node:fs` import in cascade-core trips ESLint; a `navigator`
reference in cascade-tokens trips the RN-target tsc.

The boundary is what keeps the future `apps/cascade-mobile` ship (post-v1.0)
from being a rewrite.
EOF
)"
```

---

## Task 8: Scaffold `cascade-ui` with Tailwind preset and Radix primitives

**Files:**
- Create: `packages/cascade-ui/{package.json,tsconfig.json,project.json,jest.config.ts,tsup.config.ts,tailwind-preset.ts,CLAUDE.md}`
- Create: `packages/cascade-ui/src/{index.ts,utils.ts,Button.tsx,TierBadge.tsx}`
- Create: `packages/cascade-ui/test/{Button.test.tsx,TierBadge.test.tsx,preset.test.ts}`
- Create: `packages/cascade-ui/test/setup.ts`

Coverage threshold 95% (spec §4.5 amended after Phase 1: cascade-ui is a library, not an app).
This package is web-only; it's NOT tagged `scope:platform-neutral`. RN consumers go through `cascade-tokens` directly.

- [ ] **Step 1: Create skeleton + write `package.json`**

```bash
mkdir -p packages/cascade-ui/src packages/cascade-ui/test
```

```json
{
  "name": "@tierfall/cascade-ui",
  "version": "0.0.0",
  "description": "Cascade design system: Radix UI primitives + Tailwind classes derived from cascade-tokens. shadcn-style — components are owned in-repo.",
  "license": "SEE LICENSE IN ../../LICENSE",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    },
    "./tailwind-preset": {
      "import": { "types": "./dist/tailwind-preset.d.ts", "default": "./dist/tailwind-preset.js" },
      "require": { "types": "./dist/tailwind-preset.d.cts", "default": "./dist/tailwind-preset.cjs" }
    },
    "./package.json": "./package.json"
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "node --experimental-vm-modules ../../node_modules/jest/bin/jest.js --coverage",
    "lint": "eslint --max-warnings=0 src test",
    "typecheck": "tsc --noEmit --pretty false"
  },
  "dependencies": {
    "@radix-ui/react-slot": "1.1.1",
    "@tierfall/cascade-tokens": "workspace:*",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "tailwind-merge": "2.6.0"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0",
    "tailwindcss": ">=3.4.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "6.6.3",
    "@testing-library/react": "16.1.0",
    "@types/react": "19.0.7",
    "@types/react-dom": "19.0.3",
    "jest-environment-jsdom": "29.7.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "tailwindcss": "3.4.17"
  },
  "publishConfig": { "access": "public" }
}
```

- [ ] **Step 2: Write `packages/cascade-ui/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": ".",
    "composite": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "tailwind-preset.ts"],
  "exclude": ["dist", "node_modules", "test", "**/*.test.ts", "**/*.test.tsx"]
}
```

- [ ] **Step 3: Write `packages/cascade-ui/project.json`**

```json
{
  "name": "cascade-ui",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/cascade-ui/src",
  "projectType": "library",
  "tags": ["scope:web", "type:design-system"],
  "targets": {
    "build": { "executor": "nx:run-script", "options": { "script": "build" }, "outputs": ["{projectRoot}/dist"] },
    "test": { "executor": "nx:run-script", "options": { "script": "test" } },
    "lint": { "executor": "nx:run-script", "options": { "script": "lint" } },
    "typecheck": { "executor": "nx:run-script", "options": { "script": "typecheck" } }
  }
}
```

- [ ] **Step 4: Write `packages/cascade-ui/tsup.config.ts`**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'tailwind-preset.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  external: ['react', 'react-dom', 'tailwindcss'],
});
```

- [ ] **Step 5: Write `packages/cascade-ui/jest.config.ts`** — coverage threshold 95% (spec §4.5 amended)

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  setupFilesAfterEach: ['<rootDir>/test/setup.ts'],
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverageFrom: ['src/**/*.ts', 'src/**/*.tsx', 'tailwind-preset.ts', '!src/**/*.d.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: { statements: 95, branches: 95, functions: 95, lines: 95 },
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true, tsconfig: { module: 'ESNext', jsx: 'react-jsx' } }],
  },
};

export default config;
```

- [ ] **Step 6: Write `packages/cascade-ui/test/setup.ts`**

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 7: Write the failing test for `tailwind-preset`** (`packages/cascade-ui/test/preset.test.ts`)

```typescript
import { describe, expect, it } from '@jest/globals';
import preset from '../tailwind-preset.js';

describe('tailwind-preset', () => {
  it('exposes colors derived from cascade-tokens', () => {
    expect(preset.theme?.extend?.colors).toBeDefined();
    const colors = preset.theme?.extend?.colors as Record<string, unknown>;
    expect(colors['tier-0']).toMatch(/^#[0-9a-f]{6}$/i);
    expect(colors['tier-4']).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('exposes spacing derived from cascade-tokens', () => {
    const spacing = preset.theme?.extend?.spacing as Record<string, string>;
    expect(spacing['cascade-4']).toMatch(/^\d+(\.\d+)?rem$/);
  });

  it('exposes font-families derived from cascade-tokens', () => {
    const fontFamily = preset.theme?.extend?.fontFamily as Record<string, unknown>;
    expect(fontFamily['sans']).toContain('Inter');
  });

  it('enables darkMode class strategy', () => {
    expect(preset.darkMode).toBe('class');
  });
});
```

- [ ] **Step 8: Write the failing tests for `Button`** (`packages/cascade-ui/test/Button.test.tsx`)

```typescript
import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../src/Button.js';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('fires onClick when clicked', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders disabled state and blocks clicks', () => {
    const onClick = jest.fn();
    render(<Button disabled onClick={onClick}>Disabled</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies variant classes for primary, secondary, and ghost', () => {
    const { rerender, container } = render(<Button variant="primary">P</Button>);
    expect(container.firstChild).toHaveClass('bg-tier-2');
    rerender(<Button variant="secondary">S</Button>);
    expect(container.firstChild).toHaveClass('bg-transparent');
    rerender(<Button variant="ghost">G</Button>);
    expect(container.firstChild).toHaveClass('bg-transparent');
  });

  it('forwards arbitrary props (aria-label) onto the underlying button', () => {
    render(<Button aria-label="custom">x</Button>);
    expect(screen.getByLabelText('custom')).toBeInTheDocument();
  });

  it('renders as a Slot when asChild=true', () => {
    render(
      <Button asChild>
        <a href="/somewhere">Link</a>
      </Button>,
    );
    expect(screen.getByRole('link', { name: 'Link' })).toHaveAttribute('href', '/somewhere');
  });
});
```

- [ ] **Step 9: Write the failing tests for `TierBadge`** (`packages/cascade-ui/test/TierBadge.test.tsx`)

```typescript
import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { TierBadge } from '../src/TierBadge.js';

describe('TierBadge', () => {
  it('renders the tier number', () => {
    render(<TierBadge tier={2} />);
    expect(screen.getByText('Tier 2')).toBeInTheDocument();
  });

  it('uses the tier color from cascade-tokens', () => {
    const { container } = render(<TierBadge tier={3} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.style.backgroundColor).toMatch(/^rgb/);
  });

  it('throws on out-of-range tier', () => {
    expect(() => render(<TierBadge tier={5 as 0} />)).toThrow();
  });

  it('throws on negative tier', () => {
    expect(() => render(<TierBadge tier={-1 as 0} />)).toThrow();
  });
});
```

- [ ] **Step 10: Run tests, verify failure**

```bash
pnpm --filter @tierfall/cascade-ui test
```

Expected: module resolution failures.

- [ ] **Step 11: Implement `packages/cascade-ui/src/utils.ts`**

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 12: Implement `packages/cascade-ui/src/Button.tsx`**

```typescript
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from './utils.js';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tier-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-tier-2 text-white hover:bg-tier-3',
        secondary: 'bg-transparent border border-neutral-border text-foreground hover:bg-neutral-muted',
        ghost: 'bg-transparent text-foreground hover:bg-neutral-muted',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : 'button';
    return (
      <Component
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
```

- [ ] **Step 13: Implement `packages/cascade-ui/src/TierBadge.tsx`**

```typescript
import { colors } from '@tierfall/cascade-tokens';
import { type CSSProperties } from 'react';
import { cn } from './utils.js';

export interface TierBadgeProps {
  tier: 0 | 1 | 2 | 3 | 4;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps): JSX.Element {
  if (tier < 0 || tier > 4 || !Number.isInteger(tier)) {
    throw new RangeError(`TierBadge: tier must be 0..4, got ${String(tier)}`);
  }
  const tierColor = colors.tier[tier];
  if (tierColor === undefined) {
    throw new RangeError(`TierBadge: no color for tier ${tier.toString()}`);
  }
  const style: CSSProperties = { backgroundColor: tierColor };
  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white',
        className,
      )}
    >
      Tier {tier}
    </span>
  );
}
```

- [ ] **Step 14: Implement `packages/cascade-ui/src/index.ts`**

```typescript
export { Button, type ButtonProps } from './Button.js';
export { TierBadge, type TierBadgeProps } from './TierBadge.js';
export { cn } from './utils.js';
```

- [ ] **Step 15: Implement `packages/cascade-ui/tailwind-preset.ts`** (consumes cascade-tokens)

```typescript
import { colors, motion, radii, spacing, typography } from '@tierfall/cascade-tokens';
import type { Config } from 'tailwindcss';

const tierColors = colors.tier.reduce<Record<string, string>>((acc, hex, idx) => {
  acc[`tier-${idx.toString()}`] = hex;
  return acc;
}, {});

const spacingScale = Object.entries(spacing).reduce<Record<string, string>>((acc, [k, v]) => {
  acc[`cascade-${k}`] = v;
  return acc;
}, {});

const preset: Config = {
  content: [],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ...tierColors,
        background: { light: colors.neutral.background.light, dark: colors.neutral.background.dark },
        foreground: colors.neutral.foreground.light,
        'neutral-border': colors.neutral.border.light,
        'neutral-muted': colors.neutral.muted.light,
        success: colors.semantic.success,
        warning: colors.semantic.warning,
        danger: colors.semantic.danger,
        info: colors.semantic.info,
      },
      spacing: spacingScale,
      fontFamily: {
        sans: [typography.fontFamily.sans],
        serif: [typography.fontFamily.serif],
        mono: [typography.fontFamily.mono],
      },
      fontSize: {
        caption: typography.fontSize.caption,
        body: typography.fontSize.body,
        h3: typography.fontSize.h3,
        h2: typography.fontSize.h2,
        h1: typography.fontSize.h1,
        display: typography.fontSize.display,
      },
      borderRadius: radii,
      transitionDuration: {
        fast: motion.duration.fast,
        normal: motion.duration.normal,
        slow: motion.duration.slow,
      },
      transitionTimingFunction: motion.easing,
    },
  },
  plugins: [],
};

export default preset;
```

- [ ] **Step 16: Run tests; verify pass at 95% coverage**

```bash
pnpm --filter @tierfall/cascade-ui test
```

Expected: all suites pass, coverage ≥ 95% on every metric. If branches in `TierBadge` or `Button` are missed, add the missing edge-case test rather than lowering the gate.

- [ ] **Step 17: Build**

```bash
pnpm --filter @tierfall/cascade-ui build
```

Expected: dist/ contains index + tailwind-preset entries, both ESM + CJS.

- [ ] **Step 18: Write `packages/cascade-ui/CLAUDE.md`**

```markdown
# cascade-ui — Claude context

**Purpose:** Cascade's design system. Radix UI primitives + Tailwind classes, shadcn-style
(components owned in-repo, not imported from a third-party design system). Every class
in every component resolves to a token in `@tierfall/cascade-tokens`.

## What lives here

- `tailwind-preset.ts` — Tailwind preset consumed by `cascade-web` (and any future web app).
  Emits theme entries from `cascade-tokens` directly. New tokens MUST land in this preset
  in the same PR.
- `src/Button.tsx` — first primitive. Variants: primary / secondary / ghost. Sizes: sm / md / lg.
  Supports Radix Slot for `asChild` polymorphism.
- `src/TierBadge.tsx` — domain primitive showing a tier 0–4 badge in the appropriate ramp color.
  Throws on out-of-range tier (we catch this at the type level via the `0 | 1 | 2 | 3 | 4` union,
  but the runtime check is the safety net).
- `src/utils.ts` — `cn()` helper (clsx + tailwind-merge).

## Consumers

- `apps/cascade-web` — extends the preset in its own `tailwind.config.ts`.
- Third-party consumers via `import preset from '@tierfall/cascade-ui/tailwind-preset'`.

## Hard rules

- **No hardcoded colors or spacing in components.** All visual values go through tokens.
- **shadcn-style:** when this evolves, we copy a third-party component INTO this repo and
  adapt it; we don't `import { Button } from 'some-other-design-system'`.
- Coverage threshold 95% (spec §4.5 amended — library tier, not app tier).
- Every component is keyboard-accessible (Radix contract — we layer on top of Radix primitives,
  not below).
```

- [ ] **Step 19: Commit**

```bash
git add packages/cascade-ui/
git commit -m "$(cat <<'EOF'
feat(ui): scaffold cascade-ui with Tailwind preset and Radix primitives

- tailwind-preset.ts: emits Tailwind theme from cascade-tokens — colors (tier ramp,
  neutral, semantic), spacing (cascade-N keys), fontFamily, fontSize, borderRadius,
  transitionDuration, transitionTimingFunction. darkMode: 'class' enabled.
- Button: Radix Slot + class-variance-authority variants (primary/secondary/ghost,
  sm/md/lg). asChild polymorphism supported.
- TierBadge: domain primitive — tier 0..4 with background color pulled from
  cascade-tokens.colors.tier[]. Runtime range check + RangeError on violation.
- cn() helper combines clsx + tailwind-merge for class-deduplication.
- 95% coverage threshold (spec §4.5 amended for library tier).
- Builds dual entries: package main and ./tailwind-preset subpath.

shadcn-style: every component owned here, none imported from third-party design systems.
EOF
)"
```

---

## Task 9: Scaffold `cascade-nodes` registry

**Files:**
- Create: `packages/cascade-nodes/{package.json,tsconfig.json,project.json,jest.config.ts,tsup.config.ts,CLAUDE.md}`
- Create: `packages/cascade-nodes/src/{index.ts,registry.ts,types.ts}`
- Create: `packages/cascade-nodes/src/node-types/{llm,conditional,transform,http}.ts`
- Create: `packages/cascade-nodes/test/{registry.test.ts,llm.test.ts,conditional.test.ts,transform.test.ts,http.test.ts}`

Coverage threshold 95% per spec §4.5. v0.1 ships **stubs** that satisfy the registry contract but do not perform real I/O — the v0.1 executor wires them up to TierFall and HTTP in later PRs (tracked in the v0.1 backlog).

- [ ] **Step 1: Skeleton + `package.json`**

```bash
mkdir -p packages/cascade-nodes/src/node-types packages/cascade-nodes/test
```

```json
{
  "name": "@tierfall/cascade-nodes",
  "version": "0.0.0",
  "description": "Cascade node-type registry. Server-side handlers + client-side metadata for LLM, Conditional, Transform, HTTP nodes.",
  "license": "SEE LICENSE IN ../../LICENSE",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "node --experimental-vm-modules ../../node_modules/jest/bin/jest.js --coverage",
    "lint": "eslint --max-warnings=0 src test",
    "typecheck": "tsc --noEmit --pretty false"
  },
  "dependencies": {
    "@tierfall/cascade-core": "workspace:*",
    "@tierfall/core": "^0.1.0",
    "zod": "3.24.1"
  },
  "publishConfig": { "access": "public" }
}
```

- [ ] **Step 2: Write `packages/cascade-nodes/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules", "test", "**/*.test.ts"]
}
```

- [ ] **Step 3: Write `packages/cascade-nodes/project.json`** — tagged `scope:server`

```json
{
  "name": "cascade-nodes",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/cascade-nodes/src",
  "projectType": "library",
  "tags": ["scope:server", "type:domain"],
  "targets": {
    "build": { "executor": "nx:run-script", "options": { "script": "build" }, "outputs": ["{projectRoot}/dist"] },
    "test": { "executor": "nx:run-script", "options": { "script": "test" } },
    "lint": { "executor": "nx:run-script", "options": { "script": "lint" } },
    "typecheck": { "executor": "nx:run-script", "options": { "script": "typecheck" } }
  }
}
```

- [ ] **Step 4: Write `packages/cascade-nodes/tsup.config.ts`**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  treeshake: true,
});
```

- [ ] **Step 5: Write `packages/cascade-nodes/jest.config.ts`** — 95% threshold (library tier)

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: { statements: 95, branches: 95, functions: 95, lines: 95 },
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: { module: 'ESNext' } }],
  },
};

export default config;
```

- [ ] **Step 6: Write failing tests** (each node type and the registry get their own test file; example for registry below; the four node-type test files mirror this shape with their own input/output assertions)

`packages/cascade-nodes/test/registry.test.ts`:

```typescript
import { describe, expect, it } from '@jest/globals';
import { nodeRegistry, getNodeHandler, NODE_TYPE_KEYS } from '../src/index.js';

describe('nodeRegistry', () => {
  it('exposes handlers for all four v0.1 node types', () => {
    expect(NODE_TYPE_KEYS).toEqual(['llm', 'conditional', 'transform', 'http']);
    NODE_TYPE_KEYS.forEach((k) => {
      expect(nodeRegistry[k]).toBeDefined();
      expect(typeof nodeRegistry[k].execute).toBe('function');
      expect(typeof nodeRegistry[k].validateConfig).toBe('function');
    });
  });

  it('getNodeHandler returns the registered handler', () => {
    expect(getNodeHandler('http')).toBe(nodeRegistry.http);
  });

  it('getNodeHandler throws on unknown type', () => {
    expect(() => getNodeHandler('nope' as 'http')).toThrow(/unknown node type/i);
  });
});
```

`packages/cascade-nodes/test/llm.test.ts`:

```typescript
import { describe, expect, it } from '@jest/globals';
import { llmHandler } from '../src/node-types/llm.js';

describe('llmHandler', () => {
  it('validateConfig accepts a minimal valid config', () => {
    expect(llmHandler.validateConfig({ prompt: 'hi', policyOverride: undefined }).success).toBe(true);
  });

  it('validateConfig rejects a missing prompt', () => {
    expect(llmHandler.validateConfig({}).success).toBe(false);
  });

  it('execute returns a stub completion for v0.1 (real wiring is a backlog issue)', async () => {
    const result = await llmHandler.execute({ prompt: 'hello' }, { runId: 'r1', nodeId: 'n1' });
    expect(result.kind).toBe('stub');
    expect(typeof result.output).toBe('string');
  });
});
```

`packages/cascade-nodes/test/conditional.test.ts`:

```typescript
import { describe, expect, it } from '@jest/globals';
import { conditionalHandler } from '../src/node-types/conditional.js';

describe('conditionalHandler', () => {
  it('validateConfig accepts a non-empty expression', () => {
    expect(conditionalHandler.validateConfig({ expression: 'x > 1' }).success).toBe(true);
  });

  it('validateConfig rejects an empty expression', () => {
    expect(conditionalHandler.validateConfig({ expression: '' }).success).toBe(false);
  });

  it('execute evaluates the expression against context.input (truthy -> success)', async () => {
    const result = await conditionalHandler.execute(
      { expression: 'input.x > 5' },
      { runId: 'r', nodeId: 'n', input: { x: 10 } },
    );
    expect(result.kind).toBe('branch');
    expect(result.branch).toBe('true');
  });

  it('execute returns branch=false on falsy evaluation', async () => {
    const result = await conditionalHandler.execute(
      { expression: 'input.x > 5' },
      { runId: 'r', nodeId: 'n', input: { x: 2 } },
    );
    expect(result.branch).toBe('false');
  });
});
```

`packages/cascade-nodes/test/transform.test.ts`:

```typescript
import { describe, expect, it } from '@jest/globals';
import { transformHandler } from '../src/node-types/transform.js';

describe('transformHandler', () => {
  it('applies a jsonata-like expression (stub for v0.1: passthrough)', async () => {
    const result = await transformHandler.execute(
      { expression: '$' },
      { runId: 'r', nodeId: 'n', input: { a: 1 } },
    );
    expect(result.output).toEqual({ a: 1 });
  });

  it('rejects empty expression', () => {
    expect(transformHandler.validateConfig({ expression: '' }).success).toBe(false);
  });
});
```

`packages/cascade-nodes/test/http.test.ts`:

```typescript
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { httpHandler } from '../src/node-types/http.js';

describe('httpHandler', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  it('validateConfig rejects a missing url', () => {
    expect(httpHandler.validateConfig({ method: 'GET' }).success).toBe(false);
  });

  it('validateConfig rejects a malformed url', () => {
    expect(httpHandler.validateConfig({ url: 'not-a-url' }).success).toBe(false);
  });

  it('execute issues a request to the configured url and returns the body', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    const result = await httpHandler.execute(
      { url: 'http://example.com', method: 'GET' },
      { runId: 'r', nodeId: 'n' },
    );
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ ok: true });
  });

  it('execute returns the failing status without throwing on 4xx/5xx (caller decides)', async () => {
    fetchMock.mockResolvedValueOnce(new Response('boom', { status: 500, headers: { 'content-type': 'text/plain' } }));
    const result = await httpHandler.execute(
      { url: 'http://example.com', method: 'GET' },
      { runId: 'r', nodeId: 'n' },
    );
    expect(result.status).toBe(500);
  });
});
```

- [ ] **Step 7: Verify failure**

```bash
pnpm --filter @tierfall/cascade-nodes test
```

- [ ] **Step 8: Implement `packages/cascade-nodes/src/types.ts`**

```typescript
import type { z } from 'zod';

export interface ExecutionContext {
  runId: string;
  nodeId: string;
  input?: Record<string, unknown>;
}

export type NodeResult =
  | { kind: 'success'; output: unknown }
  | { kind: 'branch'; branch: 'true' | 'false' }
  | { kind: 'http'; status: number; body: unknown }
  | { kind: 'stub'; output: string };

export interface NodeHandler<C = Record<string, unknown>> {
  validateConfig(config: unknown): { success: true; data: C } | { success: false; error: z.ZodError };
  execute(config: C, ctx: ExecutionContext): Promise<NodeResult>;
}
```

- [ ] **Step 9: Implement each node-type stub**

`packages/cascade-nodes/src/node-types/llm.ts`:

```typescript
import { z } from 'zod';
import type { NodeHandler } from '../types.js';

const ConfigSchema = z.object({
  prompt: z.string().min(1),
  policyOverride: z.unknown().optional(),
});

export const llmHandler: NodeHandler<z.infer<typeof ConfigSchema>> = {
  validateConfig: (config) => {
    const parsed = ConfigSchema.safeParse(config);
    return parsed.success ? { success: true, data: parsed.data } : { success: false, error: parsed.error };
  },
  execute: async (_config, _ctx) =>
    Promise.resolve({ kind: 'stub', output: '[llm stub — wired to TierFall in v0.1 backlog]' }),
};
```

`packages/cascade-nodes/src/node-types/conditional.ts`:

```typescript
import { z } from 'zod';
import type { NodeHandler } from '../types.js';

const ConfigSchema = z.object({ expression: z.string().min(1) });

export const conditionalHandler: NodeHandler<z.infer<typeof ConfigSchema>> = {
  validateConfig: (config) => {
    const parsed = ConfigSchema.safeParse(config);
    return parsed.success ? { success: true, data: parsed.data } : { success: false, error: parsed.error };
  },
  execute: async (config, ctx) => {
    const input = ctx.input ?? {};
    // v0.1 stub: only supports `input.X (op) literal` form. Full expression engine
    // is a v0.1 backlog issue (use jexl or expr-eval, decided in implementation PR).
    const truthy = evaluateSimple(config.expression, input);
    return { kind: 'branch', branch: truthy ? 'true' : 'false' };
  },
};

function evaluateSimple(expr: string, input: Record<string, unknown>): boolean {
  const match = /^input\.(\w+)\s*(>|<|>=|<=|===|!==)\s*(\d+(?:\.\d+)?)$/u.exec(expr);
  if (!match) return false;
  const [, key, op, rhsStr] = match;
  if (key === undefined || op === undefined || rhsStr === undefined) return false;
  const lhsRaw = input[key];
  if (typeof lhsRaw !== 'number') return false;
  const rhs = Number(rhsStr);
  switch (op) {
    case '>': return lhsRaw > rhs;
    case '<': return lhsRaw < rhs;
    case '>=': return lhsRaw >= rhs;
    case '<=': return lhsRaw <= rhs;
    case '===': return lhsRaw === rhs;
    case '!==': return lhsRaw !== rhs;
    default: return false;
  }
}
```

`packages/cascade-nodes/src/node-types/transform.ts`:

```typescript
import { z } from 'zod';
import type { NodeHandler } from '../types.js';

const ConfigSchema = z.object({ expression: z.string().min(1) });

export const transformHandler: NodeHandler<z.infer<typeof ConfigSchema>> = {
  validateConfig: (config) => {
    const parsed = ConfigSchema.safeParse(config);
    return parsed.success ? { success: true, data: parsed.data } : { success: false, error: parsed.error };
  },
  execute: async (_config, ctx) =>
    // v0.1 stub: passthrough. jsonata wiring is a backlog issue.
    Promise.resolve({ kind: 'success', output: ctx.input ?? {} }),
};
```

`packages/cascade-nodes/src/node-types/http.ts`:

```typescript
import { z } from 'zod';
import type { NodeHandler } from '../types.js';

const ConfigSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
});

export const httpHandler: NodeHandler<z.infer<typeof ConfigSchema>> = {
  validateConfig: (config) => {
    const parsed = ConfigSchema.safeParse(config);
    return parsed.success ? { success: true, data: parsed.data } : { success: false, error: parsed.error };
  },
  execute: async (config, _ctx) => {
    const init: RequestInit = { method: config.method };
    if (config.headers) init.headers = config.headers;
    if (config.body !== undefined) init.body = JSON.stringify(config.body);
    const response = await fetch(config.url, init);
    const contentType = response.headers.get('content-type') ?? '';
    const body: unknown = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
    return { kind: 'http', status: response.status, body };
  },
};
```

- [ ] **Step 10: Implement `packages/cascade-nodes/src/registry.ts`**

```typescript
import { conditionalHandler } from './node-types/conditional.js';
import { httpHandler } from './node-types/http.js';
import { llmHandler } from './node-types/llm.js';
import { transformHandler } from './node-types/transform.js';
import type { NodeHandler } from './types.js';

export const nodeRegistry = {
  llm: llmHandler,
  conditional: conditionalHandler,
  transform: transformHandler,
  http: httpHandler,
} as const;

export const NODE_TYPE_KEYS = ['llm', 'conditional', 'transform', 'http'] as const;
export type NodeTypeKey = (typeof NODE_TYPE_KEYS)[number];

export function getNodeHandler(type: NodeTypeKey): NodeHandler {
  const handler = nodeRegistry[type];
  if (!handler) throw new Error(`unknown node type: ${type}`);
  return handler as NodeHandler;
}
```

- [ ] **Step 11: Implement `packages/cascade-nodes/src/index.ts`**

```typescript
export { nodeRegistry, getNodeHandler, NODE_TYPE_KEYS, type NodeTypeKey } from './registry.js';
export type { ExecutionContext, NodeHandler, NodeResult } from './types.js';
export { llmHandler } from './node-types/llm.js';
export { conditionalHandler } from './node-types/conditional.js';
export { transformHandler } from './node-types/transform.js';
export { httpHandler } from './node-types/http.js';
```

- [ ] **Step 12: Run tests; verify 95% coverage**

```bash
pnpm --filter @tierfall/cascade-nodes test
```

If any branches of `evaluateSimple` (the conditional helper) are uncovered, add test cases for each operator (`<`, `>=`, `<=`, `===`, `!==`) and for the malformed-expression fallback.

- [ ] **Step 13: Build + commit**

```bash
pnpm --filter @tierfall/cascade-nodes build
git add packages/cascade-nodes/
git commit -m "$(cat <<'EOF'
feat(nodes): scaffold cascade-nodes registry

Four v0.1 node types (per spec §3.1 and the kickoff scope):

- llm:         stub returning a placeholder string. Real wiring to TierFall is a
               backlog issue (issue B-LLM-WIRE).
- conditional: evaluates a constrained `input.X (op) literal` expression. Full
               expression engine (jexl/expr-eval) is backlog issue B-COND-ENGINE.
- transform:   passthrough stub. jsonata wiring is backlog issue B-TRANSFORM-JSONATA.
- http:        real fetch-based handler. Returns status + body; does not throw on
               4xx/5xx (caller decides). Validates URL syntax via zod.

NodeHandler<C> contract: validateConfig (Zod) + execute (typed config + context).
NodeResult discriminated union: success | branch | http | stub.
95% coverage threshold per spec §4.5.

Depends on @tierfall/core@^0.1.0 (declared but not yet imported — landed in the
LLM-wire backlog issue).
EOF
)"
```

---

## Task 10: Scaffold `cascade-compiler` skeleton

**Files:**
- Create: `packages/cascade-compiler/{package.json,tsconfig.json,project.json,jest.config.ts,tsup.config.ts,CLAUDE.md}`
- Create: `packages/cascade-compiler/src/{index.ts,compile.ts,emit.ts}`
- Create: `packages/cascade-compiler/test/{compile.test.ts,emit.test.ts}`

Coverage threshold 95%. v0.1 ships a **trivial emitter** that consumes a validated `Workflow` and emits a `.ts` file with a `main()` that re-runs the workflow via `cascade-sdk`. Real compile-to-typed-TS comes in v0.3.

- [ ] **Step 1: Skeleton + `package.json`**

```bash
mkdir -p packages/cascade-compiler/src packages/cascade-compiler/test
```

```json
{
  "name": "@tierfall/cascade-compiler",
  "version": "0.0.0",
  "description": "Graph-to-TypeScript compiler for Cascade workflows. v0.1 ships a trivial SDK-passthrough emitter; v0.3 ships the typed pipeline emitter.",
  "license": "SEE LICENSE IN ../../LICENSE",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "node --experimental-vm-modules ../../node_modules/jest/bin/jest.js --coverage",
    "lint": "eslint --max-warnings=0 src test",
    "typecheck": "tsc --noEmit --pretty false"
  },
  "dependencies": {
    "@tierfall/cascade-core": "workspace:*"
  },
  "publishConfig": { "access": "public" }
}
```

- [ ] **Step 2: Write `packages/cascade-compiler/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules", "test", "**/*.test.ts"]
}
```

- [ ] **Step 3: Write `packages/cascade-compiler/project.json`** — tagged `scope:server`

```json
{
  "name": "cascade-compiler",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/cascade-compiler/src",
  "projectType": "library",
  "tags": ["scope:server", "type:tooling"],
  "targets": {
    "build": { "executor": "nx:run-script", "options": { "script": "build" }, "outputs": ["{projectRoot}/dist"] },
    "test": { "executor": "nx:run-script", "options": { "script": "test" } },
    "lint": { "executor": "nx:run-script", "options": { "script": "lint" } },
    "typecheck": { "executor": "nx:run-script", "options": { "script": "typecheck" } }
  }
}
```

- [ ] **Step 4: Write `packages/cascade-compiler/tsup.config.ts`**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  treeshake: true,
});
```

- [ ] **Step 5: Write `packages/cascade-compiler/jest.config.ts`** — 95% threshold

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: { statements: 95, branches: 95, functions: 95, lines: 95 },
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: { module: 'ESNext' } }],
  },
};

export default config;
```

- [ ] **Step 6: Write failing tests**

`packages/cascade-compiler/test/compile.test.ts`:

```typescript
import { describe, expect, it } from '@jest/globals';
import { compile } from '../src/index.js';

const minimalWorkflow = {
  schemaVersion: '1.0.0' as const,
  id: 'wf_demo',
  name: 'Demo',
  nodes: [{ id: 'start', type: 'http' as const, config: { url: 'https://example.com' } }],
  edges: [],
  triggers: [{ kind: 'manual' as const }],
};

describe('compile', () => {
  it('emits TypeScript source containing the workflow id', () => {
    const src = compile(minimalWorkflow);
    expect(src).toContain('wf_demo');
    expect(src).toContain('@tierfall/cascade-sdk');
  });

  it('throws on a workflow that fails schema validation', () => {
    const bad = { ...minimalWorkflow, nodes: [] };
    expect(() => compile(bad as unknown as Parameters<typeof compile>[0])).toThrow();
  });

  it('emitted source has a default-exported main() function', () => {
    const src = compile(minimalWorkflow);
    expect(src).toMatch(/export\s+default\s+async\s+function\s+main/);
  });

  it('respects custom apiBaseUrl', () => {
    const src = compile(minimalWorkflow, { apiBaseUrl: 'https://api.cascade.dev' });
    expect(src).toContain('https://api.cascade.dev');
  });

  it('falls back to env-driven baseUrl when option absent', () => {
    const src = compile(minimalWorkflow);
    expect(src).toContain('process.env.CASCADE_API_URL');
  });
});
```

- [ ] **Step 7: Verify failure**

```bash
pnpm --filter @tierfall/cascade-compiler test
```

- [ ] **Step 8: Implement `packages/cascade-compiler/src/emit.ts`**

```typescript
import type { Workflow } from '@tierfall/cascade-core';

export interface EmitOptions {
  apiBaseUrl?: string;
}

export function emit(workflow: Workflow, opts: EmitOptions = {}): string {
  const baseUrl = opts.apiBaseUrl !== undefined
    ? JSON.stringify(opts.apiBaseUrl)
    : "process.env.CASCADE_API_URL ?? 'http://localhost:3000'";

  return `// Generated by @tierfall/cascade-compiler — DO NOT EDIT BY HAND.
// Workflow: ${workflow.name} (${workflow.id})
// Schema version: ${workflow.schemaVersion}
import { CascadeClient } from '@tierfall/cascade-sdk';

const workflow = ${JSON.stringify(workflow, null, 2)} as const;

export default async function main(input: Record<string, unknown> = {}): Promise<unknown> {
  const client = new CascadeClient({ baseUrl: ${baseUrl} });
  const run = await client.triggerWorkflow(workflow.id, { input });
  return run;
}
`;
}
```

- [ ] **Step 9: Implement `packages/cascade-compiler/src/compile.ts`**

```typescript
import { WorkflowSchema, type Workflow } from '@tierfall/cascade-core';
import { emit, type EmitOptions } from './emit.js';

export function compile(workflow: Workflow, opts: EmitOptions = {}): string {
  const parsed = WorkflowSchema.parse(workflow);
  return emit(parsed, opts);
}
```

- [ ] **Step 10: Implement `packages/cascade-compiler/src/index.ts`**

```typescript
export { compile } from './compile.js';
export { emit, type EmitOptions } from './emit.js';
```

- [ ] **Step 11: Run tests; build; commit**

```bash
pnpm --filter @tierfall/cascade-compiler test
pnpm --filter @tierfall/cascade-compiler build
```

CLAUDE.md (write file at `packages/cascade-compiler/CLAUDE.md`):

```markdown
# cascade-compiler — Claude context

**Purpose:** Graph → TypeScript compiler. v0.1 ships a trivial passthrough emitter:
the generated `.ts` file imports `@tierfall/cascade-sdk` and re-triggers the workflow
via the API. v0.3 lands the real compiler that inlines each node's logic.

## What lives here

- `src/compile.ts` — public entry. Validates with the WorkflowSchema, then emits.
- `src/emit.ts` — the actual code generator. Currently a single template.

## Why it exists (load-bearing per spec §1)

The compile-to-TypeScript exit door is the lock-in protection. Even at v0.1 — where
the emitter is trivial — users can already see that "every workflow is also a `.ts`
file". The schema is compiler-friendly from day one (no editor-only constructs).

## Hard rules

- The emitter MUST NOT depend on cascade-api, cascade-nodes, or any server-side code.
  It only consumes Workflow JSON + the SDK.
- 95% coverage threshold.
- When the v0.3 compiler arrives, the v0.1 trivial output remains valid — it's just
  superseded by a richer version.
```

```bash
git add packages/cascade-compiler/
git commit -m "$(cat <<'EOF'
feat(compiler): scaffold cascade-compiler skeleton

v0.1 ships a trivial passthrough emitter:
- compile(workflow, opts?) validates against WorkflowSchema and delegates to emit().
- emit() returns a string of TypeScript that imports @tierfall/cascade-sdk and
  re-triggers the workflow via the API. Default-exports an async main() taking input.
- apiBaseUrl option overrides the env-driven default.

The compile-to-TS exit door (spec §1) is load-bearing. Even the trivial v0.1 output
proves that every workflow is also a real .ts file users can own. The v0.3 typed
pipeline emitter supersedes this without breaking the contract.

95% coverage threshold.
EOF
)"
```

---

## Task 11: Scaffold `cascade-cli` with the `cascade run` command

**Files:**
- Create: `packages/cascade-cli/{package.json,tsconfig.json,project.json,jest.config.ts,tsup.config.ts,CLAUDE.md}`
- Create: `packages/cascade-cli/src/{index.ts,bin.ts,run.ts,parse-args.ts}`
- Create: `packages/cascade-cli/test/{run.test.ts,parse-args.test.ts}`

Coverage threshold 95%. v0.1 ships **one command**: `cascade run <workflow-id>`. Optional flags: `--api-url`, `--api-token`, `--input <json>`, `--wait`. No interactive prompts; piped JSON or `--input` only.

- [ ] **Step 1: Skeleton + package.json**

```bash
mkdir -p packages/cascade-cli/src packages/cascade-cli/test
```

`packages/cascade-cli/package.json`:

```json
{
  "name": "@tierfall/cascade-cli",
  "version": "0.0.0",
  "description": "Headless workflow trigger CLI for Cascade. Single command in v0.1: `cascade run <workflow-id>`.",
  "license": "SEE LICENSE IN ../../LICENSE",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": { "cascade": "./dist/bin.js" },
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "node --experimental-vm-modules ../../node_modules/jest/bin/jest.js --coverage",
    "lint": "eslint --max-warnings=0 src test",
    "typecheck": "tsc --noEmit --pretty false"
  },
  "dependencies": {
    "@tierfall/cascade-sdk": "workspace:*"
  },
  "publishConfig": { "access": "public" }
}
```

- [ ] **Step 2: Write `packages/cascade-cli/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules", "test", "**/*.test.ts"]
}
```

- [ ] **Step 3: Write `packages/cascade-cli/project.json`** — tagged `scope:server`

```json
{
  "name": "cascade-cli",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/cascade-cli/src",
  "projectType": "library",
  "tags": ["scope:server", "type:cli"],
  "targets": {
    "build": { "executor": "nx:run-script", "options": { "script": "build" }, "outputs": ["{projectRoot}/dist"] },
    "test": { "executor": "nx:run-script", "options": { "script": "test" } },
    "lint": { "executor": "nx:run-script", "options": { "script": "lint" } },
    "typecheck": { "executor": "nx:run-script", "options": { "script": "typecheck" } }
  }
}
```

- [ ] **Step 4: Write `packages/cascade-cli/tsup.config.ts`** — note the `banner` for the shebang

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  banner: { js: '#!/usr/bin/env node' },
});
```

- [ ] **Step 5: Write `packages/cascade-cli/jest.config.ts`** — 95% threshold

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts', '!src/bin.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: { statements: 95, branches: 95, functions: 95, lines: 95 },
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: { module: 'ESNext' } }],
  },
};

export default config;
```

`bin.ts` is excluded from coverage because the binary entry is covered by Task 12's smoke-test invocation (`node packages/cascade-cli/dist/bin.js --help`). ESLint allows `no-console` in this package (already configured in Task 2 Step 5).

- [ ] **Step 6: Failing tests**

`packages/cascade-cli/test/parse-args.test.ts`:

```typescript
import { describe, expect, it } from '@jest/globals';
import { parseArgs } from '../src/parse-args.js';

describe('parseArgs', () => {
  it('parses `run wf_1`', () => {
    const r = parseArgs(['run', 'wf_1']);
    expect(r.command).toBe('run');
    expect(r.workflowId).toBe('wf_1');
  });

  it('parses --api-url and --api-token flags', () => {
    const r = parseArgs(['run', 'wf_1', '--api-url', 'http://x', '--api-token', 't']);
    expect(r.apiUrl).toBe('http://x');
    expect(r.apiToken).toBe('t');
  });

  it('parses --input as JSON', () => {
    const r = parseArgs(['run', 'wf_1', '--input', '{"x":1}']);
    expect(r.input).toEqual({ x: 1 });
  });

  it('rejects --input that is not valid JSON', () => {
    expect(() => parseArgs(['run', 'wf_1', '--input', 'not json'])).toThrow(/invalid JSON/i);
  });

  it('rejects unknown commands', () => {
    expect(() => parseArgs(['fly', 'wf_1'])).toThrow(/unknown command/i);
  });

  it('rejects `run` with no workflow id', () => {
    expect(() => parseArgs(['run'])).toThrow(/workflow id required/i);
  });

  it('sets wait=true when --wait flag present', () => {
    const r = parseArgs(['run', 'wf_1', '--wait']);
    expect(r.wait).toBe(true);
  });
});
```

`packages/cascade-cli/test/run.test.ts`:

```typescript
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { runCommand } from '../src/run.js';

describe('runCommand', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  it('triggers the workflow and prints the run id', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'run_42', status: 'queued', workflowId: 'wf_1' }), {
        status: 202,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const logs: string[] = [];
    await runCommand(
      { workflowId: 'wf_1', apiUrl: 'http://api.test', input: { x: 1 }, wait: false },
      (m) => logs.push(m),
    );
    expect(logs.join('\n')).toContain('run_42');
  });

  it('forwards api-token to the SDK as Bearer', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'r', status: 'queued', workflowId: 'wf_1' }), {
        status: 202,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await runCommand({ workflowId: 'wf_1', apiUrl: 'http://api.test', apiToken: 't0k', wait: false }, () => undefined);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer t0k' }) }),
    );
  });

  it('throws on API error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"error":"x"}', { status: 500, headers: { 'content-type': 'application/json' } }));
    await expect(
      runCommand({ workflowId: 'wf_1', apiUrl: 'http://api.test', wait: false }, () => undefined),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 7: Verify failure** (`pnpm --filter @tierfall/cascade-cli test` → import errors)

- [ ] **Step 8: Implement `packages/cascade-cli/src/parse-args.ts`**

```typescript
export interface ParsedArgs {
  command: 'run';
  workflowId: string;
  apiUrl?: string;
  apiToken?: string;
  input?: Record<string, unknown>;
  wait: boolean;
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
  if (argv.length === 0) throw new Error('command required');
  const [cmd, ...rest] = argv;
  if (cmd !== 'run') throw new Error(`unknown command: ${String(cmd)}`);
  if (rest.length === 0 || rest[0] === undefined || rest[0].startsWith('--')) {
    throw new Error('workflow id required');
  }
  const result: ParsedArgs = { command: 'run', workflowId: rest[0], wait: false };
  for (let i = 1; i < rest.length; i += 1) {
    const flag = rest[i];
    if (flag === '--wait') {
      result.wait = true;
      continue;
    }
    const value = rest[i + 1];
    if (value === undefined) throw new Error(`flag ${String(flag)} requires a value`);
    switch (flag) {
      case '--api-url':
        result.apiUrl = value;
        break;
      case '--api-token':
        result.apiToken = value;
        break;
      case '--input':
        try {
          result.input = JSON.parse(value) as Record<string, unknown>;
        } catch {
          throw new Error('invalid JSON for --input');
        }
        break;
      default:
        throw new Error(`unknown flag: ${String(flag)}`);
    }
    i += 1;
  }
  return result;
}
```

- [ ] **Step 9: Implement `packages/cascade-cli/src/run.ts`**

```typescript
import { CascadeClient } from '@tierfall/cascade-sdk';

export interface RunOptions {
  workflowId: string;
  apiUrl: string;
  apiToken?: string;
  input?: Record<string, unknown>;
  wait: boolean;
}

export type Logger = (message: string) => void;

export async function runCommand(opts: RunOptions, log: Logger): Promise<void> {
  const client = new CascadeClient({
    baseUrl: opts.apiUrl,
    ...(opts.apiToken !== undefined ? { apiToken: opts.apiToken } : {}),
  });
  const run = await client.triggerWorkflow(opts.workflowId, opts.input !== undefined ? { input: opts.input } : {});
  log(`Triggered ${opts.workflowId} -> run id ${run.id} (status: ${run.status})`);
  if (opts.wait) {
    log('Note: --wait polling is a backlog issue (B-CLI-WAIT) — exiting without blocking.');
  }
}
```

- [ ] **Step 10: Implement `packages/cascade-cli/src/index.ts`**

```typescript
export { parseArgs, type ParsedArgs } from './parse-args.js';
export { runCommand, type RunOptions, type Logger } from './run.js';
```

- [ ] **Step 11: Implement `packages/cascade-cli/src/bin.ts`**

```typescript
import { parseArgs } from './parse-args.js';
import { runCommand } from './run.js';

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    console.log(`Usage: cascade run <workflow-id> [options]

Options:
  --api-url <url>       Cascade API base URL. Defaults to env CASCADE_API_URL or http://localhost:3000.
  --api-token <token>   Bearer token. Defaults to env CASCADE_API_TOKEN.
  --input <json>        JSON payload passed as workflow input.
  --wait                Wait for completion (not yet implemented in v0.1).
`);
    return;
  }
  const parsed = parseArgs(argv);
  const apiUrl = parsed.apiUrl ?? process.env.CASCADE_API_URL ?? 'http://localhost:3000';
  const apiToken = parsed.apiToken ?? process.env.CASCADE_API_TOKEN;
  await runCommand(
    {
      workflowId: parsed.workflowId,
      apiUrl,
      ...(apiToken !== undefined ? { apiToken } : {}),
      ...(parsed.input !== undefined ? { input: parsed.input } : {}),
      wait: parsed.wait,
    },
    (m) => console.log(m),
  );
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`cascade: ${message}`);
  process.exit(1);
});
```

- [ ] **Step 12: Run tests, build**

```bash
pnpm --filter @tierfall/cascade-cli test
pnpm --filter @tierfall/cascade-cli build
```

After build, smoke-test the binary:

```bash
node packages/cascade-cli/dist/bin.js --help
```

Expected: usage message prints, exit 0.

- [ ] **Step 13: Write `packages/cascade-cli/CLAUDE.md`** (brief, given the limited surface)

```markdown
# cascade-cli — Claude context

**Purpose:** Headless `cascade run` binary. v0.1 has one command; cron / file-watcher /
upload-workflow / list-runs land in later versions.

## What lives here

- `src/bin.ts` — entry. argv → parseArgs → runCommand. Handles `--help`.
- `src/parse-args.ts` — argv parser. Strict: unknown flag = error.
- `src/run.ts` — invokes cascade-sdk to trigger a run, prints the result.

## Hard rules

- 95% coverage threshold.
- `--wait` is a v0.1 backlog issue (B-CLI-WAIT) — it logs a notice today.
- `console.log` is allowed here ONLY (eslint config carves an exception for this package).
- No interactive prompts. JSON via `--input` or stdin (stdin is a backlog issue).
```

- [ ] **Step 14: Commit**

```bash
git add packages/cascade-cli/
git commit -m "$(cat <<'EOF'
feat(cli): scaffold cascade-cli with cascade run command

`cascade run <workflow-id>` triggers a workflow via the Cascade API.

Flags:
  --api-url <url>       defaults to env CASCADE_API_URL or http://localhost:3000
  --api-token <token>   defaults to env CASCADE_API_TOKEN
  --input <json>        JSON workflow input
  --wait                accepted but not yet implemented (logs a notice)

Implementation:
- parseArgs: strict argv parser; unknown flag is an error, malformed --input JSON
  is an error, missing required workflow id is an error.
- runCommand: thin wrapper over CascadeClient.triggerWorkflow. Logger injected so
  tests assert on output without mocking console.
- bin.ts: argv → parse → run. Uses #!/usr/bin/env node banner via tsup.

95% coverage threshold. console.log allowed in this package only.
EOF
)"
```

---

## Task 12: Scaffold `cascade-api` NestJS app with Prisma

**Files:**
- Generate via Nx, then customize:
  - `apps/cascade-api/{package.json,tsconfig.app.json,tsconfig.spec.json,project.json,jest.config.ts,webpack.config.js}`
  - `apps/cascade-api/src/{main.ts,app.module.ts}`
- Hand-author:
  - `apps/cascade-api/src/health/{health.module.ts,health.controller.ts,health.controller.spec.ts}`
  - `apps/cascade-api/src/prisma/{prisma.module.ts,prisma.service.ts}`
  - `apps/cascade-api/prisma/schema.prisma`
  - `apps/cascade-api/.env.example`
  - `apps/cascade-api/CLAUDE.md`

Coverage threshold 90% (spec §4.5). Real NestJS + Prisma boot; v0.1 ships a `/health` endpoint that round-trips through the DB to prove the wiring works. CRUD for workflows + runs lands in v0.1 backlog issues — each gated by a real integration test in `cascade-api-e2e` (Task 16).

- [ ] **Step 1: Generate the NestJS app via Nx**

```bash
pnpm exec nx g @nx/nest:application cascade-api \
  --directory=apps/cascade-api \
  --strict \
  --linter=eslint \
  --unitTestRunner=jest \
  --no-interactive
```

- [ ] **Step 2: Inspect what was generated** — Nx may have added files (`jest.preset.js` at root, an extra `tsconfig.json`, etc.) that we don't want. Remove files outside `apps/cascade-api/` that conflict with our root configs.

```bash
git status
# Expected new files: apps/cascade-api/* (keep), possibly jest.preset.js / eslint.config.js at root (REMOVE if present — our root configs take precedence)
git diff --stat
```

If `jest.preset.js` was added at the root, delete it — each package owns its own jest config. If an `eslint.config.js` at the root was modified by Nx, revert.

- [ ] **Step 3: Add Prisma + Nest support deps to root `package.json`** (run from repo root)

```bash
pnpm add --filter cascade-api \
  @nestjs/common@10.4.15 \
  @nestjs/core@10.4.15 \
  @nestjs/platform-express@10.4.15 \
  @nestjs/config@3.3.0 \
  @nestjs/terminus@10.3.0 \
  @nestjs/throttler@6.4.0 \
  @nestjs/swagger@8.1.0 \
  @prisma/client@6.2.0 \
  bullmq@5.34.4 \
  ioredis@5.4.2 \
  helmet@8.0.0 \
  reflect-metadata@0.2.2 \
  rxjs@7.8.1 \
  zod@3.24.1

pnpm add --filter cascade-api --save-dev \
  @nestjs/testing@10.4.15 \
  @nestjs/schematics@10.2.3 \
  @types/express@5.0.0 \
  @types/supertest@6.0.2 \
  prisma@6.2.0 \
  supertest@7.0.0
```

- [ ] **Step 4: Replace `apps/cascade-api/jest.config.ts` with the project standard** — coverage threshold 90% with ignore globs

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: { statements: 90, branches: 90, functions: 90, lines: 90 },
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: { module: 'ESNext' } }],
  },
};

export default config;
```

The `main.ts` and `*.module.ts` exclusions are explicit — boot wiring and module declarations are covered by the integration suite in Task 16, not unit tests. The PR template (Task 19) requires reviewers to verify this exclusion list doesn't grow casually.

- [ ] **Step 5: Write `apps/cascade-api/prisma/schema.prisma`** (initial schema — v0.1 entities)

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "./generated/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         String   @default("admin") // v0.1 is single-admin; multi-tenant is v0.5
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Workflow {
  id            String   @id @default(cuid())
  name          String
  schemaVersion String   @default("1.0.0")
  definition    Json
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  runs          Run[]

  @@index([createdAt])
}

model Run {
  id           String         @id @default(cuid())
  workflowId   String
  workflow     Workflow       @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  status       String         // queued | running | success | error
  inputPayload Json?
  startedAt    DateTime?
  finishedAt   DateTime?
  costUsd      Decimal?       @db.Decimal(10, 6)
  nodeExecutions NodeExecution[]
  createdAt    DateTime       @default(now())

  @@index([workflowId, createdAt])
}

model NodeExecution {
  id          String   @id @default(cuid())
  runId       String
  run         Run      @relation(fields: [runId], references: [id], onDelete: Cascade)
  nodeId      String
  status      String   // queued | running | success | error
  tier        Int?     // which TierFall tier handled this node
  inputJson   Json?
  outputJson  Json?
  startedAt   DateTime?
  finishedAt  DateTime?
  costUsd     Decimal? @db.Decimal(10, 6)
  errorJson   Json?

  @@index([runId])
}

model EncryptedCredential {
  id         String   @id @default(cuid())
  name       String   @unique
  ciphertext Bytes
  iv         Bytes
  authTag    Bytes
  createdAt  DateTime @default(now())
}
```

- [ ] **Step 6: Write `apps/cascade-api/.env.example`**

```
# Cascade API — environment variables. Copy to .env in dev; CI sets these explicitly.
NODE_ENV=development
PORT=3000

# Postgres — the docker-compose stack provides this at compose-internal hostname.
DATABASE_URL=postgresql://cascade:cascade@postgres:5432/cascade?schema=public

# Redis for BullMQ.
REDIS_URL=redis://redis:6379

# Encryption key for stored credentials. Setup wizard generates this on first boot.
# 32 hex bytes = 64 hex chars (AES-256-GCM key).
CREDENTIALS_ENC_KEY=

# JWT signing secret. Setup wizard generates on first boot.
JWT_SECRET=

# Storage driver. local = filesystem under /data/storage. s3 = S3-compatible.
STORAGE_DRIVER=local
STORAGE_LOCAL_DIR=/data/storage
# S3 driver (active when STORAGE_DRIVER=s3):
S3_ENDPOINT=
S3_REGION=us-east-1
S3_BUCKET=cascade
S3_ACCESS_KEY=
S3_SECRET_KEY=

# Execution safety limits (spec §5.7).
CASCADE_MAX_NODES_PER_RUN=1000
CASCADE_MAX_RUN_DURATION_MS=300000
CASCADE_MAX_RUN_COST_USD=1.00
CASCADE_MAX_NODE_RETRIES=3
```

- [ ] **Step 7: Replace `apps/cascade-api/src/main.ts`** with a real bootstrap

```typescript
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(helmet());
  const port = Number(process.env.PORT ?? '3000');
  await app.listen(port);
  // eslint-disable… NO. Use Nest's built-in logger:
  const { Logger } = await import('@nestjs/common');
  Logger.log(`cascade-api listening on :${port.toString()}`, 'Bootstrap');
}

void bootstrap();
```

- [ ] **Step 8: Replace `apps/cascade-api/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 9: Write `apps/cascade-api/src/prisma/prisma.service.ts`**

```typescript
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../prisma/generated/client/index.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

- [ ] **Step 10: Write `apps/cascade-api/src/prisma/prisma.module.ts`**

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 11: Write `apps/cascade-api/src/health/health.controller.spec.ts`** (failing test FIRST)

```typescript
import { Test, type TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('HealthController', () => {
  let controller: HealthController;
  const queryRawMock = jest.fn();

  beforeEach(async () => {
    queryRawMock.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: { $queryRaw: queryRawMock } },
      ],
    }).compile();
    controller = module.get(HealthController);
  });

  it('returns status ok when DB responds', async () => {
    queryRawMock.mockResolvedValueOnce([{ one: 1 }]);
    expect(await controller.check()).toEqual({ status: 'ok' });
  });

  it('returns status degraded when DB throws', async () => {
    queryRawMock.mockRejectedValueOnce(new Error('boom'));
    expect(await controller.check()).toEqual({ status: 'degraded' });
  });
});
```

- [ ] **Step 12: Write `apps/cascade-api/src/health/health.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: 'ok' | 'degraded' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch {
      return { status: 'degraded' };
    }
  }
}
```

- [ ] **Step 13: Write `apps/cascade-api/src/health/health.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';

@Module({ controllers: [HealthController] })
export class HealthModule {}
```

- [ ] **Step 14: Run unit tests; verify pass + 90% coverage**

```bash
pnpm --filter cascade-api test
```

Expected: HealthController spec green. Coverage table will show non-`main.ts`/`*.module.ts` files at ≥ 90%. If a path is uncovered, ADD A TEST.

- [ ] **Step 15: Run `prisma generate` and `prisma format`** (NOT migrate — DB doesn't exist yet; Testcontainers boots it in Task 16)

```bash
pnpm --filter cascade-api exec prisma format
pnpm --filter cascade-api exec prisma generate
```

- [ ] **Step 16: Write `apps/cascade-api/CLAUDE.md`**

```markdown
# cascade-api — Claude context

**Purpose:** NestJS HTTP + WebSocket gateway + BullMQ worker for Cascade.
Owns the workflow definition store, the runs persistence, and the per-node
tier-attribution log.

## What lives here

- `src/main.ts` — Nest bootstrap. Helmet, CORS, listen.
- `src/app.module.ts` — root module. ConfigModule + ThrottlerModule + PrismaModule + HealthModule.
- `src/prisma/` — global PrismaService wrapping PrismaClient.
- `src/health/` — `/health` endpoint that round-trips a `SELECT 1`.
- `prisma/schema.prisma` — v0.1 entities: User, Workflow, Run, NodeExecution,
  EncryptedCredential. Migrations live in `prisma/migrations/` (Testcontainers
  in Task 16 runs `prisma migrate deploy`).
- Future (each landed as a v0.1 backlog issue):
  - `src/workflows/` — CRUD against Workflow table.
  - `src/runs/` — execution engine, BullMQ queues, run history.
  - `src/auth/` — first-boot setup wizard + JWT sessions.
  - `src/credentials/` — AES-256-GCM at rest using `CREDENTIALS_ENC_KEY`.
  - `src/storage/` — pluggable StorageProvider (local + S3).
  - `src/ws/` — Socket.IO gateway broadcasting node-execution state changes.

## Hard rules

- 90% coverage threshold. `main.ts` and `*.module.ts` excluded from collection
  (verified by integration tests instead).
- No `any`, no `@ts-ignore`. PrismaService extends PrismaClient — the generated
  client is typed.
- Real DB / Redis / BullMQ in integration tests (cascade-api-e2e, Task 16). No
  in-memory fakes.
- TierFall is consumed via `@tierfall/core@^0.1.0` directly — never wrapped, never
  forked. If a routing feature is needed, it goes upstream.
```

- [ ] **Step 17: Commit**

```bash
git add apps/cascade-api/ pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(api): scaffold cascade-api NestJS app with Prisma

- Nx-generated NestJS 10.4 app, then customized with our own jest config (90%
  threshold; main.ts and *.module.ts excluded — covered by integration tests).
- Prisma 6.2 with PostgreSQL provider; schema covers v0.1 entities: User,
  Workflow, Run, NodeExecution, EncryptedCredential.
- PrismaModule global. Helmet + CORS + ConfigModule + ThrottlerModule wired.
- HealthController returns `ok | degraded` based on a `SELECT 1` round-trip.
- .env.example documents all required vars including the spec §5.7 execution
  safety limits and §5.5 single-admin auth defaults.

CRUD endpoints, the execution engine, the Socket.IO gateway, auth, credentials,
and storage all land as separate v0.1 backlog issues — each gated by an
integration test in cascade-api-e2e (Task 16).
EOF
)"
```

---

## Task 13: Scaffold `cascade-web` Next.js app consuming cascade-ui

**Files:**
- Generate via Nx, then customize:
  - `apps/cascade-web/{package.json,tsconfig.json,project.json,next.config.js}`
  - `apps/cascade-web/{app/layout.tsx,app/page.tsx,app/globals.css}`
- Hand-author:
  - `apps/cascade-web/tailwind.config.ts` — extends the cascade-ui preset
  - `apps/cascade-web/postcss.config.js`
  - `apps/cascade-web/jest.config.ts` — 90% threshold
  - `apps/cascade-web/CLAUDE.md`

Coverage threshold 90%. v0.1 is **read-only** — home page renders, ReactFlow canvas can display a workflow loaded from the API, live execution feedback wires up via WebSocket. Editing is v0.2.

- [ ] **Step 1: Generate via Nx**

```bash
pnpm exec nx g @nx/next:application cascade-web \
  --directory=apps/cascade-web \
  --appDir=true \
  --src=false \
  --style=tailwind \
  --tags=scope:web,type:app \
  --no-interactive
```

- [ ] **Step 2: Inspect; remove unwanted root-level files Nx may have added**

```bash
git status
```

Remove any added `eslint.config.js` at root, any `.eslintrc.json` files (we use the root flat config exclusively), and any `tailwind.config.ts` at the root (cascade-web owns its own that extends the preset).

- [ ] **Step 3: Add web deps**

```bash
pnpm add --filter cascade-web \
  next@15.1.4 \
  react@19.0.0 \
  react-dom@19.0.0 \
  @tierfall/cascade-tokens@workspace:* \
  @tierfall/cascade-ui@workspace:* \
  @tierfall/cascade-sdk@workspace:* \
  @tierfall/cascade-core@workspace:* \
  zustand@5.0.3 \
  @xyflow/react@12.4.4 \
  socket.io-client@4.8.1

pnpm add --filter cascade-web --save-dev \
  @testing-library/jest-dom@6.6.3 \
  @testing-library/react@16.1.0 \
  @types/react@19.0.7 \
  @types/react-dom@19.0.3 \
  autoprefixer@10.4.20 \
  jest-environment-jsdom@29.7.0 \
  postcss@8.5.1 \
  tailwindcss@3.4.17
```

- [ ] **Step 4: Write `apps/cascade-web/tailwind.config.ts`** — extends the cascade-ui preset

```typescript
import preset from '@tierfall/cascade-ui/tailwind-preset';
import type { Config } from 'tailwindcss';

const config: Config = {
  presets: [preset],
  content: [
    './app/**/*.{ts,tsx}',
    '../../packages/cascade-ui/src/**/*.{ts,tsx}',
  ],
};

export default config;
```

- [ ] **Step 5: Write `apps/cascade-web/postcss.config.js`**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Write `apps/cascade-web/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark light;
}

html.dark {
  background-color: theme('colors.background.dark');
  color: theme('colors.foreground.DEFAULT');
}
```

- [ ] **Step 7: Write `apps/cascade-web/app/layout.tsx`**

```typescript
import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Cascade',
  description: 'Self-hosted visual AI workflow editor built on TierFall.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en" className="dark">
      <body className="bg-background-dark text-foreground font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Write `apps/cascade-web/app/page.tsx`**

```typescript
import { Button, TierBadge } from '@tierfall/cascade-ui';

export default function Home(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-cascade-6">
      <h1 className="text-display font-sans font-bold">Cascade</h1>
      <p className="text-body max-w-md text-center">
        Self-hosted visual AI workflow editor built on TierFall. Routing is on the canvas,
        not in a settings panel.
      </p>
      <div className="flex gap-cascade-3" aria-label="tier ramp preview">
        {[0, 1, 2, 3, 4].map((tier) => (
          <TierBadge key={tier} tier={tier as 0 | 1 | 2 | 3 | 4} />
        ))}
      </div>
      <Button>Get started</Button>
    </main>
  );
}
```

- [ ] **Step 9: Write `apps/cascade-web/jest.config.ts`** — 90% threshold

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  rootDir: '.',
  roots: ['<rootDir>/app', '<rootDir>/test'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    '!app/**/layout.tsx',
    '!app/**/page.tsx',
    '!app/**/*.d.ts',
    '!app/**/route.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: { statements: 90, branches: 90, functions: 90, lines: 90 },
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@tierfall/(.*)$': '<rootDir>/../../packages/$1/src/index.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true, tsconfig: { module: 'ESNext', jsx: 'react-jsx' } }],
  },
};

export default config;
```

Note: `app/layout.tsx`, `app/page.tsx`, and `route.ts` files are excluded from unit coverage. They're tested end-to-end by Playwright (Task 16). This is the **only** explicit exclusion list for `cascade-web` — the PR template (Task 19) requires reviewers to verify it doesn't grow.

- [ ] **Step 10: Write `apps/cascade-web/test/sanity.test.tsx`** (placeholder so the package has at least one passing unit test in Phase 3)

```typescript
import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { TierBadge } from '@tierfall/cascade-ui';

describe('TierBadge integration smoke test', () => {
  it('renders inside cascade-web with tokens applied', () => {
    render(<TierBadge tier={2} />);
    expect(screen.getByText('Tier 2')).toBeInTheDocument();
  });
});
```

- [ ] **Step 11: Run unit tests**

```bash
pnpm --filter cascade-web test
```

Expected: pass at 100% coverage (only one source-of-uncovered-lines file, but all paths trivially covered). The 90% threshold is the floor; real feature PRs raise the bar.

- [ ] **Step 12: Run the dev build (smoke test, NOT to commit the artifacts)**

```bash
pnpm --filter cascade-web exec next build
```

Expected: build completes; warnings about missing API URL are OK.

- [ ] **Step 13: Write `apps/cascade-web/CLAUDE.md`**

```markdown
# cascade-web — Claude context

**Purpose:** Next.js 15 frontend. v0.1 is **read-only** — renders workflow graphs
from the API, shows live execution feedback via WebSocket. Editing arrives in v0.2.

## What lives here

- `app/layout.tsx` — root layout. Dark mode by default (spec §6.3). Fonts applied
  via Tailwind's `font-sans` resolving to Inter (cascade-tokens).
- `app/page.tsx` — landing page. Shows the tier ramp and a CTA.
- `tailwind.config.ts` — extends `@tierfall/cascade-ui/tailwind-preset`. Adds the
  `cascade-ui` source path so the preset's classes are tree-shaken correctly.
- Future (each landed as a v0.1 backlog issue):
  - `app/workflows/page.tsx` — list view.
  - `app/workflows/[id]/page.tsx` — read-only graph view consuming ReactFlow 12 (@xyflow/react).
  - `lib/state/canvasStore.ts` — Zustand store for ReactFlow state.
  - `lib/state/runStore.ts` — Zustand store subscribed to Socket.IO node-execution events.
  - `app/setup/page.tsx` — first-boot setup wizard (spec §5.4).

## Hard rules

- 90% coverage threshold. `layout.tsx`, `page.tsx`, `route.ts` excluded from unit
  collection — those are covered by Playwright in cascade-web-e2e (Task 16).
- No hardcoded colors / spacing / typography. Everything routes through the preset.
- Read-only in v0.1. The visual editor (drag-drop, edit-on-canvas, per-node policy)
  is the v0.2 milestone. Build the schema-version=`1.0.0` reader carefully — v0.2
  must extend it, not replace it.
```

- [ ] **Step 14: Commit**

```bash
git add apps/cascade-web/ pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(web): scaffold cascade-web Next.js app consuming cascade-ui

- Nx-generated Next.js 15.1 app, app router, Tailwind enabled.
- tailwind.config.ts extends the cascade-ui preset; content globs include the
  cascade-ui sources so JIT picks up classes from the design-system package.
- Landing page renders the tier ramp (TierBadge x5) + a primary Button to prove
  the preset is wired and tokens flow through end-to-end.
- Deps: Zustand 5 (spec §6.1 — ReactFlow state), @xyflow/react 12 (ReactFlow),
  socket.io-client 4.8 (WS live feedback per constraint #11), @tierfall/cascade-sdk
  for API calls.
- 90% coverage threshold; layout/page/route excluded — covered by Playwright.

Read-only in v0.1 per spec scope; visual editor is v0.2.
EOF
)"
```

---

## Task 14: Scaffold `cascade-docs` Fumadocs site

**Files:**
- Generate via Nx + manual Fumadocs scaffold:
  - `apps/cascade-docs/{package.json,next.config.mjs,source.config.ts,tsconfig.json}`
  - `apps/cascade-docs/app/{layout.tsx,page.tsx}`
  - `apps/cascade-docs/app/docs/[[...slug]]/page.tsx`
  - `apps/cascade-docs/content/docs/{index.mdx,getting-started.mdx,architecture.mdx}`

No unit coverage threshold (spec §4.5 — docs has no threshold). Content lives in MDX. Bundled into the Docker compose stack at port 3001 (Task 17).

- [ ] **Step 1: Generate the base Next.js app via Nx** (Fumadocs sits on top of Next.js)

```bash
pnpm exec nx g @nx/next:application cascade-docs \
  --directory=apps/cascade-docs \
  --appDir=true \
  --src=false \
  --style=none \
  --tags=scope:docs,type:app \
  --no-interactive
```

Remove any Tailwind boilerplate Nx may have added — Fumadocs ships its own styling.

- [ ] **Step 2: Add Fumadocs deps**

```bash
pnpm add --filter cascade-docs \
  next@15.1.4 \
  react@19.0.0 \
  react-dom@19.0.0 \
  fumadocs-core@14.6.5 \
  fumadocs-ui@14.6.5 \
  fumadocs-mdx@11.3.2

pnpm add --filter cascade-docs --save-dev \
  @types/mdx@2.0.13 \
  @types/react@19.0.7 \
  @types/react-dom@19.0.3
```

- [ ] **Step 3: Write `apps/cascade-docs/source.config.ts`**

```typescript
import { defineDocs, defineConfig } from 'fumadocs-mdx/config';

export const docs = defineDocs({
  dir: 'content/docs',
});

export default defineConfig();
```

- [ ] **Step 4: Write `apps/cascade-docs/next.config.mjs`**

```javascript
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
};

export default withMDX(config);
```

- [ ] **Step 5a: Write `apps/cascade-docs/lib/source.ts`** — Fumadocs source binding

```typescript
import { docs } from '../source.config.js';
import { loader } from 'fumadocs-core/source';

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});
```

- [ ] **Step 5b: Write `apps/cascade-docs/app/layout.tsx`**

```typescript
import { RootProvider } from 'fumadocs-ui/provider';
import 'fumadocs-ui/style.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Cascade — docs',
  description: 'Documentation for Cascade, a self-hosted visual AI workflow editor built on TierFall.',
};

export default function RootLayout({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5c: Write `apps/cascade-docs/app/page.tsx`** — landing page redirects to /docs

```typescript
import { redirect } from 'next/navigation';

export default function Home(): never {
  redirect('/docs');
}
```

- [ ] **Step 5d: Write `apps/cascade-docs/app/docs/layout.tsx`**

```typescript
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '../../lib/source.js';

export default function Layout({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{ title: 'Cascade', url: '/docs' }}
      sidebar={{ defaultOpenLevel: 1 }}
    >
      {children}
    </DocsLayout>
  );
}
```

- [ ] **Step 5e: Write `apps/cascade-docs/app/docs/[[...slug]]/page.tsx`**

```typescript
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { source } from '../../../lib/source.js';

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: PageProps): Promise<React.ReactElement> {
  const resolved = await params;
  const page = source.getPage(resolved.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams(): { slug?: string[] }[] {
  return source.generateParams();
}

export async function generateMetadata({ params }: PageProps): Promise<{ title?: string; description?: string }> {
  const resolved = await params;
  const page = source.getPage(resolved.slug);
  if (!page) return {};
  return { title: page.data.title, description: page.data.description };
}
```

- [ ] **Step 6: Write `apps/cascade-docs/content/docs/index.mdx`**

```mdx
---
title: Cascade
description: Self-hosted visual AI workflow editor built on TierFall.
---

# Cascade

Tier routing is on the canvas, not in a settings panel.

## Quick links

- [Getting Started](/docs/getting-started)
- [Architecture](/docs/architecture)
- [n8n parity matrix](/docs/n8n-parity) (Phase 3 deliverable)

## Why Cascade?

- **Self-hosted by default.** One `docker compose up` and you have the full stack.
- **Compile-to-TypeScript exit door.** Every workflow exports as a real `.ts` file
  that imports `@tierfall/core` — the editor is scaffolding, not lock-in.
- **Vendor-neutral via TierFall.** Routing across local + cloud providers is a
  declarative policy, not a hardcoded per-node provider config.
```

- [ ] **Step 7: Write `apps/cascade-docs/content/docs/getting-started.mdx`**

```mdx
---
title: Getting Started
description: Stand up Cascade locally in under five minutes.
---

# Getting Started

## Prerequisites

- Docker (with `docker compose` v2)
- 4GB RAM available for the stack (more if you enable the `demo` profile with Ollama)

## Boot the stack

```bash
git clone https://github.com/tierfall/cascade.git
cd cascade
cp .env.example .env       # generate secrets via the first-boot wizard
docker compose up -d
```

Open http://localhost:3000 — the first request lands on the setup wizard.
The setup wizard creates the admin account and generates random secrets
(JWT signing key, credentials-at-rest key).

## Try the demo workflow

```bash
docker compose --profile demo up -d
```

This adds an Ollama container with a small local model pre-pulled. Open the
workflow named "Demo: Ollama → OpenAI fallback" and trigger a run — you'll
see tier attribution visible on the read-only canvas.
```

- [ ] **Step 8: Write `apps/cascade-docs/content/docs/architecture.mdx`**

```mdx
---
title: Architecture
description: A 5-minute tour of how Cascade fits together. For the canonical record, read the kickoff spec.
---

# Architecture

The canonical, frozen-in-time architecture record is
[`docs/superpowers/specs/2026-05-22-cascade-kickoff-design.md`](https://github.com/tierfall/cascade/blob/main/docs/superpowers/specs/2026-05-22-cascade-kickoff-design.md).
This page is a 5-minute tour for newcomers.

## The big picture

```
                +-----------------+        +--------+
   Browser ---> |  cascade-web    | -----> |  API   | <---- CLI / Webhooks
                | (Next 15, RF)   |  WS    | (Nest) |
                +-----------------+ <----- +--------+
                                              | uses TierFall
                                              v
                                +-----------------------------+
                                | @tierfall/core + adapters   |
                                | (Ollama / OpenAI / Anthr.)  |
                                +-----------------------------+
```

## Why the layout

- **Apps own state and policy.** `cascade-api` persists everything. `cascade-web` renders
  it. `cascade-mobile` is a v0.1 RN-boundary smoke test.
- **Packages are platform-portable where it matters.** `cascade-tokens`, `cascade-core`,
  `cascade-sdk` are pure TypeScript with no DOM and no Node-only imports — the same
  module runs in Node, browsers, and React Native.
- **TierFall is a dependency, not a fork.** When Cascade needs new routing semantics,
  the change goes upstream into TierFall.
- **The exit door is real.** Every workflow can be exported via `@tierfall/cascade-compiler`
  as a `.ts` file that runs without Cascade at all.

## Data flow at a high level

1. A user (or webhook, or CLI) hits the API with a workflow id + input.
2. The API enqueues the run on BullMQ (Redis-backed).
3. A worker picks it up, walks the graph in topological order, executes each
   node through `cascade-nodes`. LLM nodes route through `@tierfall/core`.
4. Each node execution emits a state-change event on Redis pub/sub.
5. The Socket.IO gateway broadcasts to every subscribed browser.
6. The canvas updates node colors in real time (the "see what happened" promise).
7. The run record (input + per-node outputs + tier attribution + cost) is persisted.

## Self-host stance

One `docker compose up` at the repo root. No external services required. Opt-in
profiles add Ollama (for local LLMs) and MinIO (for S3-compatible storage testing).
```

- [ ] **Step 9: Add a `project.json` target for the docs build** (Nx generated one — verify it has `build` and `start` targets that use Next.js).

- [ ] **Step 10: Smoke-test the build**

```bash
pnpm --filter cascade-docs exec next build
```

- [ ] **Step 11: Write `apps/cascade-docs/CLAUDE.md`**

```markdown
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
```

- [ ] **Step 12: Commit**

```bash
git add apps/cascade-docs/ pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(docs): scaffold cascade-docs Fumadocs site

- Fumadocs 14.6 on Next.js 15.1 — same Next version as cascade-web.
- Content layer: content/docs/*.mdx; nav auto-generated from the file tree.
- Three initial pages: Home, Getting Started, Architecture. n8n-parity page
  populated in Task 19 with the full matrix.
- Bundled into compose stack at port 3001 (Task 17). Vercel public deploy is
  a post-v0.1 follow-up (no Vercel-specific code in repo).
- No coverage threshold per spec §4.5 — content, not logic.
EOF
)"
```

---

## Task 15: Scaffold `cascade-mobile` Expo skeleton with tokens smoke test

**Files:**
- Generate via Expo CLI, then customize:
  - `apps/cascade-mobile/{package.json,app.json,tsconfig.json,index.ts,App.tsx,babel.config.js}`
- Hand-author:
  - `apps/cascade-mobile/project.json` — Nx config with `nx:noop` for `build` so it doesn't run in default Nx batches
  - `apps/cascade-mobile/CLAUDE.md`

This is the **RN-boundary smoke test** for constraint #5. App is excluded from the default Nx build and the default test run. A dedicated CI job (Task 18) builds it against the RN target.

- [ ] **Step 1: Scaffold the Expo app manually** (not via Nx — `@nx/expo` is fine but adds a lot of boilerplate; for a one-screen smoke test, manual is cleaner)

```bash
mkdir -p apps/cascade-mobile
cd apps/cascade-mobile
```

`apps/cascade-mobile/package.json`:

```json
{
  "name": "@tierfall/cascade-mobile",
  "version": "0.0.0",
  "description": "Cascade mobile skeleton. v0.1 RN-boundary smoke test for constraint #5; not a shipping app.",
  "license": "SEE LICENSE IN ../../LICENSE",
  "private": true,
  "main": "index.ts",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "test": "echo 'cascade-mobile: skeleton only — no unit suite in v0.1' && exit 0",
    "typecheck": "tsc --noEmit --pretty false",
    "lint": "eslint --max-warnings=0 ."
  },
  "dependencies": {
    "@tierfall/cascade-tokens": "workspace:*",
    "@tierfall/cascade-sdk": "workspace:*",
    "expo": "52.0.20",
    "expo-status-bar": "2.0.0",
    "react": "19.0.0",
    "react-native": "0.76.5"
  },
  "devDependencies": {
    "@types/react": "19.0.7",
    "typescript": "6.0.3"
  }
}
```

- [ ] **Step 2: Write `apps/cascade-mobile/app.json`**

```json
{
  "expo": {
    "name": "Cascade",
    "slug": "cascade-mobile",
    "version": "0.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "splash": { "backgroundColor": "#0a0a0a" }
  }
}
```

- [ ] **Step 3: Write `apps/cascade-mobile/tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "jsx": "react-jsx"
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

- [ ] **Step 4: Write `apps/cascade-mobile/index.ts`**

```typescript
import { registerRootComponent } from 'expo';
import App from './App.js';

registerRootComponent(App);
```

- [ ] **Step 5: Write `apps/cascade-mobile/App.tsx`** — the smoke test: imports both platform-neutral packages and renders a token-derived element

```typescript
import { colors, spacing, typography } from '@tierfall/cascade-tokens';
import { CascadeClient } from '@tierfall/cascade-sdk';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Boundary proof: the SDK constructor runs on RN without any DOM polyfill.
// We don't actually hit the API — we just prove the constructor type-checks AND
// runs in the RN bundler.
const _client = new CascadeClient({ baseUrl: 'http://localhost:3000' });
void _client;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background.dark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: parseFloat(spacing['6']) * 16, // RN expects pixel numbers
  },
  title: {
    color: colors.neutral.foreground.dark,
    fontFamily: typography.fontFamily.sans.split(',')[0]?.trim() ?? 'System',
    fontSize: parseFloat(typography.fontSize.h1) * 16,
    fontWeight: '700',
    marginBottom: parseFloat(spacing['4']) * 16,
  },
  tierRow: {
    flexDirection: 'row',
    gap: parseFloat(spacing['2']) * 16,
  },
  tierBadge: {
    paddingHorizontal: parseFloat(spacing['2']) * 16,
    paddingVertical: parseFloat(spacing['1']) * 16,
    borderRadius: 9999,
  },
  tierLabel: {
    color: '#ffffff',
    fontSize: parseFloat(typography.fontSize.caption) * 16,
    fontWeight: '500',
  },
});

export default function App(): JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cascade</Text>
      <View style={styles.tierRow}>
        {colors.tier.map((color, i) => (
          <View key={i} style={[styles.tierBadge, { backgroundColor: color }]}>
            <Text style={styles.tierLabel}>Tier {i}</Text>
          </View>
        ))}
      </View>
      <StatusBar style="light" />
    </View>
  );
}
```

- [ ] **Step 6: Write `apps/cascade-mobile/babel.config.js`**

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

- [ ] **Step 7: Write `apps/cascade-mobile/project.json`** — Nx config that EXCLUDES this app from default targets

```json
{
  "name": "cascade-mobile",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/cascade-mobile",
  "projectType": "application",
  "tags": ["scope:rn-boundary-smoke", "type:app", "excluded-from-default"],
  "targets": {
    "build": { "executor": "nx:noop", "configurations": { "skip": {} } },
    "test": { "executor": "nx:run-script", "options": { "script": "test" } },
    "lint": { "executor": "nx:run-script", "options": { "script": "lint" } },
    "typecheck": { "executor": "nx:run-script", "options": { "script": "typecheck" } }
  }
}
```

- [ ] **Step 8: Verify the type-check passes on its own**

```bash
pnpm --filter @tierfall/cascade-mobile typecheck
```

Expected: pass. If tsc complains about `react-native` types not being found, ensure `@types/react` and `react-native`'s bundled types are installed (`pnpm install` from root, which the earlier `pnpm add` calls already did).

- [ ] **Step 9: Verify the lint passes**

```bash
pnpm --filter @tierfall/cascade-mobile lint
```

- [ ] **Step 10: Write `apps/cascade-mobile/CLAUDE.md`**

```markdown
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
```

- [ ] **Step 11: Commit**

```bash
git add apps/cascade-mobile/ pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(mobile): scaffold cascade-mobile Expo skeleton with tokens smoke test

One screen, no features. Proves spec §7.2 platform-neutral boundary:
- @tierfall/cascade-tokens resolves under RN bundler.
- @tierfall/cascade-sdk constructor runs on RN with NO DOM polyfill.
- Token-direct styling (RN StyleSheet pulling from colors.tier[]) reproduces
  the same visual the cascade-web landing page shows.

Excluded from the default Nx build via project.json tags + nx:noop build target.
A dedicated CI job (Task 18) builds this against the RN bundler to catch boundary
breakage early.

No cascade-ui-native sibling package in v0.1 — that's post-v1.0 when mobile ships
real features.
EOF
)"
```

---

## Task 16: Scaffold E2E suites — `cascade-api-e2e` (Testcontainers) and `cascade-web-e2e` (Playwright)

**Files:**
- Create: `apps/cascade-api-e2e/{package.json,project.json,tsconfig.json,jest.config.ts}`
- Create: `apps/cascade-api-e2e/src/{containers.ts,health.e2e-spec.ts}`
- Create: `apps/cascade-web-e2e/{package.json,project.json,tsconfig.json,playwright.config.ts}`
- Create: `apps/cascade-web-e2e/tests/{home.spec.ts}`
- Create: `apps/cascade-web-e2e/CLAUDE.md`, `apps/cascade-api-e2e/CLAUDE.md`

E2E packages have no coverage threshold (they ARE the coverage at the integration layer for the apps). Both suites run in CI: integration on every push, Playwright on PR + main.

- [ ] **Step 1: `apps/cascade-api-e2e/package.json`**

```bash
mkdir -p apps/cascade-api-e2e/src
```

```json
{
  "name": "@tierfall/cascade-api-e2e",
  "version": "0.0.0",
  "description": "Integration tests for cascade-api against real Postgres + Redis (Testcontainers).",
  "license": "SEE LICENSE IN ../../LICENSE",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --experimental-vm-modules ../../node_modules/jest/bin/jest.js --runInBand",
    "lint": "eslint --max-warnings=0 src",
    "typecheck": "tsc --noEmit --pretty false"
  },
  "devDependencies": {
    "@nestjs/testing": "10.4.15",
    "@testcontainers/postgresql": "10.16.0",
    "@testcontainers/redis": "10.16.0",
    "testcontainers": "10.16.0",
    "supertest": "7.0.0",
    "@types/supertest": "6.0.2"
  }
}
```

- [ ] **Step 2: `apps/cascade-api-e2e/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["jest", "node"]
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: `apps/cascade-api-e2e/project.json`**

```json
{
  "name": "cascade-api-e2e",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/cascade-api-e2e/src",
  "projectType": "application",
  "implicitDependencies": ["cascade-api"],
  "tags": ["scope:integration", "type:e2e"],
  "targets": {
    "test": { "executor": "nx:run-script", "options": { "script": "test" } },
    "lint": { "executor": "nx:run-script", "options": { "script": "lint" } },
    "typecheck": { "executor": "nx:run-script", "options": { "script": "typecheck" } }
  }
}
```

- [ ] **Step 4: `apps/cascade-api-e2e/jest.config.ts`** — no coverage; integration suite

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.e2e-spec.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: { module: 'ESNext' } }],
  },
  testTimeout: 120_000, // Testcontainers spin-up is slow on first run
};

export default config;
```

- [ ] **Step 5: `apps/cascade-api-e2e/src/containers.ts`** — Testcontainers wrapper for the per-suite Postgres + Redis

```typescript
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import { execSync } from 'node:child_process';

export interface BackingServices {
  pg: StartedPostgreSqlContainer;
  redis: StartedRedisContainer;
  databaseUrl: string;
  redisUrl: string;
}

export async function startBackingServices(): Promise<BackingServices> {
  const pg = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('cascade_test')
    .withUsername('cascade')
    .withPassword('cascade')
    .start();
  const redis = await new RedisContainer('redis:7-alpine').start();

  const databaseUrl = pg.getConnectionUri();
  const redisUrl = `redis://${redis.getHost()}:${redis.getMappedPort(6379).toString()}`;

  // Apply prisma schema. cascade-api owns the schema; we shell out to its prisma CLI.
  process.env.DATABASE_URL = databaseUrl;
  execSync('pnpm --filter cascade-api exec prisma db push --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  return { pg, redis, databaseUrl, redisUrl };
}

export async function stopBackingServices(services: BackingServices): Promise<void> {
  await services.pg.stop();
  await services.redis.stop();
}
```

- [ ] **Step 6: `apps/cascade-api-e2e/src/health.e2e-spec.ts`** — the v0.1 integration test

```typescript
import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { type BackingServices, startBackingServices, stopBackingServices } from './containers.js';
import { AppModule } from '../../cascade-api/src/app.module.js';

describe('GET /health (integration)', () => {
  let services: BackingServices;
  let app: INestApplication;

  beforeAll(async () => {
    services = await startBackingServices();
    process.env.DATABASE_URL = services.databaseUrl;
    process.env.REDIS_URL = services.redisUrl;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await stopBackingServices(services);
  });

  it('returns status ok when DB is reachable', async () => {
    const response = await request(app.getHttpServer()).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 7: Run the integration suite once locally to confirm Testcontainers works**

```bash
pnpm --filter @tierfall/cascade-api-e2e test
```

Expected: first run takes ~60-90s (pulls postgres:16-alpine + redis:7-alpine images). Subsequent runs ~10s. Test passes.

- [ ] **Step 8: `apps/cascade-api-e2e/CLAUDE.md`** (brief)

```markdown
# cascade-api-e2e — Claude context

**Purpose:** Integration tests for cascade-api against **real** Postgres + Redis
via Testcontainers. NO in-memory fakes, NO mocked databases (spec §8.2).

## Adding a test

1. Pick a feature in cascade-api (e.g., workflows CRUD).
2. Write a `*.e2e-spec.ts` in `src/` that boots the NestJS app via Test.createTestingModule.
3. Use the shared `startBackingServices()` helper for Postgres + Redis.
4. Use supertest to drive HTTP.

Tests run serially (`--runInBand`) so container ports don't collide.

## Hard rules

- No mocks of Prisma, BullMQ, Redis, Socket.IO. If you find yourself reaching for one,
  the test belongs in the unit suite of the relevant package.
- 120s timeout is the per-test cap. First-run container pulls fit inside this; if a
  test runs that long for any other reason, refactor.
```

- [ ] **Step 9: Scaffold `cascade-web-e2e` Playwright suite**

```bash
mkdir -p apps/cascade-web-e2e/tests
```

`apps/cascade-web-e2e/package.json`:

```json
{
  "name": "@tierfall/cascade-web-e2e",
  "version": "0.0.0",
  "description": "Playwright E2E suite for cascade-web. Runs against the full docker compose stack.",
  "license": "SEE LICENSE IN ../../LICENSE",
  "private": true,
  "scripts": {
    "e2e": "playwright test",
    "e2e:install-browsers": "playwright install --with-deps chromium",
    "lint": "eslint --max-warnings=0 tests",
    "typecheck": "tsc --noEmit --pretty false"
  },
  "devDependencies": {
    "@playwright/test": "1.49.1"
  }
}
```

- [ ] **Step 10: `apps/cascade-web-e2e/project.json`**

```json
{
  "name": "cascade-web-e2e",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/cascade-web-e2e/tests",
  "projectType": "application",
  "implicitDependencies": ["cascade-web", "cascade-api"],
  "tags": ["scope:integration", "type:e2e"],
  "targets": {
    "e2e": { "executor": "nx:run-script", "options": { "script": "e2e" }, "cache": false },
    "lint": { "executor": "nx:run-script", "options": { "script": "lint" } },
    "typecheck": { "executor": "nx:run-script", "options": { "script": "typecheck" } }
  }
}
```

- [ ] **Step 11: `apps/cascade-web-e2e/playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

Note: `baseURL` defaults to **3001**, not 3000. The Playwright suite runs against the **compose-up cascade-web** which is exposed on host 3001 to leave 3000 for cascade-api during local dev. The CI workflow (Task 18) sets `PLAYWRIGHT_BASE_URL` explicitly.

- [ ] **Step 12: `apps/cascade-web-e2e/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["@playwright/test", "node"]
  },
  "include": ["tests/**/*.ts", "playwright.config.ts"]
}
```

- [ ] **Step 13: `apps/cascade-web-e2e/tests/home.spec.ts`**

```typescript
import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
  test('renders Cascade landing with tier ramp and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Cascade' })).toBeVisible();
    await expect(page.getByLabel('tier ramp preview')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
  });

  test('renders all five tier badges', async ({ page }) => {
    await page.goto('/');
    for (let tier = 0; tier <= 4; tier += 1) {
      await expect(page.getByText(`Tier ${tier}`)).toBeVisible();
    }
  });

  test('serves dark mode by default (background is near-black)', async ({ page }) => {
    await page.goto('/');
    const bg = await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor);
    // background-dark token is #0a0a0a -> rgb(10, 10, 10)
    expect(bg).toMatch(/rgb\(\s*10,\s*10,\s*10\s*\)/);
  });
});
```

- [ ] **Step 14: Install Playwright browsers locally** (CI does this in its workflow)

```bash
pnpm --filter @tierfall/cascade-web-e2e exec playwright install --with-deps chromium
```

- [ ] **Step 15: Smoke-test the Playwright config validates** (no run; the stack isn't up yet)

```bash
pnpm --filter @tierfall/cascade-web-e2e exec playwright test --list
```

Expected: 3 tests listed. No execution — `--list` is dry-run.

- [ ] **Step 16: `apps/cascade-web-e2e/CLAUDE.md`**

```markdown
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
```

- [ ] **Step 17: Commit**

```bash
git add apps/cascade-api-e2e/ apps/cascade-web-e2e/ pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
test(e2e): scaffold cascade-api-e2e (Testcontainers) and cascade-web-e2e (Playwright)

cascade-api-e2e:
- Boots real Postgres 16 + Redis 7 via Testcontainers — no in-memory fakes.
- Applies the prisma schema via `prisma db push` in the test setup.
- One initial test: GET /health round-trips through the real DB.
- Runs serially via --runInBand. 120s test timeout (covers first-run image pulls).

cascade-web-e2e:
- Playwright 1.49 against chromium. baseURL = http://localhost:3001 (the
  compose-exposed cascade-web port).
- Three initial tests: home renders, tier ramp x5 visible, dark mode default.
- forbidOnly + retries=1 in CI. Reporters: github + html.

Spec ref: §8.2 (integration), §8.3 (E2E), §8.4 (no-flake-tolerance policy).
EOF
)"
```

---

## Task 17: Add `docker-compose.yml` with profiles and per-app Dockerfiles

**Files:**
- Create: `docker-compose.yml` (single file, profile-tagged services)
- Create: `.env.example` (root — base stack env vars)
- Create: `apps/cascade-api/Dockerfile`
- Create: `apps/cascade-web/Dockerfile`
- Create: `apps/cascade-docs/Dockerfile`
- Create: `.dockerignore`

Each Dockerfile is multi-stage: deps → builder → runner. Final images use the `node:24-alpine` runner. No platform-specific code paths.

- [ ] **Step 1: Write `.dockerignore`**

```
.git
.github
.husky
.nx
.gitnexus
**/node_modules
**/dist
**/.next
**/.expo
**/coverage
**/playwright-report
**/test-results
docs/superpowers/specs
docs/superpowers/plans
docs/adrs
*.md
LICENSE
CODE_OF_CONDUCT.md
SECURITY.md
.env
.env.local
.env.*.local
```

- [ ] **Step 2: Write `apps/cascade-api/Dockerfile`** (multi-stage)

```dockerfile
# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS base
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS deps
WORKDIR /repo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/cascade-api/package.json apps/cascade-api/
COPY packages/cascade-core/package.json packages/cascade-core/
COPY packages/cascade-sdk/package.json packages/cascade-sdk/
COPY packages/cascade-nodes/package.json packages/cascade-nodes/
COPY packages/cascade-tokens/package.json packages/cascade-tokens/
RUN pnpm install --frozen-lockfile --filter cascade-api...

FROM deps AS builder
WORKDIR /repo
COPY . .
RUN pnpm --filter cascade-api exec prisma generate
RUN pnpm --filter cascade-api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/cascade-api/dist ./dist
COPY --from=builder /repo/apps/cascade-api/prisma ./prisma
COPY --from=builder /repo/apps/cascade-api/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

- [ ] **Step 3: Write `apps/cascade-web/Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS base
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS deps
WORKDIR /repo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/cascade-web/package.json apps/cascade-web/
COPY packages/cascade-tokens/package.json packages/cascade-tokens/
COPY packages/cascade-ui/package.json packages/cascade-ui/
COPY packages/cascade-sdk/package.json packages/cascade-sdk/
COPY packages/cascade-core/package.json packages/cascade-core/
RUN pnpm install --frozen-lockfile --filter cascade-web...

FROM deps AS builder
WORKDIR /repo
COPY . .
RUN pnpm --filter cascade-web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/apps/cascade-web/.next/standalone ./
COPY --from=builder /repo/apps/cascade-web/.next/static ./apps/cascade-web/.next/static
COPY --from=builder /repo/apps/cascade-web/public ./apps/cascade-web/public 2>/dev/null || true
EXPOSE 3000
CMD ["node", "apps/cascade-web/server.js"]
```

For `next.config.js` to emit the `standalone` build artifact, set `output: 'standalone'` in the Next config. **Add a follow-up step**: in `apps/cascade-web/next.config.js`, change to:

```javascript
/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'standalone',
};

export default config;
```

- [ ] **Step 4: Write `apps/cascade-docs/Dockerfile`** (same pattern as cascade-web)

```dockerfile
# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS base
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS deps
WORKDIR /repo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/cascade-docs/package.json apps/cascade-docs/
RUN pnpm install --frozen-lockfile --filter cascade-docs...

FROM deps AS builder
WORKDIR /repo
COPY . .
RUN pnpm --filter cascade-docs build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/apps/cascade-docs/.next/standalone ./
COPY --from=builder /repo/apps/cascade-docs/.next/static ./apps/cascade-docs/.next/static
EXPOSE 3001
CMD ["node", "apps/cascade-docs/server.js"]
```

Set `output: 'standalone'` in `apps/cascade-docs/next.config.mjs` too.

- [ ] **Step 5: Write the root `.env.example`**

```
# Cascade — root environment variables. Copy to .env for `docker compose up`.

# Ports exposed on the HOST. Container-internal ports are fixed.
CASCADE_API_PORT=3000
CASCADE_WEB_PORT=3001
CASCADE_DOCS_PORT=3002

# Postgres
POSTGRES_DB=cascade
POSTGRES_USER=cascade
POSTGRES_PASSWORD=cascade_change_me_on_first_boot
POSTGRES_PORT=5432

# Redis
REDIS_PORT=6379

# Ollama (--profile demo)
OLLAMA_PORT=11434
OLLAMA_MODEL=llama3.2:3b

# MinIO (--profile minio)
MINIO_ROOT_USER=cascade
MINIO_ROOT_PASSWORD=cascade_change_me_on_first_boot
MINIO_API_PORT=9000
MINIO_CONSOLE_PORT=9001
```

- [ ] **Step 6: Write `docker-compose.yml`** — the single-file profile-tagged stack

```yaml
name: cascade

x-base-env: &base-env
  NODE_ENV: production

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-cascade}
      POSTGRES_USER: ${POSTGRES_USER:-cascade}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-cascade}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER:-cascade}"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

  api:
    build:
      context: .
      dockerfile: apps/cascade-api/Dockerfile
    image: ghcr.io/tierfall/cascade-api:dev
    restart: unless-stopped
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_healthy }
    environment:
      <<: *base-env
      DATABASE_URL: postgres://${POSTGRES_USER:-cascade}:${POSTGRES_PASSWORD:-cascade}@postgres:5432/${POSTGRES_DB:-cascade}?schema=public
      REDIS_URL: redis://redis:6379
      PORT: 3000
      STORAGE_DRIVER: ${STORAGE_DRIVER:-local}
      STORAGE_LOCAL_DIR: /data/storage
    volumes:
      - api-storage:/data/storage
    ports:
      - "${CASCADE_API_PORT:-3000}:3000"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 10s
      timeout: 3s
      retries: 5

  web:
    build:
      context: .
      dockerfile: apps/cascade-web/Dockerfile
    image: ghcr.io/tierfall/cascade-web:dev
    restart: unless-stopped
    depends_on:
      api: { condition: service_healthy }
    environment:
      <<: *base-env
      CASCADE_API_URL: http://api:3000
    ports:
      - "${CASCADE_WEB_PORT:-3001}:3000"

  docs:
    build:
      context: .
      dockerfile: apps/cascade-docs/Dockerfile
    image: ghcr.io/tierfall/cascade-docs:dev
    restart: unless-stopped
    ports:
      - "${CASCADE_DOCS_PORT:-3002}:3001"

  ollama:
    image: ollama/ollama:latest
    profiles: ["demo"]
    restart: unless-stopped
    ports:
      - "${OLLAMA_PORT:-11434}:11434"
    volumes:
      - ollama-models:/root/.ollama
    healthcheck:
      test: ["CMD", "ollama", "list"]
      interval: 15s
      timeout: 5s
      retries: 10

  minio:
    image: minio/minio:latest
    profiles: ["minio"]
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-cascade}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-cascade}
    ports:
      - "${MINIO_API_PORT:-9000}:9000"
      - "${MINIO_CONSOLE_PORT:-9001}:9001"
    volumes:
      - minio-data:/data
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  postgres-data:
  redis-data:
  api-storage:
  ollama-models:
  minio-data:
```

- [ ] **Step 7: Smoke-test the compose stack builds**

```bash
docker compose build api web docs
```

Expected: three images built. First build takes 5-10 minutes (deps + transpilation). Subsequent builds are cache-fast.

- [ ] **Step 8: Smoke-test the base stack comes up**

```bash
docker compose up -d
docker compose ps
curl -fsS http://localhost:3000/health
docker compose down -v
```

Expected: `/health` returns `{"status":"ok"}` after the api container becomes healthy.

- [ ] **Step 9: Smoke-test the `demo` profile** (only if Ollama image pull is acceptable in the environment)

```bash
docker compose --profile demo up -d
docker compose ps   # ollama should be listed
docker compose down -v
```

- [ ] **Step 10: Commit**

```bash
git add docker-compose.yml .env.example .dockerignore \
        apps/cascade-api/Dockerfile apps/cascade-web/Dockerfile apps/cascade-docs/Dockerfile \
        apps/cascade-web/next.config.js apps/cascade-docs/next.config.mjs
git commit -m "$(cat <<'EOF'
chore(docker): add docker-compose.yml with profiles and per-app Dockerfiles

Single docker-compose.yml at repo root with Compose profiles (spec §5.1):
- Base stack (no profile): postgres, redis, api, web, docs.
- `--profile demo` adds Ollama (multi-GB image, opt-in).
- `--profile minio` adds MinIO for S3-compatible storage testing.

Multi-stage Dockerfiles for api / web / docs:
- base: node:24-alpine + pnpm 10.33 via corepack.
- deps: minimal lockfile install scoped to each app's filter graph.
- builder: full repo copy + workspace build.
- runner: copies only dist + node_modules (api) or Next standalone bundle (web/docs).

Healthchecks on postgres, redis, api, ollama, minio so `docker compose up` waits
for dependency readiness. api `depends_on` ensures it boots after postgres + redis
report healthy.

next.config emits `output: 'standalone'` for web AND docs so the runner stage
needs only the standalone bundle (smaller images, faster startup).
EOF
)"
```

---

## Task 18: Add GitHub Actions workflows and codecov.yml

**Files:**
- Create: `.github/workflows/ci.yml` — lint + typecheck + unit + build on every push.
- Create: `.github/workflows/integration.yml` — Testcontainers integration on push to `develop` + PRs.
- Create: `.github/workflows/e2e.yml` — Playwright against compose stack on PR + main.
- Create: `.github/workflows/rn-boundary.yml` — platform-neutral boundary check.
- Create: `.github/workflows/release.yml` — `develop → main` PR triggers npm publish + GHCR push.
- Create: `codecov.yml` — patch coverage 100% blocking; project coverage as a status check.
- Create: `.github/dependabot.yml` — mirror TierFall's pattern.

Codecov gating per spec §4.5 / constraint #18.

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

```yaml
name: ci

on:
  push:
    branches: [develop, main]
  pull_request:

jobs:
  lint-typecheck-unit:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: pnpm/action-setup@v6
        with: { version: 10.33.0 }
      - uses: actions/setup-node@v6
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec nx affected -t lint --parallel=3
      - run: pnpm exec nx affected -t typecheck --parallel=3
      - run: pnpm exec nx affected -t test --parallel=3 -- --coverage
      - name: Upload coverage to Codecov
        if: always()
        uses: codecov/codecov-action@v5
        with:
          fail_ci_if_error: true
          flags: unit
          token: ${{ secrets.CODECOV_TOKEN }}
```

- [ ] **Step 2: Write `.github/workflows/integration.yml`**

```yaml
name: integration

on:
  push:
    branches: [develop, main]
  pull_request:

jobs:
  testcontainers:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: pnpm/action-setup@v6
        with: { version: 10.33.0 }
      - uses: actions/setup-node@v6
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter cascade-api exec prisma generate
      - run: pnpm --filter cascade-api build
      - run: pnpm --filter @tierfall/cascade-api-e2e test
```

- [ ] **Step 3: Write `.github/workflows/e2e.yml`**

```yaml
name: e2e

on:
  push:
    branches: [main]
  pull_request:

jobs:
  playwright:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: pnpm/action-setup@v6
        with: { version: 10.33.0 }
      - uses: actions/setup-node@v6
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @tierfall/cascade-web-e2e e2e:install-browsers
      - name: Build compose images
        run: docker compose build api web
      - name: Bring up the stack
        run: |
          cp .env.example .env
          docker compose up -d --wait
      - name: Run Playwright
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3001
        run: pnpm --filter @tierfall/cascade-web-e2e e2e
      - name: Compose logs on failure
        if: failure()
        run: docker compose logs
      - name: Bring down the stack
        if: always()
        run: docker compose down -v
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: apps/cascade-web-e2e/playwright-report
          retention-days: 14
```

- [ ] **Step 4: Write `.github/workflows/rn-boundary.yml`** — enforces platform-neutral boundary

```yaml
name: rn-boundary

on:
  push:
    branches: [develop, main]
  pull_request:
    paths:
      - 'packages/cascade-tokens/**'
      - 'packages/cascade-core/**'
      - 'packages/cascade-sdk/**'
      - 'apps/cascade-mobile/**'
      - 'tools/check-platform-neutral.mjs'
      - 'tools/rn-target-tsconfig.json'

jobs:
  check-boundary:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: pnpm/action-setup@v6
        with: { version: 10.33.0 }
      - uses: actions/setup-node@v6
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Lint + RN-target tsc on platform-neutral packages
        run: node tools/check-platform-neutral.mjs
      - name: TypeCheck cascade-mobile against Expo
        run: pnpm --filter @tierfall/cascade-mobile typecheck
```

- [ ] **Step 5: Write `.github/workflows/release.yml`** — triggered by tags on `main`

```yaml
name: release

on:
  push:
    tags: ['v*.*.*']

jobs:
  publish-npm:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: pnpm/action-setup@v6
        with: { version: 10.33.0 }
      - uses: actions/setup-node@v6
        with:
          node-version-file: .nvmrc
          cache: pnpm
          registry-url: https://registry.npmjs.org
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec nx run-many -t build
      - run: pnpm exec nx release publish --skip-publish=false
        env:
          NPM_CONFIG_PROVENANCE: true
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  publish-ghcr:
    needs: publish-npm
    runs-on: ubuntu-latest
    timeout-minutes: 45
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        app: [cascade-api, cascade-web, cascade-docs]
    steps:
      - uses: actions/checkout@v6
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push image
        uses: docker/build-push-action@v6
        with:
          context: .
          file: apps/${{ matrix.app }}/Dockerfile
          push: true
          tags: |
            ghcr.io/tierfall/${{ matrix.app }}:${{ github.ref_name }}
            ghcr.io/tierfall/${{ matrix.app }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

- [ ] **Step 6: Write `codecov.yml`** — patch coverage 100% blocking, project coverage informational

```yaml
coverage:
  status:
    project:
      default:
        target: auto
        threshold: 1%   # tolerate a 1pp drop from baseline
        informational: false
    patch:
      default:
        target: 100%
        threshold: 0%
        only_pulls: true
        informational: false

comment:
  layout: 'diff, files, components'
  require_changes: true
  behavior: default

component_management:
  individual_components:
    - component_id: cascade_tokens
      paths: [packages/cascade-tokens/**]
    - component_id: cascade_core
      paths: [packages/cascade-core/**]
    - component_id: cascade_sdk
      paths: [packages/cascade-sdk/**]
    - component_id: cascade_ui
      paths: [packages/cascade-ui/**]
    - component_id: cascade_nodes
      paths: [packages/cascade-nodes/**]
    - component_id: cascade_compiler
      paths: [packages/cascade-compiler/**]
    - component_id: cascade_cli
      paths: [packages/cascade-cli/**]
    - component_id: cascade_api
      paths: [apps/cascade-api/**]
    - component_id: cascade_web
      paths: [apps/cascade-web/**]
```

This **diverges from TierFall's `codecov.yml`** (which uses `informational: true`). Cascade's constraint #18 requires blocking patch coverage; TierFall is library code where the project's chosen to keep it informational.

- [ ] **Step 7: Write `.github/dependabot.yml`** (mirror TierFall's pattern)

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
    open-pull-requests-limit: 10
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
    open-pull-requests-limit: 10
    versioning-strategy: increase
    groups:
      nx-and-friends:
        patterns: ["@nx/*", "nx"]
      eslint-and-friends:
        patterns: ["eslint", "@eslint*", "typescript-eslint", "*-eslint*"]
      jest-and-friends:
        patterns: ["jest", "ts-jest", "@types/jest"]
      prisma:
        patterns: ["prisma", "@prisma/*"]
      next-react:
        patterns: ["next", "react", "react-dom", "@types/react*"]
```

- [ ] **Step 8: Smoke-test workflows lint with `actionlint`** (optional, recommended)

```bash
docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:latest -color
```

If `actionlint` reports errors, fix them before commit.

- [ ] **Step 9: Commit**

```bash
git add .github/ codecov.yml
git commit -m "$(cat <<'EOF'
chore(ci): add GitHub Actions workflows for lint, test, e2e, build, coverage

Five workflows + codecov config:
- ci.yml: lint + typecheck + affected unit tests on every push/PR. Uploads
  coverage to Codecov with the `unit` flag.
- integration.yml: Testcontainers-backed cascade-api-e2e on push/PR.
- e2e.yml: Playwright against the docker compose stack on PR + main. Uploads
  playwright-report on failure.
- rn-boundary.yml: runs tools/check-platform-neutral.mjs on touches to the
  three platform-neutral packages OR cascade-mobile.
- release.yml: tag-driven. nx release publish to npm + per-app Dockerfile
  builds pushed to ghcr.io/tierfall/cascade-*. npm provenance enabled.

codecov.yml:
- Patch coverage 100% BLOCKING on PRs (constraint #18; diverges from TierFall's
  informational config — Cascade is application code with hard patch-coverage gate).
- Project coverage informational with 1pp tolerance from baseline.
- Per-component breakdown so PRs show coverage delta per package/app.

dependabot.yml: weekly npm + github-actions updates, grouped (nx, eslint, jest,
prisma, next/react) so PR volume stays manageable.
EOF
)"
```

---

## Task 19: Final documentation, ADRs, PR template, root contexts, gitnexus index, push develop

**Files:**
- Create: `README.md`, `CONTRIBUTING.md`, `CLAUDE.md` (root), `AGENTS.md` (root — gitnexus generates the bulk; we author the framing header)
- Create: `docs/testing.md`, `docs/n8n-parity.md`
- Create: `docs/adrs/0001-mirror-tierfall-toolchain.md` through `docs/adrs/0012-single-admin-auth-in-v01.md`
- Create: `.github/pull_request_template.md`, `.github/CODEOWNERS`

After commit: run `gitnexus index`, commit the generated `AGENTS.md` (refresh), push `develop` to GitHub. **This is also where the v0.1 Backlog issues get created** via the gh CLI script in Appendix A.

- [ ] **Step 1: Write `README.md`**

```markdown
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
```

- [ ] **Step 2: Write `CONTRIBUTING.md`** (~80 lines covering: prerequisites, the dev loop, branch model, commit format, DCO, PR checklist, how to run each test layer)

```markdown
# Contributing to Cascade

## Prerequisites

- Node `>=24.0.0 <25.0.0` (see `.nvmrc`)
- pnpm `>=10.0.0` (we pin `pnpm@10.33.0`)
- Docker with `docker compose` v2

## Dev loop

```bash
pnpm install
pnpm exec husky      # sets up pre-commit hooks (runs automatically on `pnpm install` too)
pnpm test            # all unit tests
pnpm test:int        # integration tests (Testcontainers — spins up Postgres + Redis)
pnpm test:e2e        # Playwright against `docker compose up`
pnpm check           # lint + typecheck + test + build, all in parallel
```

## Branch model

- `main` — stable, tagged releases only. Branch-protected: required status checks,
  required review, no force pushes.
- `develop` — integration branch. All feature work merges here via PR.
- Feature branches: `feat/*`, `fix/*`, `chore/*`, `docs/*`, `test/*`, `refactor/*`.

Releases: PR `develop → main`, titled `release: vX.Y.Z`. Tag applied to `main` after merge.

## Commits

- [Conventional Commits](https://www.conventionalcommits.org/), enforced by `commitlint`.
- DCO sign-off required (`git commit -s` — the `prepare-commit-msg` hook adds the trailer if you forget).
- `--no-verify` is forbidden. If pre-commit fails, fix the issue.
- **No AI/assistant co-author trailers** — commits are attributed solely to the human author.

## Coverage gates

Per [spec §4.5](docs/superpowers/specs/2026-05-22-cascade-kickoff-design.md):

| Package tier | Floor |
| --- | --- |
| Platform-neutral (`cascade-tokens`, `cascade-core`, `cascade-sdk`) | 100% |
| Library (`cascade-ui`, `cascade-nodes`, `cascade-compiler`, `cascade-cli`) | 95% |
| App (`cascade-web`, `cascade-api`) | 90% |
| Docs | n/a |

PR-level: **100% patch coverage** — every new line covered by a test in the same PR.

## PR checklist (template enforces)

- [ ] Tests added for changes (specify edge cases).
- [ ] Coverage delta acceptable (Codecov comment on PR).
- [ ] Docs updated if user-facing.
- [ ] n8n-parity matrix updated if applicable.
- [ ] No `any`, no `@ts-ignore`, no `eslint-disable`.
- [ ] DCO signed off.

## Testing strategy

See [docs/testing.md](docs/testing.md).
```

- [ ] **Step 3: Write `docs/testing.md`** — the testing strategy document

```markdown
# Testing strategy

Three layers. All wired into CI. No layer is optional.

## Layer 1 — Unit tests (Jest 29.x + ts-jest 29.x)

Every public function in every package. Coverage thresholds enforced per-package via
`coverageThreshold` in each `jest.config.ts`:

| Package | Threshold | Notes |
| --- | --- | --- |
| `cascade-tokens` | 100% | pure TS, no excuses |
| `cascade-core` | 100% | augmented by fast-check property tests |
| `cascade-sdk` | 100% | fetch injectable for testing without DOM polyfills |
| `cascade-ui` | 95% | React Testing Library + jsdom |
| `cascade-nodes` | 95% | node-type stubs + http handler |
| `cascade-compiler` | 95% | compile + emit |
| `cascade-cli` | 95% | parseArgs + runCommand |
| `cascade-web` | 90% | layout/page/route excluded — covered by Playwright |
| `cascade-api` | 90% | main.ts/module.ts excluded — covered by Testcontainers |
| `cascade-docs` | n/a | content, not logic |

Aspirational target is 100% project-wide; the table is the gate.

Edge-case coverage is mandatory in PRs (constraint #18). Tests must explicitly cover:
- null inputs
- undefined inputs
- empty collections
- boundary values (zero, one, max)
- error paths
- at least one negative test per public function added/modified
- race conditions where applicable

## Layer 2 — Integration tests (Testcontainers, in `apps/cascade-api-e2e`)

**Real** Postgres + Redis + BullMQ. No in-memory fakes.

Covers:
- Workflow CRUD against real DB
- Full workflow execution against real queue
- WebSocket gateway with real Redis pub/sub
- Encrypted credential storage round-trip
- Multi-tenant isolation (data-model verification, forward-looking for v0.5)

First run pulls `postgres:16-alpine` and `redis:7-alpine` (~60s); subsequent runs <15s.
Suite runs serially (`--runInBand`) so container ports don't collide.

## Layer 3 — E2E tests (Playwright, in `apps/cascade-web-e2e`)

Browser-driven, run against the full `docker compose up` stack. NOT against a dev server.
NOT against mocked services.

CI orchestrates: build images → `docker compose up -d --wait` → run Playwright → tear down.

Covers (v0.1):
- Home page renders with design system applied (dark mode default).
- Tier ramp displays.
- CTA button renders.

Backlogged additions (each landed as a separate v0.1 issue):
- Workflow graph displays from API.
- Live execution feedback updates node colors via WebSocket.
- CLI-triggered run appears in UI history.
- Webhook trigger creates a visible run.
- Error states display correctly.
- Keyboard navigation works on every interactive element.

## Property-based tests (fast-check)

Used in `cascade-core` to augment example-based tests for pure functions:
- Graph utilities (`hasCycle`, `topologicalSort`, `reachableFrom`).
- Workflow schema rejection paths (random invalid `id`, etc.).

Stryker mutation testing is **deferred to v0.2+** (spec §4.4). The 30+ min mutation runs
would dominate scaffolding-phase CI; revisit once the suite stabilizes.

## Flake policy

A test that fails intermittently is broken. Quarantine via `.skip` requires:
- A tracked GitHub issue
- A fix deadline in the test comment

CI fails on any flake detected by automatic retry. Retries (1 in Playwright config) are
for genuine network blips, NOT for masking broken tests.

## CI orchestration

| Workflow | Trigger | Layers |
| --- | --- | --- |
| `ci.yml` | every push + PR | Unit (affected) + Codecov upload |
| `integration.yml` | every push + PR | Integration (Testcontainers) |
| `e2e.yml` | PR + main | E2E (Playwright against compose) |
| `rn-boundary.yml` | tokens/core/sdk/mobile changes | RN-target tsc + ESLint boundary |
| `release.yml` | tag on main | Build, npm publish, GHCR push |
```

- [ ] **Step 4: Write `docs/n8n-parity.md`** — the parity matrix (constraint #7)

```markdown
# n8n parity matrix

Living document. Updated in every PR that lands a feature touching this matrix
(see PR template). v0.1 release requires every row to have a non-empty Cascade status.

Legend:
- ✅ covered in current release
- 🟡 planned for vN.x (annotated)
- 🔵 differs intentionally (rationale linked)
- ⚫ explicitly out of scope (rationale linked)

## Core concepts

| n8n feature | Cascade status (v0.1) | Notes |
| --- | --- | --- |
| Workflows (JSON definition) | ✅ | `cascade-core/src/workflow-schema.ts` is the public contract (spec §9). |
| Visual editor (drag-drop) | 🟡 v0.2 | v0.1 ships a read-only canvas. |
| Nodes (extensible) | 🟡 v0.7 (plugin SDK) | v0.1 has four built-in types: llm, conditional, transform, http. |
| Credentials (encrypted at rest) | 🟡 v0.1 backlog (`B-API-CREDENTIALS`) | Schema lands in v0.1; UI for managing them is v0.2. |
| Per-node provider config | 🔵 differs | Cascade uses TierFall declarative policy instead. See [ADR 0006](adrs/0006-cascade-tokens-as-ssot.md) for the broader stance. |
| Manual trigger | ✅ | `triggers: [{ kind: 'manual' }]`. |
| Webhook trigger | ✅ | `triggers: [{ kind: 'webhook', path }]`. |
| Cron trigger | 🟡 v0.4 | Backlog issue `B-TRIG-CRON`. |
| File watcher trigger | 🟡 v0.4 | Backlog issue `B-TRIG-FILE`. |

## Execution

| n8n feature | Cascade status (v0.1) | Notes |
| --- | --- | --- |
| Run history | ✅ | `Run` + `NodeExecution` tables. |
| Deterministic replay | ✅ | Full input + per-node output persisted per run. Spec §12 / constraint #12. |
| Live execution feedback | ✅ | Socket.IO from API; node-color updates on canvas. Constraint #11. |
| Execution safety limits | ✅ | Max nodes / duration / cost / retries env-configurable. Spec §5.7. |
| Pause/resume | ⚫ | Not in roadmap; explicit YAGNI. |
| Subworkflows | 🟡 v0.4 | Schema-version=`1.1.0` will introduce. |

## Operations

| n8n feature | Cascade status (v0.1) | Notes |
| --- | --- | --- |
| Self-hosted Docker | ✅ | Single `docker compose up`. Spec §5.1. |
| Bundled local LLM | ✅ | `--profile demo` (Ollama). |
| Pluggable storage (S3) | ✅ | `STORAGE_DRIVER=s3` env var. Spec §5.3. |
| Multi-tenant + RBAC | 🟡 v0.5 | v0.1 is single-admin. Spec §5.5. |
| Plugin SDK (third-party nodes) | 🟡 v0.7 | Workflow schema is forward-compatible. |
| Marketplace | 🟡 v1.0 | Roadmap item. |
| Cloud edition | ⚫ until v1.0 | Architectural neutrality preserved; license (SUL) protects the opportunity. |

## Compatibility

| n8n feature | Cascade status (v0.1) | Notes |
| --- | --- | --- |
| Import n8n workflows | 🟡 community (post-v1.0) | Schema mapper would be third-party. |
| Export workflows as TypeScript | ✅ unique to Cascade | `@tierfall/cascade-compiler`. |
```

- [ ] **Step 5: Write the twelve ADRs** — each follows the template from the spec's ADR Roster section. Example for ADR 0001 below; the executor lands all twelve in this commit:

`docs/adrs/0001-mirror-tierfall-toolchain.md`:

```markdown
# ADR 0001: Mirror TierFall toolchain conventions

**Status:** Accepted (2026-05-22)
**Spec reference:** `docs/superpowers/specs/2026-05-22-cascade-kickoff-design.md` §2

## Context

Cascade lives next to the TierFall repo and depends on it. The team's working
conventions are already established by TierFall — pnpm, Nx, Node 24, DCO sign-off,
ESLint flat config with no escape hatches. The kickoff asked whether Cascade
should adopt these exactly, partially, or fresh.

## Decision

Mirror TierFall exactly:
- pnpm 10.33.0 (locked via `packageManager` in package.json)
- Node `>=24.0.0 <25.0.0`
- DCO sign-off via `git commit -s` (prepare-commit-msg hook auto-appends)
- Specs at `docs/superpowers/specs/`, plans at `docs/superpowers/plans/`
- Same eslint.config.mjs shape, same lint-staged config, same commitlint enum

## Consequences

- Zero cognitive friction switching between repos.
- Anyone with Node 20 must bump (Node 24 is mandatory).
- Bumping pnpm/Node/Nx is coordinated across both repos.

## Alternatives considered

- **Mirror but skip DCO** — rejected; DCO is already proven and easy.
- **Use kickoff's Node 20 floor with npm** — rejected; diverges from TierFall.
```

**ADRs 0002–0012 (full content for each):**

`docs/adrs/0002-compose-profiles-not-overlays.md`:

```markdown
# ADR 0002: Compose profiles, not overlay files

**Status:** Accepted (2026-05-22)
**Spec reference:** §5.1

## Context
Hard constraint #3 of the kickoff requires `docker compose up` at the repo root to bring up the
full stack. The bundled-demo (Ollama) and bundled-S3 (MinIO) are tradeoffs: useful for some
self-hosters, multi-GB or extra-port overhead for others.

## Decision
Single `docker-compose.yml`. Optional services tagged with `profiles: [demo]` or `profiles: [minio]`.
Activate via `docker compose --profile demo up` / `--profile minio`. **No** overlay files
(`-f compose.demo.yml`).

## Consequences
- One file, one mental model. `docker compose ps` shows base by default.
- Activation syntax is `--profile`, not `-f`.
- Self-hosters with their own Ollama / MinIO opt out by ignoring the profiles.

## Alternatives considered
- Minimal-only (no profiles) — rejected; the bundled-demo path is too valuable.
- Full-always (Ollama always bundled) — rejected; image bloat and runtime collision risk.
- Overlay files — rejected; profiles are idiomatic in Compose v2.
```

`docs/adrs/0003-prisma-as-orm.md`:

```markdown
# ADR 0003: Prisma as the ORM

**Status:** Accepted (2026-05-22)
**Spec reference:** §4.2

## Context
cascade-api needs an ORM that gives strict-TS types, robust migration management for
self-hosters upgrading versions, and good DX. Constraint #13 (no `@ts-ignore`, no
`eslint-disable`) eliminates ORMs that need lint suppressions to compile under
`exactOptionalPropertyTypes`.

## Decision
Prisma 6.x. Schema-first via `apps/cascade-api/prisma/schema.prisma`. `prisma migrate deploy`
on container boot.

## Consequences
- Best-in-class generated types match our strict-TS posture.
- Rock-solid migration story for self-host upgrades.
- ~50MB Rust query engine in the image (acceptable for self-hosted).
- Generated client requires a postinstall step (handled in the Docker `builder` stage).

## Alternatives considered
- **TypeORM** — rejected. Documented decorator-metadata friction with `exactOptionalPropertyTypes`
  pushes teams toward lint suppressions, which contradicts constraint #14.
- **Drizzle** — strong contender, lighter, no codegen binary. Rejected for v0.1 because
  Prisma's ecosystem maturity + migration ergonomics win during the formative period.
  Revisit post-v1.0.
```

`docs/adrs/0004-zustand-for-canvas-state.md`:

```markdown
# ADR 0004: Zustand for ReactFlow canvas state

**Status:** Accepted (2026-05-22)
**Spec reference:** §6.1

## Context
ReactFlow's graph state (nodes/edges) is inherently shape-y. v0.2 brings the visual editor,
and constraint #11 requires live WebSocket-driven node-color updates without re-rendering
the whole canvas. The state library has to support efficient partial subscriptions.

## Decision
Zustand 5.x. Selector-based partial subscriptions feed only the components that care.

## Consequences
- ~1KB runtime cost.
- ReactFlow's own documentation uses Zustand — community alignment.
- Smooth path to v0.2 editor.

## Alternatives considered
- **Jotai** — atomic, but the array-shaped nodes/edges fight the atomic model.
- **Redux Toolkit** — overkill at ~12KB; devtools nice but not enough to justify the weight.
```

`docs/adrs/0005-n8n-sustainable-use-license.md`:

```markdown
# ADR 0005: n8n Sustainable Use License

**Status:** Accepted (2026-05-22)
**Spec reference:** §10.1

## Context
Constraint #22 mandates a fair-code license (NOT MIT/Apache 2.0) that permits free
self-hosting (individual, commercial, internal) and restricts running Cascade as a
multi-tenant hosted service for third parties.

## Decision
n8n Sustainable Use License v1.0.

## Consequences
- Free for self-hosters, restricted only on the hosted-service-for-third-parties vector.
- Battle-tested since 2022 in the n8n ecosystem.
- Philosophically congruent — Cascade is positioned as an n8n alternative; using n8n's
  license signals alignment.

## Alternatives considered
- **Elastic License v2** — mature, but no narrative payoff vs SUL given the n8n positioning.
- **BSL with Change Date** — adds a time-bomb (`converts to Apache 2.0 in N years`).
  Some users find it reassuring; others confusing. SUL is simpler.
- **Apache 2.0 / MIT** — explicitly excluded by constraint #22.
```

`docs/adrs/0006-cascade-tokens-as-ssot.md`:

```markdown
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
```

`docs/adrs/0007-codecov-for-coverage.md`:

```markdown
# ADR 0007: Codecov for coverage reporting

**Status:** Accepted (2026-05-22)
**Spec reference:** §4.3

## Context
Constraint #18 requires 100% patch coverage on every PR. The tool needs robust diff-level
analysis and a clear PR comment surface. TierFall already uses Codecov (`codecov.yml`),
so consistency between sibling repos matters.

## Decision
Codecov. Patch coverage **blocking** at 100%. Project coverage informational with a 1pp
tolerance from baseline. Diverges from TierFall's `informational: true` patch config because
Cascade is application code with a hard PR gate (TierFall is library code with looser policy).

## Consequences
- Hosted dependency; outage means CI uploads fail (informative, but blocking).
- Per-component breakdown shows package/app coverage at a glance.

## Alternatives considered
- **jest-coverage-report-action** — no external service, but less polished diff UI and
  more bespoke wiring for patch analysis.
- **Coveralls** — fine, less popular in JS ecosystem; no reason to diverge from TierFall.
```

`docs/adrs/0008-fast-check-from-v01-stryker-deferred.md`:

```markdown
# ADR 0008: fast-check from v0.1, Stryker deferred

**Status:** Accepted (2026-05-22)
**Spec reference:** §4.4

## Context
Coverage gates alone don't answer "do my tests actually catch bugs". Two augmentations
exist: property-based tests (fast-check) and mutation testing (Stryker). Both useful;
both have CI cost.

## Decision
- **fast-check from v0.1** for `cascade-core` pure functions (graph utilities, schema
  rejection paths). Cheap to wire; big payoff on the constraint-#18 edge-case requirement.
- **Stryker deferred to v0.2+.** Tracked as a Backlog issue. The 30+ minute mutation runs
  would dominate scaffolding-phase CI; revisit once the suite stabilizes.

## Consequences
- v0.1 ships generative tests where they pay off most.
- Stryker's "are these tests load-bearing?" signal arrives in v0.2.

## Alternatives considered
- **Both from v0.1** — too much CI weight during scaffolding.
- **Both deferred** — loses fast-check's cheap edge-case payoff in cascade-core.
```

`docs/adrs/0009-docs-bundled-in-compose.md`:

```markdown
# ADR 0009: Docs bundled in the Docker compose stack

**Status:** Accepted (2026-05-22)
**Spec reference:** §5.2

## Context
Self-hosters may run Cascade air-gapped. If docs only live on Vercel, a self-hosted
deployment loses access to its own documentation.

## Decision
`apps/cascade-docs` runs inside the compose stack at port 3001 (host-mapped to
`CASCADE_DOCS_PORT`, default 3002). Vercel public deploy is a v0.x cleanup item;
NO Vercel-specific code in the repo (Fumadocs static export is platform-agnostic).

## Consequences
- Docs reachable on first boot, even without internet.
- Compose stack is one container heavier (small image).

## Alternatives considered
- **Vercel only** — breaks air-gapped use cases.
- **Both from day one** — twice the release surface in v0.1; not justified by user demand.
```

`docs/adrs/0010-pluggable-storage-provider.md`:

```markdown
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
```

`docs/adrs/0011-synchronized-versioning-via-nx.md`:

```markdown
# ADR 0011: Synchronized versioning via Nx/Changesets `fixed` mode

**Status:** Accepted (2026-05-22)
**Spec reference:** §10.2

## Context
Seven publishable packages (`@tierfall/cascade-*`) plus three Docker images. Self-hosters
need to reason about compatibility: which CLI works with which API works with which web image?

## Decision
Synchronized via Nx release `fixed` mode. `git tag v0.1.0` → every package at `0.1.0`,
every Docker image tagged `:0.1.0`. Revisit post-v1.0 when the ecosystem stabilizes;
switching to independent is a Changesets config flag.

## Consequences
- Simple mental model during the formative period.
- Some packages bump for changes they didn't have — minor noise in npm.

## Alternatives considered
- **Independent per-package semver from v0.1** — compatibility-matrix overhead too high
  for the v0.1 user.
- **Synchronized permanently** — never split, even at v1.0; lock-in too rigid for mature OSS.
```

`docs/adrs/0012-single-admin-auth-in-v01.md`:

```markdown
# ADR 0012: Single-admin auth in v0.1

**Status:** Accepted (2026-05-22)
**Spec reference:** §5.5

## Context
Multi-tenant + RBAC is real engineering work. v0.1 is a read-only, self-hostable release;
it doesn't need teams. The roadmap puts multi-tenant in v0.5.

## Decision
First-to-`/setup` becomes the admin. JWT sessions in HttpOnly cookies. No second user
account in v0.1; the admin model has one role.

## Consequences
- Setup wizard is straightforward.
- v0.5 multi-tenant work has to add user/team/role tables additively (no destructive
  schema changes against the v0.1 single-admin schema). The User table already has a
  `role` column to leave room for expansion.

## Alternatives considered
- **Anonymous (no auth at all)** — too dangerous; secrets and credentials live here.
- **Full multi-user from v0.1** — out of scope; delays v0.1 by months.
```

**Do not skip any ADR** — each one gives a decision an addressable URL.

- [ ] **Step 6: Write `.github/pull_request_template.md`**

```markdown
## What

<!-- One-line summary of the change -->

## Why

<!-- The problem this solves OR the spec/issue link this advances -->
Closes #

## Checklist (constraint #18 / spec §4.5)

- [ ] Tests added for the change (specify edge cases below).
- [ ] Coverage delta acceptable (Codecov comment will appear on this PR).
- [ ] No `any`, no `@ts-ignore`, no `eslint-disable` directives.
- [ ] Docs updated if user-facing (`docs/`, `apps/cascade-docs/content/docs/`, or README).
- [ ] `docs/n8n-parity.md` updated if this advances a row in the matrix.
- [ ] DCO signed off (`git commit -s` or the prepare-commit-msg hook).
- [ ] **No AI/assistant co-author trailers in commits** (human author only).

## Edge cases covered

<!-- Enumerate the explicit edge cases your tests cover. Empty list = reviewer pushback.
     Examples: null input, undefined input, empty list, boundary values, error path,
     race condition, negative case. -->

-

## Coverage exceptions

<!-- If you added an `/* istanbul ignore next */`, justify it here. -->

N/A
```

- [ ] **Step 7: Write `.github/CODEOWNERS`**

```
*       @ronyv89
/docs/  @ronyv89
/.github/ @ronyv89
/packages/ @ronyv89
/apps/  @ronyv89
```

- [ ] **Step 8: Write root `CLAUDE.md`**

```markdown
# Cascade — root Claude context

Self-hosted visual AI workflow editor built on TierFall. **Tier routing is on the canvas,
not in a settings panel.**

## Layout

```
packages/
  cascade-tokens/      # @tierfall/cascade-tokens — design tokens (platform-neutral)
  cascade-core/        # @tierfall/cascade-core — workflow schema, graph utils (platform-neutral)
  cascade-sdk/         # @tierfall/cascade-sdk — fetch client (platform-neutral)
  cascade-ui/          # @tierfall/cascade-ui — Radix + Tailwind design system (web)
  cascade-nodes/       # @tierfall/cascade-nodes — node registry (server)
  cascade-compiler/    # @tierfall/cascade-compiler — graph → .ts emitter (server)
  cascade-cli/         # @tierfall/cascade-cli — `cascade run` binary (server)
apps/
  cascade-api/         # NestJS + Prisma + BullMQ + Socket.IO
  cascade-web/         # Next.js 15
  cascade-docs/        # Fumadocs (bundled in compose at port 3001)
  cascade-mobile/      # Expo skeleton (RN-boundary smoke test, excluded from default build)
  cascade-api-e2e/     # Testcontainers integration
  cascade-web-e2e/     # Playwright E2E
docs/
  superpowers/specs/   # design specs
  superpowers/plans/   # implementation plans
  adrs/                # architecture decision records
  testing.md           # 3-layer testing strategy
  n8n-parity.md        # parity matrix
```

## Hard rules (canonical: CONTRIBUTING.md and spec §13)

- TierFall is consumed via `@tierfall/core@^0.1.0` from npm — never forked, never vendored.
- No `any` outside test files.
- No `// eslint-disable*` / `// @ts-*` directives anywhere.
- No `git commit --no-verify`.
- No AI/assistant co-author trailers — commits are attributed solely to the human author.
- Conventional Commits + DCO sign-off (`git commit -s`).
- Branch off `develop`, PR into `develop`. `develop → main` PRs are releases only.
- Compile-to-TypeScript exit door is load-bearing — workflow schema stays compiler-friendly.

## Branch model

`main` (stable, npm + GHCR publish source) ← `develop` (default integration) ← feature branches.

## Where to find things

- Architecture facts: `AGENTS.md` (gitnexus-generated, refreshed weekly).
- Per-package specifics: each `packages/*/CLAUDE.md` and `apps/*/CLAUDE.md`.
- Active issues: `gh issue list` or the project board.
- Spec: `docs/superpowers/specs/2026-05-22-cascade-kickoff-design.md` (frozen-in-time canonical).
- Plan: `docs/superpowers/plans/2026-05-22-cascade-phase3-scaffolding-plan.md` (this scaffolding work).
```

- [ ] **Step 9: Commit all the docs**

```bash
git add README.md CONTRIBUTING.md CLAUDE.md \
        docs/testing.md docs/n8n-parity.md docs/adrs/ \
        .github/pull_request_template.md .github/CODEOWNERS
git commit -m "$(cat <<'EOF'
docs: add README, CONTRIBUTING, testing.md, n8n-parity.md, ADRs, PR template, root CLAUDE.md

Documentation deliverables for v0.1:
- README.md: project elevator + quick start + license framing.
- CONTRIBUTING.md: dev loop, branch model, commit format, coverage gates, PR checklist.
- docs/testing.md: 3-layer testing strategy (unit + integration + E2E) with the
  per-package coverage threshold table from spec §4.5.
- docs/n8n-parity.md: the living parity matrix (constraint #7); v0.1 release gate.
- docs/adrs/0001..0012: one ADR per major spec decision. Each addressable, each
  with context/decision/consequences/alternatives.
- .github/pull_request_template.md: mandatory checklist enforcing edge-case
  enumeration, coverage delta, docs/parity updates, no-bypass discipline,
  no AI/assistant co-author trailers.
- .github/CODEOWNERS: explicit ownership across all paths.
- CLAUDE.md (root): high-level context for Claude / AGENTS-flow tools.

Per spec §11 v0.1 release gate: all docs must exist, be accurate, and link from README.
EOF
)"
```

- [ ] **Step 10: Run gitnexus index** — generates `AGENTS.md` and the structure snapshot

```bash
gitnexus index
ls -la .gitnexus/
```

Expected: `.gitnexus/index/` populated, `AGENTS.md` written at repo root, possibly `docs/STRUCTURE.md` also generated. Inspect what gitnexus produced — if it generates files outside `.gitnexus/` and `AGENTS.md` we don't want, add them to `.gitignore` instead of committing.

- [ ] **Step 11: Commit gitnexus output**

```bash
git add AGENTS.md .gitnexus/ docs/STRUCTURE.md 2>/dev/null || git add AGENTS.md .gitnexus/
git commit -m "$(cat <<'EOF'
chore: initial gitnexus index

gitnexus 1.6.x indexed the repo at end of Phase 3 scaffolding. AGENTS.md gives
agents a fast architectural overview without re-reading every CLAUDE.md.

Refreshed weekly by a scheduled gitnexus job (added as a v0.1 backlog issue).
EOF
)"
```

- [ ] **Step 12: Create the GitHub repo + push `develop`**

```bash
# Create the repo under the tierfall org. Public visibility per the OSS commitment.
gh repo create tierfall/cascade --public --source=. --remote=origin --description "Self-hosted visual AI workflow editor built on TierFall. Tier routing is on the canvas."

# Push develop. We do NOT push main yet — main only gets the v0.1.0 release PR merge.
git push -u origin develop
```

- [ ] **Step 13: Configure branch protection on `develop` (and pre-empt main)**

```bash
# develop: required reviews + status checks, no force push, no deletion
gh api -X PUT repos/tierfall/cascade/branches/develop/protection \
  -F required_pull_request_reviews.required_approving_review_count=1 \
  -F required_pull_request_reviews.dismiss_stale_reviews=true \
  -F required_status_checks.strict=true \
  -F 'required_status_checks.contexts[]=lint-typecheck-unit' \
  -F 'required_status_checks.contexts[]=testcontainers' \
  -F 'required_status_checks.contexts[]=check-boundary' \
  -F enforce_admins=false \
  -F allow_force_pushes=false \
  -F allow_deletions=false

# Create main as a copy of develop's initial commit so we can protect it
git push origin develop:main

# main: same protections + tighter
gh api -X PUT repos/tierfall/cascade/branches/main/protection \
  -F required_pull_request_reviews.required_approving_review_count=1 \
  -F required_pull_request_reviews.dismiss_stale_reviews=true \
  -F required_status_checks.strict=true \
  -F 'required_status_checks.contexts[]=lint-typecheck-unit' \
  -F 'required_status_checks.contexts[]=testcontainers' \
  -F 'required_status_checks.contexts[]=playwright' \
  -F 'required_status_checks.contexts[]=check-boundary' \
  -F enforce_admins=true \
  -F allow_force_pushes=false \
  -F allow_deletions=false
```

- [ ] **Step 14: Create the GitHub Projects board + Backlog issues** — execute the script from Appendix A.

- [ ] **Step 15: Final smoke test — `docker compose up`**

```bash
cp .env.example .env
docker compose up -d --wait
curl -fsS http://localhost:3000/health   # cascade-api
curl -fsS -I http://localhost:3001/      # cascade-web
curl -fsS -I http://localhost:3002/      # cascade-docs
docker compose down -v
```

Expected: api responds `{"status":"ok"}`, web and docs respond `HTTP/1.1 200 OK`.

- [ ] **Step 16: Phase 3 exit checklist (verify against spec §11)**

Run through the spec's v0.1 acceptance criteria list. Every box that's not gated by post-Phase-3 backlog work must be checked. The scaffolding-only boxes (CI green, three test layers wired, sample tests per layer, per-package CLAUDE.md, coverage gates wired, .env.example etc.) should all be ✓. The feature-gated boxes (demo workflow runs, webhook trigger creates a run, CLI triggers a workflow) remain unchecked and are tracked as Backlog issues per Appendix A.

If everything green: Phase 3 complete. Phase 4+ starts pulling from the Backlog.

---

## Appendix A — v0.1 Backlog issues (30 issues, one script)

Run this from inside Task 19 Step 14, after the repo and project board exist. The script creates GitHub issues with the labels, body, and milestone target listed below. Adjust the milestone number to whatever `gh api repos/tierfall/cascade/milestones` returns after creating the `v0.1.0` milestone.

```bash
# Prereqs: gh CLI authed, you're in the cascade repo root.

# 1. Create the v0.1.0 milestone
gh api -X POST repos/tierfall/cascade/milestones \
  -f title='v0.1.0' \
  -f description='Self-hostable read-only release: spec §11 acceptance criteria' \
  -f state=open

# 2. Create labels (one-time)
for label in 'area:api' 'area:web' 'area:nodes' 'area:cli' 'area:compiler' 'area:docs' 'area:infra' 'area:ci' 'type:feature' 'type:bug' 'type:chore' 'priority:high' 'priority:medium' 'priority:low' 'good-first-issue'; do
  gh label create "$label" --force 2>/dev/null || true
done

# 3. Create the Projects board (v2)
PROJECT_NUMBER=$(gh api graphql -f query='
  mutation($title: String!, $ownerId: ID!) {
    createProjectV2(input: { ownerId: $ownerId, title: $title }) {
      projectV2 { number }
    }
  }' -F title='Cascade — v0.1.0' -F ownerId="$(gh api graphql -f query='query { viewer { id } }' -q .data.viewer.id)" -q .data.createProjectV2.projectV2.number)
echo "Project number: $PROJECT_NUMBER"
# Manual UI step: configure board columns Backlog / Ready / In Progress / In Review / Done.
# (gh CLI projects v2 API for column config is limited; do this in the GH UI once.)
```

Then create the 30 backlog issues. Each `gh issue create` call below sets labels, milestone, and a brief body. The issues are grouped by area; ordering within an area is rough priority (top = highest).

```bash
# ---- area:api (10 issues) ----

gh issue create --title 'B-API-WORKFLOW-CRUD: workflow CRUD endpoints with integration tests' \
  --label 'area:api,type:feature,priority:high' --milestone 'v0.1.0' \
  --body 'POST/GET/PATCH/DELETE /workflows. Validate against WorkflowSchema. Persist `definition` Json + `schemaVersion`. Integration tests in cascade-api-e2e against real Postgres. Spec §3.1 / §9.'

gh issue create --title 'B-API-RUN-EXECUTE: synchronous run execution (the executor)' \
  --label 'area:api,type:feature,priority:high' --milestone 'v0.1.0' \
  --body 'Given a workflow id + input, run the workflow synchronously through cascade-nodes handlers. Topological order via cascade-core.topologicalSort. Persist Run + NodeExecution rows. Integration test: end-to-end run through http node returns expected result. Depends: B-API-WORKFLOW-CRUD.'

gh issue create --title 'B-API-BULLMQ: BullMQ queue + worker for async runs' \
  --label 'area:api,type:feature,priority:high' --milestone 'v0.1.0' \
  --body 'POST /workflows/:id/runs returns 202 + run id, enqueues to BullMQ. Worker consumes, updates run status. Integration test against real Redis verifies queue handoff. Depends: B-API-RUN-EXECUTE.'

gh issue create --title 'B-API-WS-GATEWAY: Socket.IO gateway broadcasting node-execution state' \
  --label 'area:api,type:feature,priority:high' --milestone 'v0.1.0' \
  --body 'Socket.IO gateway publishes node state changes (queued→running→success/error) using Redis pub/sub adapter. Constraint #11 (live execution feedback is core, not v0.2 polish). Integration test verifies a subscribed client sees the state stream.'

gh issue create --title 'B-API-AUTH-SETUP: first-boot setup wizard creates admin' \
  --label 'area:api,type:feature,priority:high' --milestone 'v0.1.0' \
  --body 'GET /setup checks whether any User exists; if not, returns 200 with a setup form schema. POST /setup creates the admin (email + password) and generates JWT_SECRET + CREDENTIALS_ENC_KEY if absent. After first user exists, /setup returns 410 Gone. Spec §5.4 / §5.5.'

gh issue create --title 'B-API-AUTH-JWT: JWT session middleware' \
  --label 'area:api,type:feature,priority:high' --milestone 'v0.1.0' \
  --body 'Sign JWT with JWT_SECRET. HttpOnly secure cookies. NestJS guard protects all routes except /health and /setup. Integration test covers expired token, malformed token, missing token, valid token.'

gh issue create --title 'B-API-CREDENTIALS: AES-256-GCM at-rest encryption for credentials' \
  --label 'area:api,type:feature,priority:medium' --milestone 'v0.1.0' \
  --body 'EncryptedCredential model + CredentialService. Encrypt with CREDENTIALS_ENC_KEY (AES-256-GCM, random IV per record). Integration test verifies round-trip + that a tampered ciphertext fails decryption. Constraint #23.'

gh issue create --title 'B-API-WEBHOOK-TRIGGER: incoming-webhook endpoint creates a run' \
  --label 'area:api,type:feature,priority:high' --milestone 'v0.1.0' \
  --body 'POST /webhooks/:path looks up the workflow whose trigger.kind=webhook + trigger.path matches, then creates a run. Returns 202 with run id. Integration test covers no-match (404), match (202), and replay (idempotency is OUT of scope for v0.1 — flagged in spec).'

gh issue create --title 'B-API-STORAGE-S3: S3Storage implementation of StorageProvider' \
  --label 'area:api,type:feature,priority:medium' --milestone 'v0.1.0' \
  --body 'Implement S3Storage using @aws-sdk/client-s3. Selected when STORAGE_DRIVER=s3. Integration test runs against the --profile minio MinIO container. Spec §5.3.'

gh issue create --title 'B-API-LIMITS: enforce per-run safety limits' \
  --label 'area:api,type:feature,priority:high' --milestone 'v0.1.0' \
  --body 'Wire the four env limits (CASCADE_MAX_*) into the executor. Test: a workflow with >max nodes fails fast with a clear error; a run that exceeds duration is killed; cost limit is enforced via TierFall budget hook. Spec §5.7.'

# ---- area:web (7 issues) ----

gh issue create --title 'B-WEB-WORKFLOW-LIST: workflows list page' \
  --label 'area:web,type:feature,priority:high' --milestone 'v0.1.0' \
  --body 'GET /workflows page using cascade-sdk.listWorkflows. Uses cascade-ui primitives. Loading + empty + error states. Playwright covers the empty state path.'

gh issue create --title 'B-WEB-WORKFLOW-VIEW: read-only graph view with ReactFlow' \
  --label 'area:web,type:feature,priority:high' --milestone 'v0.1.0' \
  --body 'Workflow detail page renders the graph via @xyflow/react (ReactFlow 12). Custom node components consume cascade-tokens. Zustand store (spec §6.1). Playwright test loads a fixture workflow and asserts the node count.'

gh issue create --title 'B-WEB-LIVE-FEEDBACK: WebSocket-driven node-color updates' \
  --label 'area:web,type:feature,priority:high' --milestone 'v0.1.0' \
  --body 'Subscribe to /ws/runs/:id via socket.io-client. As node-execution events arrive, update the Zustand state and let ReactFlow re-render with new colors (tier ramp from cascade-tokens). Playwright test: trigger a run via API, observe color transitions. Constraint #11. Depends: B-WEB-WORKFLOW-VIEW, B-API-WS-GATEWAY.'

gh issue create --title 'B-WEB-RUN-HISTORY: runs list page (CLI-triggered runs visible here)' \
  --label 'area:web,type:feature,priority:high' --milestone 'v0.1.0' \
  --body 'GET /workflows/:id/runs page. Each run row shows status + duration + cost. Playwright test verifies a CLI-triggered run appears here. Depends: B-CLI-WAIT (or skip --wait and just trigger).'

gh issue create --title 'B-WEB-ERROR-STATES: error displays for failed runs/nodes' \
  --label 'area:web,type:feature,priority:medium' --milestone 'v0.1.0' \
  --body 'Failed nodes show error excerpt + click to expand. Run-level errors surface at the top of the run page. Playwright covers a deliberate failure.'

gh issue create --title 'B-WEB-KEYBOARD-NAV: keyboard navigation on every interactive element' \
  --label 'area:web,type:feature,priority:medium' --milestone 'v0.1.0' \
  --body 'Tab order is logical across the workflows list, detail page, and run page. Focus rings visible (tier-2 ring color). Playwright test exercises Tab + Enter + Esc on the home page. Spec §6.3 + constraint #4 (keyboard-accessible).'

gh issue create --title 'B-WEB-SETUP-WIZARD: first-boot setup form' \
  --label 'area:web,type:feature,priority:high' --milestone 'v0.1.0' \
  --body 'GET / when no admin exists → redirect to /setup. Form with email + password + confirm. POSTs to /setup endpoint. Playwright covers the happy path. Depends: B-API-AUTH-SETUP.'

# ---- area:nodes (4 issues) ----

gh issue create --title 'B-LLM-WIRE: wire LLM handler to TierFall router' \
  --label 'area:nodes,type:feature,priority:high' --milestone 'v0.1.0' \
  --body 'Replace the stub in cascade-nodes/src/node-types/llm.ts with a real call through @tierfall/core. Per-node tier policy comes from config.policyOverride or workflow-default. Tier attribution returned in NodeResult so the API can persist it. Unit + integration tests.'

gh issue create --title 'B-COND-ENGINE: full expression engine for conditional node' \
  --label 'area:nodes,type:feature,priority:medium' --milestone 'v0.1.0' \
  --body 'Replace the regex-bound evaluator with jexl (decision in implementation PR — jexl vs expr-eval vs filtrex). Support arbitrary inputs, common operators, function calls. Sandboxed eval, no Function() / eval(). Unit tests for malformed expressions + injection attempts.'

gh issue create --title 'B-TRANSFORM-JSONATA: real jsonata transformation' \
  --label 'area:nodes,type:feature,priority:medium' --milestone 'v0.1.0' \
  --body 'Replace passthrough stub with jsonata. Validate expressions at validateConfig time. Unit tests cover happy path + malformed expression rejection.'

gh issue create --title 'B-DEMO-WORKFLOW: ship the v0.1 demo workflow JSON' \
  --label 'area:nodes,area:docs,type:feature,priority:high' --milestone 'v0.1.0' \
  --body 'Two-vendor demo per spec §10.3: Ollama (tier 0) → adapter-openai-compatible OR adapter-anthropic (tier 2-3) on fallback. Workflow JSON seeded into the DB on first boot when no workflows exist. Visible tier attribution on the canvas after a run. README + docs page reference this.'

# ---- area:cli (1 issue) ----

gh issue create --title 'B-CLI-WAIT: implement --wait by polling /runs/:id' \
  --label 'area:cli,type:feature,priority:low' --milestone 'v0.1.0' \
  --body 'Currently --wait logs a notice. Implement by polling /runs/:id every 1s (configurable via --poll-interval) until terminal status. Returns non-zero exit on error. Unit tests with mocked fetch.'

# ---- area:compiler (1 issue, post-v0.1 stub) ----

gh issue create --title 'B-COMPILE-INLINE: v0.3 advance — inline node logic in emitted .ts' \
  --label 'area:compiler,type:feature,priority:low' --milestone 'v0.1.0' \
  --body 'Placeholder issue tracking the v0.3 milestone work. Move to v0.3 milestone once v0.1 ships. For v0.1, the trivial SDK-passthrough emitter from Task 10 suffices.'

# ---- area:docs (3 issues) ----

gh issue create --title 'B-DOCS-DEMO-PAGE: `Try the demo` page in cascade-docs' \
  --label 'area:docs,type:feature,priority:medium' --milestone 'v0.1.0' \
  --body 'New page at content/docs/demo.mdx with step-by-step instructions to run the demo workflow (--profile demo, expected output, what to look for on the canvas). Depends: B-DEMO-WORKFLOW.'

gh issue create --title 'B-DOCS-API-OPENAPI: auto-generated OpenAPI published to docs site' \
  --label 'area:docs,area:api,type:feature,priority:medium' --milestone 'v0.1.0' \
  --body '@nestjs/swagger generates the OpenAPI doc at /api/openapi.json. cascade-docs build pulls it and renders the spec at /docs/api. Constraint #6 (API-first).'

gh issue create --title 'B-DOCS-VERCEL-DEPLOY: optional Vercel deployment workflow' \
  --label 'area:docs,area:ci,type:chore,priority:low' --milestone 'v0.1.0' \
  --body 'Add .github/workflows/docs-vercel.yml that deploys cascade-docs to Vercel on push to main. Vercel token from secrets. No Vercel-specific code in the repo. Spec §5.2.'

# ---- area:ci / area:infra (4 issues) ----

gh issue create --title 'B-CI-GITNEXUS-REFRESH: weekly scheduled gitnexus index refresh' \
  --label 'area:ci,type:chore,priority:low' --milestone 'v0.1.0' \
  --body 'Cron-scheduled workflow runs `gitnexus index`, opens a PR if AGENTS.md / STRUCTURE.md changed. Mirror TierFall pattern.'

gh issue create --title 'B-CI-RELEASE-NOTES: auto-generate release notes from Conventional Commits' \
  --label 'area:ci,type:chore,priority:medium' --milestone 'v0.1.0' \
  --body 'release.yml step uses Conventional Commit history between tags to populate the GitHub Release notes. nx release supports this — wire it up.'

gh issue create --title 'B-CI-BENCHMARK: optional throughput benchmark workflow' \
  --label 'area:ci,type:chore,priority:low' --milestone 'v0.1.0' \
  --body 'Add a non-blocking workflow that runs the demo workflow N times and reports p50/p99 latency. Posts a comment on PRs that touch executor code. Not a release gate.'

gh issue create --title 'B-INFRA-CASA-OS: CasaOS one-click install spec (v0.6 prep)' \
  --label 'area:infra,type:chore,priority:low' --milestone 'v0.1.0' \
  --body 'Draft the casaos-app YAML for Cascade. Targets v0.6 release; landed here so we keep the architecture compatible (no breaking compose changes after v0.1). Spec §1 (CasaOS stretch goal).'
```

Total: 30 issues. Aligned to spec §11 acceptance criteria + spec §12 deferred items.

---

## Appendix B — Phase 3 wrap-up and Phase 4 handoff

After Task 19 Step 16, Phase 3 is complete. The repo state:

- `develop` branch on `origin/tierfall/cascade`, branch-protected.
- `main` branch on `origin/tierfall/cascade`, branch-protected, identical to `develop`.
- ~19 commits, all DCO-signed, all Conventional, all human-authored.
- Five GitHub Actions workflows in place; first run on `develop` push is green.
- GitHub Projects v2 board exists; 30 Backlog issues queued.
- Codecov receiving uploads; patch-coverage gate active on the next PR.
- `docker compose up` smoke-tested; all three published-image targets build.

**Phase 4 (Backlog execution)** is the standard Superpowers per-issue flow:
1. Pick the top-priority issue from **Ready**.
2. Run `/brainstorming` if the issue needs design clarification; otherwise skip to plan.
3. Use `gitnexus impact <file>` and `gitnexus context <symbol>` to scope blast radius.
4. `/plan` → write plan to `docs/superpowers/plans/`.
5. `/execute-plan` with TDD.
6. PR into `develop`, link with `Closes #<issue>`.
7. Reviewer verifies the PR template checklist; merge when green.
8. When all v0.1.0 milestone issues close + the spec §11 acceptance criteria are
   all checked, open `release: v0.1.0` PR from `develop → main`, tag, publish.






