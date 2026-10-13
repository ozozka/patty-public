# Patty

## 1. Product

### Vision
Pati is a mobile social platform designed to connect pet owners through a familiar, "swipe-to-match" interface. It facilitates local playdates, community building, and seamless communication for pet lovers.

### Target Audience
- **Pet Owners:** Individuals looking for socialization, playdates, and local community connections for their pets.
- **Professional Pet Services:** Vets, trainers, and groomers looking to provide value and reach local pet owners.

### Key Features
- **Swipe-to-Match:** High-performance discovery interface for finding local pets based on breed, species, proximity, and preferences.
- **Verified Profiles:** Mandatory email verification + optional phone verification with "Verified" badge.
- **Real-time Messaging:** WebSocket-based chat with typing indicators, read receipts, and presence tracking.
- **Spatial Discovery:** PostGIS-powered location engine for distance calculations and area matching.
- **Standalone Pet Management:** Dedicated interface for managing detailed pet profiles.

## 2. Architecture

Monorepo structure (Turborepo + Bun workspaces) with `apps/` and `packages/`.

### Contracts

`@patty/contracts` is the single source of truth for all types — no codegen:

```
packages/contracts/src/schemas/*.ts   ← Zod schemas (single source of truth)
    ↓ z.infer<>
packages/contracts/dist/              ← Built output (tsup)
    ↓
apps/api:    import { registerInputSchema } from '@patty/contracts'
apps/mobile: import type { RegisterInput } from '@patty/contracts'
apps/web:    import type { AdminLoginInput } from '@patty/contracts'
```

### API

| Category | Technology |
|----------|------------|
| Language | TypeScript (Bun runtime) |
| Web Framework | Hono |
| Database | PostgreSQL (Railway) |
| ORM | Drizzle ORM (schema-as-code) |
| Cache / Pub-Sub | Redis — Bun native (rate limiting, pub/sub, presence, WS relay) |
| Real-time | WebSocket — Bun native via `hono/bun` |
| Authentication | JWT (`jose`) |
| Deployment | Railway |
| Push Notifications | Expo Push SDK |

- **HTTP Server:** Bun native with WebSocket support via `hono/bun`.
- **Event Bus:** Redis pub/sub (`src/lib/events.ts`) for multi-instance event fan-out.
- **Denormalized Match Previews:** `matches` table stores `last_message` snapshots for instant chat list rendering.
- **Full-text Search:** `pg_trgm` for fuzzy searching of users and pets.
- **Soft Deletes:** `deleted_at` on accounts and pets with cascade triggers.
- **Presence Tracking:** Redis `presence:{userId}` key with 90s TTL.
- **Database:** Drizzle ORM with PostGIS via raw `db.execute(sql\`...\`)` queries. Migrations auto-applied on startup.
- **Rate Limiting:** Two-tier Redis-backed strategy:
  - Global: 100 req/min per IP
  - Auth endpoints: 20 req/min per IP
  - WebSocket: 30 msg/min per user, 64KB max message size
- **Security Headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `X-XSS-Protection`.
- **Request Body Limit:** 1 MB max.

### Mobile

| Category | Technology |
|----------|------------|
| Framework | React Native with Expo (SDK 54) |
| Language | TypeScript |
| Package Management | Bun |
| Distribution | Expo EAS Build & Update |
| Server State | TanStack Query (React Query) |
| Forms | react-hook-form |
| UI State | Zustand |
| Navigation | React Navigation (Native Stack) |
| Storage | expo-secure-store |
| Styling | react-native-unistyles v3 (Zero-hardcoding policy) |
| Internationalization | i18next & react-i18next |

- **API Client:** `hono/client` (`hc`) with type-safe RPC interface and automatic JWT injection.
- **Data Handling:** React Query for server state. Zustand for client-side persistence only. Runtime Zod validation on all responses.
- **Caching Strategy:** Static data (`species`, `locations`) with `Infinity` staleTime. Session data (`profile`) with 5min staleTime. Ephemeral data (`candidates`, `messages`) with 0-1min staleTime.
- **Types:** API structure inferred via `typeof app`. Runtime schemas from `@patty/contracts`.

