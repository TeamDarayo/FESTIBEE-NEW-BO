# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Festibee backoffice - a Turborepo monorepo for a festival/performance management admin application.

## Commands

```bash
# Development
pnpm dev              # Start all apps in dev mode (web: 3000, storybook: 6006)
pnpm storybook        # Run storybook only

# Build & Quality
pnpm build            # Build all packages
pnpm lint             # Run ESLint across all packages
pnpm check-types      # TypeScript type checking
pnpm format           # Prettier formatting

# API Client Generation
pnpm --filter @festibee/api generate   # Regenerate API client from OpenAPI spec

# UI Components
pnpm ui:add <component>    # Add shadcn/ui component to @festibee/ui
pnpm ui:diff               # Check for shadcn/ui component updates
```

## Architecture

### Monorepo Structure
- `apps/web` - Next.js 15 backoffice app (port 3000)
- `apps/storybook` - Component documentation (port 6006)
- `packages/api` - API client (orval-generated from OpenAPI)
- `packages/ui` - Shared UI components (shadcn/ui based)
- `packages/eslint-config` - ESLint configurations
- `packages/typescript-config` - TypeScript configurations

### Web App Architecture (Feature-Sliced Design)

The web app follows FSD methodology at `apps/web/src/`:

```
src/
├── app/providers/      # React context providers (QueryProvider, ThemeProvider)
├── entities/           # Domain entities with basic UI (user/)
├── features/           # User-facing features (auth/, artist/, performance/, place/)
├── shared/             # Shared utilities, API client, types, hooks
└── widgets/            # Composite UI blocks (header/, sidebar/)
```

Each feature module follows this structure:
```
features/<name>/
├── api/        # Feature-specific API calls
├── hooks/      # React hooks (use-*-list.ts, use-*-mutations.ts)
├── model/      # Zustand stores
├── ui/         # React components
└── index.ts    # Public exports
```

### API Client Pattern

API types and hooks are auto-generated using orval:
1. OpenAPI spec at `api-docs.json`
2. Generated code at `packages/api/src/generated/`
3. Uses TanStack Query for hooks
4. Custom fetch wrapper at `packages/api/src/lib/custom-fetch.ts`

To update API client after spec changes:
```bash
pnpm --filter @festibee/api generate
```

### UI Components

Components follow shadcn/ui pattern with Radix UI primitives:
- Located at `packages/ui/src/components/ui/`
- Use `cn()` utility from `packages/ui/src/lib/utils.ts` for className merging
- Tailwind CSS 4 with `darkMode: "class"`

## Tech Stack

- **Runtime**: Node.js 18+, pnpm 9
- **Framework**: Next.js 15 (App Router), React 19
- **Styling**: Tailwind CSS 4, class-variance-authority
- **State**: Zustand, TanStack Query
- **API**: orval (OpenAPI code generation)
- **UI**: shadcn/ui, Radix UI, Lucide icons
- **Quality**: ESLint (flat config), Prettier, TypeScript 5.9
