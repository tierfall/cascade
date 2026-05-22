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