### Web

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Tables | TanStack Table v8 |
| API Client | `hono/client` (`hc<AdminAppType>`) — server-only |
| Admin Auth | Custom JWT in `httpOnly; Secure; SameSite=Strict` cookie |
| Internationalization | next-intl (Turkish + English, default Turkish) |
| Animations | Framer Motion |
| Deployment | Railway (`patty-web` service) |

- **Route Groups:** `app/[locale]/(marketing)/` for public pages, `app/[locale]/(admin)/` for JWT-gated admin panel.
- **Marketing Pages:** Homepage, Features, About, Safety, Support, Blog, Privacy, Terms.
- **Admin API Client:** Server-only `hc<AdminAppType>` wrapper with JWT from cookie. No direct DB access.
- **External Images:** Unsplash for blog images.

### Structure Map

```
/
├── apps/
│   ├── api/                    # Hono backend (TypeScript + Bun)
│   │   ├── src/
│   │   │   ├── index.ts        # Entry point
│   │   │   ├── env.ts          # Zod-validated env vars
│   │   │   ├── db/             # Drizzle client + schema
│   │   │   ├── features/       # Domain modules
│   │   │   ├── lib/            # Shared utilities (jwt, events, password)
│   │   │   ├── middleware/     # auth, verified, logger, error
│   │   │   └── ws/             # WebSocket manager + handler
│   │   └── drizzle.config.ts
│   │
│   ├── mobile/                 # React Native App (Expo SDK 54)
│   │   ├── src/
│   │   │   ├── api/            # Hono RPC client
│   │   │   ├── component/      # UI components (common, chat, matching, pet)
│   │   │   ├── hooks/          # API hooks + scenario hooks
│   │   │   ├── lib/            # Query client, utilities
│   │   │   ├── service/        # HTTP logic + WebSocket subscribers
│   │   │   └── store/          # Zustand stores
│   │   └── app.json
│   │
│   └── web/                    # Next.js 15 (marketing + admin)
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   ├── components/     # admin, marketing, ui
│       │   ├── lib/            # admin-api-client, auth helpers
│       │   ├── messages/       # i18n JSON files
│       │   └── middleware.ts   # Edge middleware for admin auth
│       └── global.css
│
├── packages/
│   ├── assets/                 # @patty/assets — SVG logo sources + PNG generation pipeline
│   ├── contracts/              # @patty/contracts — shared Zod schemas & types
│   └── config/                 # @patty/config — shared ESLint + TS configs
│
├── Dockerfile.api              # API deployment (Railway)
├── Dockerfile.web             # Web deployment (Railway)
├── docker-compose.yml          # Dev Postgres + Redis
├── justfile                    # Root command runner
├── turbo.json                  # Turborepo pipeline
└── package.json
```

### Multi-Instance Deployment

API runs as multiple Railway instances behind a load balancer. All shared state lives in PostgreSQL (persistent) and Redis (ephemeral).

| Subsystem | Strategy |
|-----------|----------|
| HTTP/WS Rate Limiting | Redis atomic counters with TTL |
| WebSocket Fan-out | Redis pub/sub to all instances |
| Presence Tracking | Redis `presence:{userId}` with 90s TTL |
| Session/Auth | Stateless JWT verified against DB |
| Migrations | Idempotent `runMigrations()` on startup |

## 3. Development Workflow

### Command Reference

> All development operations are performed through `just` recipes. Always prefer `just <cmd>` over running underlying tools directly (bun, docker, railway, eas, expo, etc.). This ensures consistent env setup, shell options, and task sequencing. Always prefer `just full` over `just gate` — `full` runs fix first so formatting issues don't cause gate failures.

Always use `just` recipes from the repo root.

#### Root

