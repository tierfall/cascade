# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS base
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS deps
WORKDIR /repo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/cascade-web/package.json apps/cascade-web/
COPY apps/cascade-docs/package.json apps/cascade-docs/
COPY packages/cascade-tokens/package.json packages/cascade-tokens/
COPY packages/cascade-ui/package.json packages/cascade-ui/
COPY packages/cascade-sdk/package.json packages/cascade-sdk/
COPY packages/cascade-core/package.json packages/cascade-core/
# cascade-docs is included so the Nx project graph can evaluate all next.config.*
# files in the repo (including apps/cascade-docs/next.config.mjs which imports fumadocs-mdx)
RUN pnpm install --frozen-lockfile --filter cascade-web... --filter cascade-docs...

FROM deps AS builder
WORKDIR /repo
COPY . .
# Build workspace package dependencies first, then invoke Next.js directly.
# Calling `pnpm --filter cascade-web build` would loop because the package.json
# build script is `nx build cascade-web`, which re-invokes the same Nx target.
RUN pnpm --filter cascade-tokens build && \
    pnpm --filter cascade-core build && \
    pnpm --filter cascade-sdk build && \
    pnpm --filter cascade-ui build && \
    cd apps/cascade-web && npx next build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/apps/cascade-web/.next/standalone ./
COPY --from=builder /repo/apps/cascade-web/.next/static ./apps/cascade-web/.next/static
# Copy public assets if present (directory may not exist in initial scaffold)
RUN --mount=type=bind,from=builder,source=/repo/apps/cascade-web,target=/src \
    if [ -d /src/public ]; then cp -r /src/public ./apps/cascade-web/public; fi
EXPOSE 3000
CMD ["node", "apps/cascade-web/server.js"]
