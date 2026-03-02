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
pnpm --filter @festibee/api generate        # Full pipeline: fetch spec → fix → orval
pnpm --filter @festibee/api generate:local  # Skip fetch, use existing api-docs.json

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
- `packages/eslint-config` - ESLint flat configs (base, next, react-internal)
- `packages/typescript-config` - TypeScript configurations

### Web App Architecture (Feature-Sliced Design)

The web app follows FSD methodology at `apps/web/src/`:

```
src/
├── app/providers/      # QueryProvider (staleTime=60s), ThemeProvider (next-themes)
├── entities/           # Domain entities with basic UI (user/)
├── features/           # User-facing features (auth/, artist/, performance/, place/, crawling/)
├── shared/             # Shared utilities, API client, types, hooks, config
└── widgets/            # Composite UI blocks (nav-rail/, master-detail-layout/, header/, sidebar/)
```

Each feature module follows this structure:
```
features/<name>/
├── api/        # Re-aliases verbose generated types to short names, manual apiClient calls
├── hooks/      # React hooks (use-*-list.ts, use-*-mutations.ts)
├── model/      # Zustand stores
├── ui/         # React components
└── index.ts    # Public barrel exports (API types, hooks, UI components)
```

### Routing Structure (App Router)

```
app/
├── layout.tsx              # Root: html/body + Providers
├── page.tsx                # Redirects to /dashboard
├── globals.css             # Imports tailwindcss + @festibee/ui tokens/theme
├── (auth)/login/page.tsx   # Login page (no shared layout)
└── (dashboard)/
    ├── layout.tsx          # Client: auth verification on mount, NavRail + main
    ├── dashboard/page.tsx  # Dashboard overview
    └── artist/
        ├── layout.tsx      # MasterDetailLayout with ArtistListPanel
        ├── page.tsx        # Placeholder ("아티스트를 선택하세요")
        └── [id]/page.tsx   # ArtistDetailPanel (server component)
```

Path aliases: `@/*` maps to `./`, `@/features/*`, `@/widgets`, `@/shared/*`, `@/entities/*`.

### Authentication Flow

Authentication uses a simple admin password pattern (no JWT):

1. **Login**: User enters password → `setAdminPassword()` in auth store → `verifyAdminPassword()` makes test API call
2. **Every request**: `customFetch` injects `X-Admin-Password` header automatically
3. **Cookie**: `fb-auth=1` cookie set on login (for middleware SSR check only)
4. **Middleware** (`middleware.ts`): Checks `fb-auth` cookie. Unauthenticated → redirect to `/login`
5. **Dashboard layout**: Secondary defense — re-verifies password via API on mount, clears auth on failure
6. **Persistence**: Zustand `persist` middleware stores `adminPassword`, `isAuthenticated`, `apiServer` in localStorage (`auth-storage` key). `onRehydrateStorage` re-syncs module-level state in `customFetch`
7. **Server selection**: User can switch between dev/prod API servers (`apiServer` state → `setBaseUrl()`)

### API Client (Two Layers)

**Layer 1 — `customFetch`** (`packages/api/src/lib/custom-fetch.ts`):
- Used by all orval-generated hooks as the mutator
- Module-level mutable `baseUrl` and `adminPassword` (set from auth store)
- Injects `X-Admin-Password` header, prepends `baseUrl`, returns `{ data, status, headers }`

**Layer 2 — `apiClient`** (`apps/web/src/shared/api/client.ts`):
- Manual REST client for endpoints where generated paths don't match
- Uses same `getBaseUrl()` / `getAdminPassword()` from the api package
- Returns parsed JSON directly (no wrapper)

### API Code Generation Pipeline

```
SWAGGER_URL (env) → fetch-openapi.ts → api-docs.fetched.json
                                              ↓
                              (fallback: api-docs.json at repo root)
                                              ↓
                    fix-openapi.ts → api-docs.fixed.json (patches missing path params)
                                              ↓
                    orval (tags-split mode) → src/generated/
                                              ├── schemas/     (TS types)
                                              └── <tag>/       (React Query hooks per controller)
```

Generated type names are verbose (Java package path style). Feature `api/` files re-alias them:
```ts
// features/artist/api/artist-api.ts
export type { GetArtistsAdminResponseDTO as ArtistListRes } from "@festibee/api/generated";
```

### UI Package & Theming

- **Tailwind CSS 4**: No `tailwind.config.js` — config via CSS `@theme` directives in `packages/ui/src/tokens/theme.css`
- **Design tokens** (`packages/ui/src/tokens/index.css`): HSL color custom properties, dark mode in `.dark {}`, border radii, shadows, z-index scale
- **Fonts**: Pretendard Variable (sans), JetBrains Mono (mono)
- **Web app consumes UI**: `globals.css` imports `@festibee/ui/tokens` + `@festibee/ui/theme`, plus `@source` directive scans UI package components for Tailwind classes
- Components imported as `import { Button, Card } from "@festibee/ui"`
- `cn()` utility from `packages/ui/src/lib/utils.ts` for className merging

### Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL_DEV` | Dev API server URL | `http://localhost:8080` |
| `NEXT_PUBLIC_API_URL_PROD` | Prod API server URL | `https://dev.darayo-festival.shop` |
| `NEXT_PUBLIC_API_URL` | Direct URL for customFetch init | `http://localhost:3011` |
| `SWAGGER_URL` | OpenAPI spec fetch URL (code generation) | — |

## Tech Stack

- **Runtime**: Node.js 18+, pnpm 9
- **Framework**: Next.js 15 (App Router, `output: "standalone"`), React 19
- **Styling**: Tailwind CSS 4, class-variance-authority
- **State**: Zustand (persist middleware), TanStack Query
- **API**: orval (OpenAPI code generation), custom fetch mutator
- **UI**: shadcn/ui, Radix UI, Lucide icons
- **Quality**: ESLint 9 (flat config), Prettier, TypeScript 5.9