```bash
# quality
just full                # fix + gate across all workspaces (default)
just fix                 # Apply auto-fixes (prettier + eslint) everywhere
just gate                # lint + typecheck + test everywhere
just test                # Run all test suites

# database
just db-up               # Start Postgres + Redis containers
just db-down             # Stop containers
just db-reset            # Destroy volumes and restart
just db-logs             # Tail database container logs
just db-ps               # Show running database containers

# deploy
just api-deploy          # Deploy API service to Railway
just web-deploy          # Deploy web service to Railway

# dev
just install             # Install all workspace dependencies
just update              # Update all workspace dependencies
just clean               # Remove node_modules, build artifacts, lock files

# android
just emulator            # Start Android emulator (patty_test AVD)
just emulator-kill       # Kill any running Android emulator
just emulator-list       # List connected Android devices

# data
just generate-location-sql  # Generate location migration SQL from GADM data
```

#### API

```bash
# dev
just api dev             # Start API dev server with hot reload (port 8080)

# quality
just api full            # fix + gate
just api fix             # prettier + eslint --fix
just api gate            # lint + typecheck + test
just api test            # bun test (pass extra args: just api test -- --watch)

# database
just api db-generate     # Generate migration from schema changes
just api db-migrate      # Apply pending migrations
just api db-studio       # Open Drizzle Studio (local DB UI)
just api db-push         # Push schema directly without migration (dev only)
```

#### Web

```bash
# dev
just web dev             # Start Next.js dev server (port 3000)

# quality
just web full            # fix + gate
just web fix             # prettier + eslint --fix
just web gate            # lint + typecheck
```

#### Mobile

```bash
# dev
just mobile local        # Set local backend env (LAN IP → .env.local)
just mobile prod         # Set production backend env (Railway → .env.local)
just mobile expo         # Start Expo dev server (raw, no env preset)

# quality
just mobile full         # fix + gate
just mobile fix          # prettier + eslint --fix
just mobile gate         # lint + typecheck + test
just mobile test         # Jest tests (pass extra args: just mobile test -- --watch)
just mobile doctor       # Run expo-doctor health check

# e2e
just mobile e2e-env      # Write E2E emulator loopback URL to .env.local
just mobile e2e-fast     # Incremental E2E build (~30-60s, uses Gradle cache)
just mobile e2e-full     # Full clean E2E build (~2-3 min, clean slate)
just mobile test-e2e     # Run Maestro tests only (APK must be installed)
just mobile e2e          # Fast build + run tests (default interactive E2E)

# eas
just mobile build-android            # EAS Android build (preview profile)
just mobile ota-update               # Publish OTA update (default message)
just mobile ota-update msg="Custom"  # Publish OTA update with custom message
```

### Local Development

**Prerequisites:** Bun, Docker

**API:**
1. `just db-up` — starts PostGIS + Redis
2. Copy `apps/api/.env.example` → `apps/api/.env`
3. `just api dev` — migrations apply automatically

**Web:**
1. Copy `apps/web/.env.example` → `apps/web/.env.local`
2. Set `INITIAL_SUPER_ADMIN_EMAIL` and `INITIAL_SUPER_ADMIN_PASSWORD` in `apps/api/.env`
3. `just api dev` — admin account is auto-seeded on startup
4. `just web dev` — port 3000

**Mobile:**
1. `bun install`
2. Copy `apps/mobile/.env.example` → `apps/mobile/.env`
3. `just mobile local`

### Environment Variables

All environment variables are documented in `.env.example` files:
- **API:** `apps/api/.env.example` — DATABASE_URL, JWT_SECRET, CLOUDINARY_*, REDIS_URL, etc.
- **Web:** `apps/web/.env.example` — API_INTERNAL_URL, ADMIN_JWT_SECRET, store links
- **Mobile:** `apps/mobile/.env.example` — EXPO_PUBLIC_BASE_URL, EXPO_TOKEN

**CI/CD Secrets (GitHub):** RAILWAY_TOKEN, EXPO_TOKEN, ADMIN_JWT_SECRET, PERSONAL_TOKEN

### Git
- **Commit format:** `<type>(<scope>): <title>` (e.g., `feat(auth): add phone verification`)
- **Types:** feat, fix, refactor, perf, style, test, docs, build, ci, chore, ops
- **PR target:** Always `dev` (never `master`)
- **CI/CD:** On PR → lint/typecheck/test. On push to master → Railway deploy + EAS OTA.
- Do **NOT** commit `.env` files.

