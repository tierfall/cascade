# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS base
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS deps
WORKDIR /repo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/cascade-api/package.json apps/cascade-api/
COPY apps/cascade-docs/package.json apps/cascade-docs/
COPY packages/cascade-core/package.json packages/cascade-core/
COPY packages/cascade-sdk/package.json packages/cascade-sdk/
COPY packages/cascade-nodes/package.json packages/cascade-nodes/
COPY packages/cascade-tokens/package.json packages/cascade-tokens/
# cascade-docs is included so the Nx project graph can evaluate all next.config.*
# files in the repo (including apps/cascade-docs/next.config.mjs which imports fumadocs-mdx)
RUN pnpm install --frozen-lockfile --filter cascade-api... --filter cascade-docs...

FROM deps AS builder
WORKDIR /repo
COPY . .
RUN pnpm --filter cascade-api exec prisma generate
RUN pnpm --filter cascade-api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# Nx places the webpack bundle at dist/apps/cascade-api (repo root), not apps/cascade-api/dist
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/dist/apps/cascade-api ./dist
COPY --from=builder /repo/apps/cascade-api/prisma ./prisma
COPY --from=builder /repo/apps/cascade-api/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/main.js"]
