# syntax=docker/dockerfile:1
# Self-building image for @workspace/api-server (pnpm monorepo).
#
# IMPORTANT: the build context MUST be the REPO ROOT — the build needs
# pnpm-workspace.yaml, the root lockfile, and the @workspace/* packages that the
# api-server bundles via esbuild. `railway.json` at the repo root points
# dockerfilePath here and sets builder=DOCKERFILE.
#
# This replaces the old runtime-only Dockerfile (which just COPY-d a prebuilt
# dist/). That version only worked when deploying a non-git folder that happened
# to have a fresh dist/ on disk; from a git checkout dist/ is gitignored, so the
# build must produce it here.

# ---- build stage: install the workspace and produce the esbuild bundle ----
FROM node:20-slim AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

# Copy the whole monorepo (node_modules/dist are excluded via .dockerignore).
COPY . .

# devDependencies (esbuild, esbuild-plugin-pino) are required to build, so do
# NOT set NODE_ENV=production in this stage.
# If --frozen-lockfile ever fails on a lockfile mismatch, drop the flag.
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/api-server build

# ---- runtime stage: ship only the self-contained bundle ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# esbuild output: index.mjs + pino worker files.
COPY --from=build /repo/artifacts/api-server/dist ./dist

# Host injects PORT; this default lets `docker run` work locally too.
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/index.mjs"]
