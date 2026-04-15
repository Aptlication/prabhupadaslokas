# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Sloka Hub (`artifacts/sloka-hub`)
- **Type**: Expo mobile app
- **Preview**: `/` (root path)
- **Purpose**: Devotional sloka learning app for ISKCON devotees
- **Theme**: Deep navy blue (#0D1B3E) with gold (#C9A84C) accents
- **Screens**:
  - Home — app overview, stats, quick actions, coming soon features
  - Slokas — searchable/filterable list of all slokas
  - Sloka Detail — devanagari, transliteration, tap-to-reveal word meanings, audio playback mode, translation, purport, progress tracking
  - My Slokas — personal bookmarked slokas
  - Settings — progress overview and app info
- **Data**: 8 slokas from Bhagavad Gita and prayers stored in `data/slokas.ts`
- **State**: AsyncStorage via AppContext (progress tracking, bookmarks)
- **Dependencies**: @react-native-async-storage/async-storage, expo-linear-gradient