## 4. Codebase Patterns & Best Practices

### API

- **No `console.log`** — use structured logging via `pino`.
- **Enums over magic strings** — use `z.enum()` from `@patty/contracts`.

#### Architecture & Call Chain
```
routes.ts (inline handlers) → service.ts → repository.ts → Drizzle/SQL
```

- **Routes:** Contain validators and handlers inline (required for Hono's `c.req.valid()` type inference).
- **Services:** Orchestration logic + domain events via `eventBus.emit()`.
- **Repositories:** Own all SQL — services never call `db` directly.

#### Handler Pattern
```typescript
// ✅ CORRECT - Handler inline with route
.post("/register", zValidator("json", schema), async (c) => {
  const data = c.req.valid("json");  // Fully typed
  await service.register(data, clientIp(c));
  return c.json(null, 201);
})

// ❌ WRONG - Separate handler breaks type inference
.post("/register", zValidator("json", schema), handleRegister)
```

#### Domain Events
- Services emit via `eventBus.emit()` (e.g., `match.created`, `message.sent`).
- `registerEventListeners()` fans out to WebSocket + push notifications.

#### Error Handling
- Use `AppError` from `src/lib/errors.ts`: `AppError.notFound()`, `AppError.unauthorized()`, etc.
- Global middleware serializes to JSON responses.

#### PostGIS
Use `db.execute(sql\`...\`)` for geometry operations (Drizzle has no native PostGIS support).

#### 204 Responses
Use `c.body(null, 204)` — not `c.json(null, 204)`.

### Mobile

- No `{}` type — use `Record<string, unknown>` or specific interfaces.

#### UI Safety Rules
- **No hardcoded numeric values** — Every numeric value in a StyleSheet must come from a theme token. If the exact value doesn't exist as a token, use the closest existing one — do **not** invent new tokens for one-off values. Component-specific measurements that appear only once belong inline as constants inside the component, not in the global token system.
- **No `className` prop** — Forbidden (`pati/no-classname-prop`). Use `style` prop with `StyleSheet.create((theme) => ...)`.
- **No hardcoded style literals** — Never write `padding: 16`, `borderRadius: 8`, `zIndex: 50`, or `borderWidth: 1` in StyleSheet. Use `theme.spacing.lg`, `theme.borderRadius.sm`, `theme.zIndex.modal`, `theme.borderWidth.sm`, `...theme.typography.body`, `...theme.getShadow(n)` — enforced by `pati/no-hardcoded-style-token`.
- **No inline styles with raw values** — Static inline style props are flagged by `pati/no-static-inline-styles`. Move styles to `StyleSheet.create((theme) => ...)`.
- **No hardcoded colors** — Never use `'#FF0000'` or named colors in `style={{}}`, `color=`, `tintColor=`, or any other color prop. Use `theme.colors.*` from `useUnistyles()` — enforced by `pati/no-theme-colors-in-styles`.
- **No hardcoded icon sizes** — Never write `size={20}` or `size={24}` on icon components. Use `theme.sizes.iconSm` (16), `theme.sizes.icon` (24), or `theme.sizes.iconLg` (40) — enforced by `pati/no-hardcoded-icon-size`.
- **No `opacity` on `<Text>`** — Causes font clipping on Android. Use semantic color tokens instead — enforced by `pati/no-opacity-on-text`.
- **No SafeAreaView component** — Use `useSafeAreaInsets()` hook instead.
- **No native `Alert.alert`** — Use `useAlert()` for confirmations, `useToast()` for notifications.
- **No `console.*` in source** — Use logger from `src/utils/logger.ts`.
- **No hardcoded strings** — Use `t()` from `react-i18next` for all user-facing text.

#### Data Handling
- **Server State:** React Query is the only authority for server-side state.
- **Client State:** Zustand stores are strictly for client-side persistence (JWT tokens, local settings).
- **Runtime Validation:** All API responses validated via Zod schemas from `@patty/contracts`.
- **Hydrated Bootstrap:** Initial profile data fetched before splash screen hides.

#### Async & Promises
- **No async in void positions.** Extract to named function and call with `void`.
- **No `await` on non-promises.**

#### Architecture & Call Chain
```
Screen → Scenario Hook → API Hook → Service → src/api/client.ts
```

- **Components** cannot import from `src/api/client.ts` or `src/service/*`.
- **Hooks** cannot import from `src/api/client.ts`.
- **All mutations** use `useApiMutation` — never import `useMutation` directly.
- **No manual token passing.** JWT injected automatically via `src/api/token.ts`.

#### React & React Native
- **Never use array index as `key`.** Use stable identifiers (`item.id`).
- **Hook deps must be complete.** Missing deps cause stale closures.
- **No inline styles** — move styles to `StyleSheet.create((theme) => ...)`.
- **No Text Opacity Utilities** on Android — causes font clipping. Use semantic colors.
- **No hardcoded style values** — use `theme.spacing.*`, `theme.borderRadius.*`, `...theme.typography.*`, `...theme.getShadow(n)`.

#### UI Styling Guide

##### Design System

All styles go through `StyleSheet.create((theme) => ...)`. Access the theme via `const { theme } = useUnistyles()` when needed in JSX (e.g. for icon colors, dynamic values).

- **Colors:** `theme.colors.PRIMARY`, `theme.colors.TEXT`, `theme.colors.SURFACE`, `theme.colors.BORDER`, `theme.colors.ERROR`, `theme.colors.SUCCESS`, etc.
- **Typography:** Spread into style objects — `...theme.typography.body` (16px), `...theme.typography.heading` (24px), `...theme.typography.caption` (9px), `...theme.typography.label` (12px). Never set `fontSize`/`lineHeight` directly.
- **Spacing:** `theme.spacing.xs` (4) → `theme.spacing['4xl']` (40). Standard gutter: `theme.spacing['2xl']` (24px).
- **Border Radius:** `theme.borderRadius.md` (inputs/12px), `theme.borderRadius.full` (pills/9999), `theme.borderRadius.xl` (containers/24px).
- **Shadows:** `...theme.getShadow(n)` — platform-aware (Android: elevation, iOS: shadow\* props). Levels 1–5.
- **Token reference:**

| Token | Key Values |
|-------|-----------|
| `theme.spacing.*` | xs=4, sm=8, md=12, lg=16, xl=20, 2xl=24, 3xl=32, 4xl=40 |
| `theme.borderRadius.*` | xs=4, sm=8, md=12, lg=16, xl=24, 2xl=32, full=9999 |
| `theme.borderWidth.*` | sm=1, md=1.5, lg=2, 2xl=4 |
| `theme.typography.*` | title, heading, display, sectionHeader, body, bodySmall, button, label, caption |
| `theme.sizes.*` | iconSm=16, icon=24, iconLg=40, badge=8, badgeLg=12, avatarSm=40, avatar=56, avatarLg=80, avatarXl=120, actionSm=50, action=60 |
| `theme.heights.*` | indicator=5, row=30, buttonSm=35, control=50, buttonLg=60 |
| `theme.zIndex.*` | base=1, dropdown=10, sticky=20, modal=50, toast=60, tooltip=70, overlay=100, max=9999 |

##### Core Components
| Component | Usage |
|-----------|-------|
| **ScreenContainer** | Required root for all screens. Handles safe area, keyboard, header. Props: `header`, `loading`. |
| **ModalContainer** | Unified modal with keyboard handling. Props: `maxHeight`, `keyboardMode`. |
| **AppHeader** | Only via `header` prop of ScreenContainer. Never standalone. |
| **ActionButton** | Primary button, defaults to pill shape. |
| **Toast** | Use `useToast()` for notifications. |
| **Dialog** | Use `useAlert()` for confirmations. Never native `Alert.alert`. |

##### Common Patterns
| Pattern | Style key (in StyleSheet.create) |
|---------|----------------------------------|
| Screen with header | `<ScreenContainer header={<AppHeader title="..." />}>` |
| Card container | `borderRadius: theme.borderRadius.xl, backgroundColor: theme.colors.SURFACE, padding: theme.spacing.md` |
| Row with spacing | `flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md` |
| Centered content | `flex: 1, alignItems: 'center', justifyContent: 'center'` |
| Standard screen padding | `paddingHorizontal: theme.spacing['2xl']` |
| Input field | `borderRadius: theme.borderRadius.md, borderWidth: theme.borderWidth.sm, borderColor: theme.colors.BORDER, backgroundColor: theme.colors.SURFACE, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, ...theme.typography.body` |

##### Navigation Hierarchy
- **Profile Tab:** Identity only (Pet list, Bio, Stats)
- **Settings Screen:** All configurations (Theme, Language, Security) — accessible via 3-dot menu

##### Quick Start: New Screen Template

```tsx
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppHeader } from 'src/component/common/AppHeader';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import type { MainStackParamList } from 'src/types/navigation';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'YourScreen'>;

export function YourScreen() {
  const { t } = useTranslation();
  // ... hooks

  return (
    <ScreenContainer header={<AppHeader title={t('yourScreen.title')} />}>
      <View style={styles.container}>
        {/* Your content */}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing['2xl'],
  },
}));
```

##### Quick Start: New Component Template

```tsx
import { Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface YourComponentProps {
  title: string;
  onPress: () => void;
}

export function YourComponent({ title, onPress }: YourComponentProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.BORDER,
    backgroundColor: theme.colors.SURFACE,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    ...theme.typography.body,
    color: theme.colors.TEXT,
  },
}));
```

##### Do's and Don'ts
| ❌ Wrong | ✅ Correct |
|----------|------------|
| `<Text style={{ fontSize: 16 }}>` | `<Text style={styles.body}>` with `body: { ...theme.typography.body }` |
| `<View style={{ padding: 16 }}>` | `<View style={styles.box}>` with `box: { padding: theme.spacing.lg }` |
| `className="..."` (any `className=`) | `style={styles.x}` — `className` prop is forbidden |
| `shadowOpacity: 0.1, shadowRadius: 4` | `...theme.getShadow(2)` in StyleSheet |
| `style={{ color: '#FF0000' }}` | `style={{ color: theme.colors.ERROR }}` |
| `color="#FFFFFF"` on icon/component | `color={theme.colors.TEXT}` via `useUnistyles()` |
| `borderRadius: 8` in StyleSheet | `borderRadius: theme.borderRadius.sm` |
| `borderWidth: 1` in StyleSheet | `borderWidth: theme.borderWidth.sm` |
| `zIndex: 50` in StyleSheet | `zIndex: theme.zIndex.modal` |
| `fontSize: 16` in StyleSheet | `...theme.typography.body` spread |
| `<Heart size={24} />` | `<Heart size={theme.sizes.icon} />` via `useUnistyles()` |
| `<Text style={{ opacity: 0.5 }}>` | Use a semantic color token with reduced opacity baked in |

##### Icons (Lucide)
Import from `src/lib/icons` (never from `lucide-react-native` directly). Both `size` and `color` must use theme tokens via `useUnistyles()`:
```tsx
import { Heart } from 'src/lib/icons';
import { useUnistyles } from 'react-native-unistyles';

const { theme } = useUnistyles();
// ✅ size and color from theme — enforced by pati/no-hardcoded-icon-size and pati/no-theme-colors-in-styles
<Heart size={theme.sizes.icon} color={theme.colors.PRIMARY} />

// ❌ both will error at lint
<Heart size={24} color="#FF0000" />
```

Available size tokens: `theme.sizes.iconSm` (16), `theme.sizes.icon` (24), `theme.sizes.iconLg` (40).

#### Internationalization (i18n)
- **Single Source:** `tr.json` is base type. Every key must exist in `en.json`.
- **Namespaces:** `common`, `auth`, `profile`, `pet`, `location`, `settings`, `navigation`, `chat`, `discovery`, `error`, `date`
- **Key format:** `namespace.descriptive_key` (e.g., `auth.login_title`)
- **Interpolation:** `{{variable}}` syntax
- **Locale files:** `apps/mobile/src/i18n/en.json`, `apps/mobile/src/i18n/tr.json`
- **Enforcement:**
  - `i18n-consistency.test.ts` — ensures every key in `tr.json` exists in `en.json`
  - `i18n-unused.test.ts` — fails gate if keys are defined but not used in `src/`

#### Forms & Inputs
- Use `react-hook-form` with `ControlledInput` wrapper.
- Use `TaggedInput` component for all form inputs.

#### Keyboard Handling
- **Root Setup:** `KeyboardProvider` from `react-native-keyboard-controller` wraps app.
- **Android Config:** `softwareKeyboardLayoutMode: "resize"` in `app.json`.
- **ScreenContainer Modes:** `static`, `keyboard-aware`, `list`, `scroll`.
- **No SafeAreaView component** — use `useSafeAreaInsets()` hook.

## 5. Code Standards

- Readability and consistency over cleverness
- Follow existing patterns
- Document *why*, not *what*
- Use enums over magic strings
- Self-documenting code where possible

### Language & Type Safety
- **Indentation:** 2 spaces
- **No `any`** — use `unknown` or specific types
- **Use `===` and `!==`** exclusively
- **No `!` non-null assertions** — handle nullability explicitly
- **No `as` type assertions** — use type guards or `z.parse()` instead. `as const` is the only allowed form.
- **Use `??` instead of `||`** for null/undefined fallbacks
- **Await all promises** — wrap in `void` only if intentional
- **Named exports only** — no `export default`
- **Use `import type`** for type-only imports
- **Exhaustive switches** — handle all variants

### Suppression Comments — Absolute Ban
Never add: `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `prettier-ignore`. If a rule flags correct code, fix the code — do not suppress.

### Module System & Imports
- **Absolute imports** via `src/` alias. No `../` parent imports.
- **No barrel imports** — import directly from source file.
- **Sorted imports** — run `just mobile fix` to auto-sort.
- **No unused/duplicate imports**.

## 6. Validation

### Testing Policy

Tests exist to catch regressions and verify business logic — not coverage numbers.

**Guiding Principles:**
- Test behavior, not implementation
- One test, one scenario
- No test bloat — don't test framework behavior or type guarantees
- Fast feedback — unit tests in milliseconds, integration tests with shared DB

**Worth Testing:** Business logic, edge cases, error paths, data transformations, state transitions, integration between layers.

**Not Worth Testing:** Simple CRUD, framework wiring, TypeScript correctness, getters/setters, UI layout.

### API Testing

**Runner:** `bun:test` | **Run:** `just api test`

#### Test Bootstrap
`bunfig.toml` preloads `test-setup.ts` once before all tests:
1. Env vars → 2. DB check → 3. Migrations → 4. Reset user data → 5. Seed reference data

#### Database Isolation
- **One-time setup** via preload — no per-test resets
- **UUID-based isolation** — each test creates unique data
- **`withTransaction`** for rollback-based isolation when needed

#### Two-Layer Model
- **Layer 1 (Integration):** Real HTTP requests to Hono app against real Postgres. Primary test type.
- **Layer 2 (Unit):** Pure service logic in isolation. Only for complex orchestration.

#### Mocking Rules
Use `spyOn()`, never `mock.module()`. `mock.module()` poisons the module cache permanently.

```typescript
// ✅ CORRECT
beforeEach(() => {
  spyOn(repoModule, "findById").mockImplementation(mockFn);
});
afterEach(() => mock.restore());

// ❌ WRONG
void mock.module("@patty/api/lib/password", () => ({ ... }));
```

### Mobile Testing

**Runner:** Jest + MSW | **Run:** `just mobile test`

#### Three-Layer Model
- **Layer 1 (Unit):** Scenario hooks via `renderHook`. Mock API hooks, not Zustand.
- **Layer 2 (Screen):** Full screen with `renderWithProviders`. MSW for HTTP. Never mock `ScreenContainer`, `AppHeader`, `Card`, `ActionButton`.
- **Layer 3 (Navigation):** Routing decisions only. Mock screens, not navigators.

#### Mocking Rules
- **Never** use `jest.resetAllMocks()` — use `jest.clearAllMocks()`
- **Never** re-mock globally-mocked modules (`useTheme`, navigation, lucide)
- Prefer MSW over hook-level mocks

#### Test Utilities
- `renderWithProviders` — for all screen tests
- `renderHookWithProviders` — for hooks using React Query
- `factories` — data factory helpers

#### Best Practices
- **Preserve Global Mocks:** Never use `jest.resetAllMocks()`. Use `jest.clearAllMocks()`. Override with `(useNavigation as jest.Mock).mockReturnValue(...)`.
- **Zero-Injection Querying:** Prefer `getByPlaceholderText('i18n.key')` or `getByText('i18n.key')`. The i18n mock returns the key as the value.
- **Mock at Scenario Layer:** For screen tests, prefer mocking the Scenario Hook (e.g., `jest.mock('src/hooks/scenario/useXScenario')`).
- **Handle Form Async:** Always assume `react-hook-form` actions are async. Wrap triggers in `act()` and expectations in `waitFor()`.
- **Always use `renderWithProviders`** — never plain `render` in screen tests.

### E2E Testing (Maestro)

Located in `apps/mobile/e2e/`. Uses "Shadow Cleanup" — resets dedicated test account before each run.

**Flows:** `auth.yaml`, `discovery.yaml`, `pet.yaml`, `chat.yaml`, `profile.yaml`

**Run:** `just mobile e2e` (interactive) or `just mobile e2e-headless` (automated)

### Quality Gates

Before marking any task complete, **`just full`** must pass:

1. **Prettier** format check
2. **ESLint** (`--no-inline-config --quiet`) catches:
   - Suppression comments
   - Architecture violations (layer boundaries, barrel imports)
   - Type safety (`any`, `!` assertions, `as` type assertions, non-exhaustive switches)
   - Async correctness (floating promises, await on non-promises)
   - React correctness (missing deps, index as key, inline styles)
   - Test hygiene (`it.only`, `test.skip`, assertion-free tests)
   - Custom `pati/` rules (all errors):
     - `no-hardcoded-style-token` — numeric literals in StyleSheet.create for spacing/radius/font/shadow/zIndex/borderWidth/dimensions (width, height, minWidth, maxWidth, minHeight, maxHeight)/positioning (top, bottom, left, right)
     - `no-classname-prop` — `className` prop is forbidden
     - `no-static-inline-styles` — static inline style values must move to StyleSheet
     - `no-theme-colors-in-styles` — hardcoded colors in `style={{}}` or direct color props (`color=`, `tintColor=`, etc.)
     - `no-hardcoded-icon-size` — icon components from `src/lib/icons` must use `theme.sizes.*` for `size` prop
     - `no-opacity-on-text` — `opacity` on `<Text>` causes Android font clipping; use semantic colors
     - `screen-must-use-screen-container` — every screen must render ScreenContainer
     - `no-standalone-app-header` — AppHeader only via `header` prop of ScreenContainer
     - `no-hardcoded-animation-values` — animation durations/delays must use `Config.animation.*`
     - `no-nested-ternary-jsx` — nested ternaries in JSX must be extracted to named functions
     - `no-platform-inline-style` — Platform.OS style checks must use centralized utility
     - `require-testid-on-interactive` — TouchableOpacity, Pressable, TextInput, ActionButton need `testID`
   - Root `local/` rules (all workspaces):
     - `local/no-type-assertion` — `as SomeType` is forbidden; use a type guard or Zod parse instead. `as const` is exempt.
3. **TypeScript** type-check (strict mode)
4. **Test suites** (api + mobile)

Additional requirements:
- No hardcoded colors/strings — use tokens and i18n
- No `console.*` in source — use logger
- Repositories own all SQL — no DB calls in services
