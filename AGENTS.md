# AI Agent Guidelines — Zeffyr Music

> Single source of truth for AI agents. Read this file first.
> Target quality: **17/20 minimum** — Production-ready, maintainable code.

## Tech Stack

| Layer            | Technology                                  | Version  |
| ---------------- | ------------------------------------------- | -------- |
| Framework        | Angular (SSR, standalone, zoneless)         | 22.0.4   |
| State Management | @ngrx/signals (Signal Stores)               | 21.1.1   |
| UI Framework     | Bootstrap + ng-bootstrap                    | 5.3 / 21 |
| Icons            | Material Icons (optimized subset)           | 1.13     |
| i18n             | Transloco + MessageFormat                   | 8.3      |
| Font             | Nunito (Regular/SemiBold/Bold/800)          | local    |
| Unit Tests       | Vitest                                      | 4.x      |
| E2E Tests        | Playwright                                  | 1.60.x   |
| Change Detection | OnPush everywhere (zoneless)                |          |
| Dark Mode        | `data-bs-theme="dark"` on `<body>`          |          |
| Error Tracking   | Sentry (`@sentry/angular` + `@sentry/node`) | 10.x     |

## Required Reading Before Code Changes

1. **This file** — Architecture, rules, patterns
2. **`css-critical-rules` skill** — YouTube player CSS (BREAKING if violated)
3. **`ssr-safety` skill** — SSR config, allowedHosts, browser API safety
4. The relevant **`.claude/skills/*`** skill for the domain you're modifying (see `CLAUDE.md`)

## Architecture Overview

```
Browser
├── Angular Components (OnPush + Signals)
│   ├── Feature pages (lazy-loaded routes)
│   └── Shared directives, pipes, skeleton loaders
├── Signal Stores (centralized reactive state)
│   ├── AuthStore      — Auth, user preferences, dark mode
│   ├── PlayerStore    — Playback status, progress, volume
│   ├── QueueStore     — Track queue, shuffle, current track
│   ├── UserDataStore  — Playlists, follows, liked videos
│   └── UiStore        — Modals, notifications, mobile state, cross-component events
├── Services (HTTP + business logic, NO state holding)
├── Sentry (error tracking, browser + SSR)
└── YouTube IFrame API (external player)

SSR Server (Express.js)
├── Angular SSR Rendering
└── API Proxy → PHP/Jelix Backend (snake_case API)
```

## Folder Structure

```
src/app/
├── store/                    # Signal Stores
│   ├── index.ts             # Barrel exports (models + stores + features)
│   ├── features/            # withSsrSafety(), withLocalStorage()
│   ├── auth/                # AuthStore + models + spec
│   ├── player/              # PlayerStore
│   ├── queue/               # QueueStore
│   ├── user-data/           # UserDataStore
│   └── ui/                  # UiStore
├── services/                 # 19 services (all with specs)
│   ├── init.service.ts      # App bootstrap, session, ping
│   ├── player.service.ts    # Playback orchestration
│   ├── youtube-player.service.ts  # YouTube IFrame API wrapper
│   ├── user.service.ts      # User HTTP operations
│   ├── user-library.service.ts    # Library HTTP operations
│   ├── playlist.service.ts  # Playlist HTTP operations
│   ├── artist.service.ts    # Artist HTTP operations
│   ├── search.service.ts    # Search HTTP operations
│   ├── seo.service.ts       # Canonical URL management
│   ├── focus.service.ts     # Focus management
│   ├── keyboard-shortcut.service.ts  # Keyboard shortcuts
│   ├── playlist-thumbnail.service.ts # Thumbnail generation
│   ├── logging.service.ts   # Error reporting (Sentry abstraction)
│   └── auth-guard.service.ts # Route guard
├── models/                   # TypeScript interfaces
│   ├── album|artist|follow|playlist|video|user|search.model.ts
│   ├── player-running.model.ts
│   ├── google-identity.model.ts
│   └── test-mocks.model.ts  # Typed mock interfaces for tests
├── directives/               # Shared directives + skeleton loaders
│   ├── default-image.directive.ts   # Fallback on image error
│   ├── lazy-load-image.directive.ts # IntersectionObserver lazy load
│   ├── swipe-down.directive.ts      # Touch swipe gesture
│   ├── skeleton-card/       # Card grid skeleton (home, search)
│   ├── skeleton-list/       # Track list skeleton (search tracks)
│   ├── skeleton-artist/     # Artist profile skeleton
│   └── skeleton-playlist/   # Playlist page skeleton (header + tracks)
├── pipes/
│   └── to-mmss.pipe.ts      # Duration seconds → "m:ss"
├── utils/
│   ├── format-time.ts       # Duration formatting (TypeScript)
│   └── index.ts
├── interceptor/              # HTTP interceptors
├── [feature]/               # Feature components (lazy-loaded)
│   ├── home/    artist/    playlist/    search/
│   ├── current/    my-playlists/    my-selection/
│   ├── settings/    help/    reset-password/
│   ├── header/    control-bar/    player/
│   └── search-bar/    toast-container/
├── tokens.ts                # InjectionTokens (REQUEST for SSR)
├── transloco.loader.ts      # Translation HTTP loader
└── app.config.ts            # App providers configuration
```

## Critical Rules

### 1. State: Stores vs Services

| Concern         | Store | Service |
| --------------- | ----- | ------- |
| State holding   | ✅    | ❌      |
| State mutations | ✅    | ❌      |
| HTTP calls      | ❌    | ✅      |
| Business logic  | ❌    | ✅      |

```typescript
// ✅ Shared state in stores
readonly authStore = inject(AuthStore);
if (this.authStore.isAuthenticated()) { ... }

// ❌ Never BehaviorSubject/Subject for app state
private isPlaying$ = new BehaviorSubject<boolean>(false);
```

### 2. Signals & Change Detection

```typescript
// ✅ Local state with signals
readonly isLoading = signal(false);
readonly displayName = computed(() => this.authStore.pseudo() || 'Guest');

// ✅ Access with function call syntax
this.isLoading();  // not this.isLoading

// ❌ Never use ChangeDetectorRef with signals
this.cdr.markForCheck(); // unnecessary
```

### 3. Dependency Injection

```typescript
// ✅ inject() function
private readonly userService = inject(UserService);
readonly authStore = inject(AuthStore);

// ❌ No constructor injection
constructor(private userService: UserService) {}
```

### 4. Transloco + Signal Forms

```typescript
// ✅ Arrow function — deferred until message displayed
minLength(schemaPath.password, 4, {
  message: () => this.translocoService.translate('validation_minlength', { min: 4 }),
});

// ❌ Direct call — evaluated before translations loaded
message: this.translocoService.translate('validation_minlength', { min: 4 });
```

### 5. SSR Safety

> **Full guide: the `ssr-safety` skill**

**CommonEngine `allowedHosts`** (since `@angular/ssr` 21.2.2):
Every production hostname/IP must be listed in `allowedHosts` in `src/server.ts`.
Missing entries cause **silent fallback to CSR** — no browser-visible error.
The server public IP is hardcoded because it sits behind NAT and is not visible via `os.networkInterfaces()`.

```typescript
// src/server.ts — static allowedHosts list
const commonEngine = new CommonEngine({
  allowedHosts: [
    'www.zeffyrmusic.com',
    'zeffyrmusic.com',
    'data.zeffyrmusic.com',
    '146.59.155.20', // Server public IP (NAT — not visible via networkInterfaces())
    '127.0.0.1',
    'localhost',
  ],
});
```

**Browser API access rules:**

```typescript
// ✅ Stores: use withSsrSafety()
export const MyStore = signalStore(
  { providedIn: 'root' },
  withSsrSafety(),
  withState(initialState)
);

// ✅ Components: use isPlatformBrowser(platformId)

// ❌ Never access directly — crashes on server
window.localStorage.getItem('key');
document.getElementById('el');
```

**Production requirements:** Node ≥ 22.12. After Node upgrade: `sudo pm2 kill` then restart.

### 6. CSS — YouTube Player (CRITICAL)

> **Read the `css-critical-rules` skill before ANY CSS change.**

- `#player` styles MUST be in `styles.scss` (global) — YouTube iframe has no Angular encapsulation
- Mobile `#player { height: 1px }` MUST be global — avoids "not attached to DOM" error
- Mobile `#container-player { padding-bottom: 0 }` in component CSS — removes 16:9 ratio

### 7. Comments & Code Quality

- **English only** for all comments (no French)
- Concise JSDoc — one-line summary for simple functions
- No `any` types — use `unknown` or proper types
- No dead code — remove unused imports/variables/methods
- Method length ≤ 30 lines, cyclomatic complexity ≤ 10
- `readonly` on injected dependencies and signals
- Prefer `globalThis` over `window` for standard browser APIs (`matchMedia`, `addEventListener`, `location`) — keeps `window.YT` / `window.onYouTubeIframeAPIReady` because of `Window` interface augmentations
- Prefer `Promise.resolve(x)` over `new Promise(resolve => resolve(x))`
- Prefer `String.replaceAll()` over `String.replace(/regex/g)` for plain string replacements
- Prefer optional chains (`a?.b`) over `a && a.b` when both falsy and undefined are equivalent — verify semantics first
- Prefer `Math.max(idx, 0)` over `idx >= 0 ? idx : 0`

### 8. Accessibility & Semantic HTML

- Use `<div role="status">` for live status regions that contain block-level or complex markup (skeleton loaders, spinners with wrapper divs, result lists, grids). `role="status"` implies `aria-live="polite"` and `aria-atomic="true"`. Add `aria-busy="true"` while loading.
- Use `<output>` only for **phrasing-only** status text — when the element's entire content is inline/phrasing content (e.g. a Bootstrap `<output class="spinner-border">` with a single `<span class="visually-hidden">Loading...</span>` inside). `<output>` has an **implicit `role="status"`** per the ARIA in HTML spec, so do not add it explicitly (SonarQube flags redundant roles). `<output>`'s content model is phrasing content — putting `<div>` elements inside is invalid HTML.
- Use native `<progress>` (not `<div role="progressbar">`) for determinate progress, **except** Bootstrap's `.progress` component where the role attribute is part of the design system.
- Do not add redundant `tabindex`, `role`, or `(keydown.*)` handlers on ng-bootstrap directives — they handle keyboard/ARIA automatically.

## Component Pattern

```typescript
@Component({
  selector: 'app-my-feature',
  templateUrl: './my-feature.component.html',
  styleUrl: './my-feature.component.scss',    // singular styleUrl
  imports: [TranslocoPipe, NgbTooltip, ...],  // standalone by default in Angular 22
  // OnPush is the Angular 22 zoneless default — do NOT set changeDetection
})
export class MyFeatureComponent {
  // 1. Injected dependencies
  private readonly myService = inject(MyService);
  readonly authStore = inject(AuthStore);

  // 2. Inputs/Outputs
  readonly playlistId = input.required<string>();
  readonly onClose = output<void>();

  // 3. Local state (signals)
  readonly isLoading = signal(false);

  // 4. Computed signals
  readonly displayName = computed(() => this.authStore.pseudo() || 'Guest');

  // 5. Methods
  onSubmit(): void { ... }
}
```

## Template Patterns

```html
<!-- Modern control flow (not *ngIf/*ngFor) -->
@if (isLoading()) {
<app-skeleton-card [count]="6" />
} @else { @for (item of items(); track item.id) {
<app-item [item]="item" />
} @empty {
<div class="empty-state">
  <span class="material-icons empty-state-icon" aria-hidden="true">search_off</span>
  <p class="empty-state-text">{{ 'no_results' | transloco }}</p>
</div>
} }

<!-- Signal values always called as functions -->
<div>{{ userName() }}</div>
<button [disabled]="isLoading()">Submit</button>
```

## UI Patterns

### Skeleton Loaders

4 dedicated components in `src/app/directives/`:

| Component                   | Selector                | Usage                           |
| --------------------------- | ----------------------- | ------------------------------- |
| `SkeletonCardComponent`     | `app-skeleton-card`     | Card grids (home, search)       |
| `SkeletonListComponent`     | `app-skeleton-list`     | Track lists (search tracks)     |
| `SkeletonArtistComponent`   | `app-skeleton-artist`   | Artist profile page             |
| `SkeletonPlaylistComponent` | `app-skeleton-playlist` | Playlist page (header + tracks) |

Shared styles in `_utilities.scss`: `.skeleton-pulse`, `.skeleton-line--title/subtitle/small`, `.skeleton-card-img`

### Empty State

Shared CSS in `_utilities.scss`: `.empty-state`, `.empty-state-icon`, `.empty-state-text`

```html
<div class="empty-state">
  <span class="material-icons empty-state-icon" aria-hidden="true">person_off</span>
  <p class="empty-state-text">{{ 'not_available' | transloco }}</p>
  <a class="btn btn-outline-primary mt-3" routerLink="/">{{ 'back_home' | transloco }}</a>
</div>
```

### Modal Alert System

Shared CSS in `_utilities.scss`: `.modal-alert` + 4 variants (`-danger`, `-success`, `-warning`, `-info`)

```html
<div class="modal-alert modal-alert-info">
  <span class="material-icons" aria-hidden="true">info</span>
  <span>Message text</span>
</div>
```

## Store Pattern

```typescript
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { withSsrSafety } from './features/with-ssr-safety';

interface MyState {
  items: Item[];
  loading: boolean;
}
const initialState: MyState = { items: [], loading: false };

export const MyStore = signalStore(
  { providedIn: 'root' },
  withSsrSafety(),
  withState(initialState),
  withComputed(store => ({
    itemCount: computed(() => store.items().length),
  })),
  withMethods(store => ({
    setItems(items: Item[]): void {
      patchState(store, { items, loading: false });
    },
  }))
);
```

## API Data Mapping

Backend is PHP/Jelix with snake_case. Frontend uses camelCase:

```typescript
// API: { est_connecte: true, id_perso: "123" }
// Model: { isAuthenticated: true, idPerso: "123" }
```

## SEO (Routed Components)

Every routed component must set title, meta description, and canonical URL via `Title`, `Meta`, `SeoService`.

## Testing

- **Framework**: Vitest (NOT Jest/Jasmine)
- **Coverage**: ≥ 80%
- **Typed mocks**: `src/app/models/test-mocks.model.ts`
- **Signal assertion**: `expect(component.isLoading()).toBe(false)` — function call syntax

## Routing

All routes lazy-loaded except `HomeComponent`. Protected by `AuthGuard`: `like`, `settings`, `my-playlists`, `my-selection`.

**Chunk loading error recovery** (`app.config.ts`): `withNavigationErrorHandler()` catches stale chunk errors after deployments (e.g. `TypeError: error loading dynamically imported module`). On first failure, it sets a `chunk-retry` item in `sessionStorage` and reloads the page. On second failure, it removes that item without reloading to prevent infinite loops. The item is also cleared after a successful bootstrap via `clearChunkRetryFlag()` in `main.ts`, so each deployment can benefit from a fresh retry.

## Design System

CSS custom properties defined in `_custom.scss` `:root`:

- **Spacing**: `--spacing-xs` (0.25rem) → `--spacing-2xl` (3rem)
- **Shadows**: `--shadow-sm/md/lg/xl`, `--shadow-card`, `--shadow-card-hover`
- **Transitions**: `--transition-fast` (150ms), `--transition-base` (200ms), `--transition-slow` (300ms)
- **Radii**: `--radius-sm/md/lg/xl/full`
- **Typography**: `--text-xs` → `--text-3xl`
- **Z-index**: `--z-dropdown` → `--z-tooltip`
- **Player**: `--control-bar-height`, `--control-bar-bg`, `--control-bar-text`, etc.

Brand colors: `$blue: #1ac8e5` (primary), `$orange: #fc7e12` (accent)

## SCSS File Structure

```
src/styling/
├── _custom.scss           # Bootstrap variable overrides + CSS custom properties (BEFORE Bootstrap)
├── _utilities.scss        # Shared utilities (~1270 lines, 11 sections)
├── _material-icons-optimized.scss
└── styles.scss            # Entry: imports custom → bootstrap → utilities → global styles
```

`_utilities.scss` sections: Custom Scrollbars, Touch Targets, Page Layout, Tracks List, CDK Drag-and-Drop, Shared Keyframes, Skeleton Loaders, Empty State, Original Utilities, Cards

## ng-bootstrap Accessibility

Handles keyboard/ARIA automatically. Do NOT add redundant `tabindex`, `(keydown.enter)`, `role="button"` on `ngbDropdownToggle`, `ngbTooltip`, `ngbPopover`, `ngbModal`, `ngbCollapse`.

## View Transitions

200ms cross-fade with blur-on-navigate to prevent aria-hidden focus conflicts:

```typescript
withViewTransitions({
  onViewTransitionCreated: () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  },
});
```

## Performance Budgets

- Initial bundle: warning 1.5MB, error 1.7MB
- Component style: warning 12kb, error 16kb

## Observability (Sentry)

**Browser** (`src/main.ts`): `@sentry/angular` with `browserTracingIntegration` + `httpClientIntegration`. Guarded by `environment.SENTRY_DSN` (empty in dev/e2e).

**SSR** (`src/server.ts`): `@sentry/node` + `Sentry.setupExpressErrorHandler(app)` after all routes.

**Angular ErrorHandler** (`src/app/app.config.browser.ts`): `Sentry.createErrorHandler({ showDialog: false })` catches unhandled template/lifecycle/signal errors. Only registered when `environment.SENTRY_DSN` is set.

**LoggingService** (`src/app/services/logging.service.ts`): Abstraction over Sentry SDK. All error reporting MUST go through this service — never call `Sentry.*` directly from components or services. SSR-safe: `SENTRY_API` token is only provided in browser configs, so all methods are automatic no-ops on the server.

| Method             | Use case                                      |
| ------------------ | --------------------------------------------- |
| `captureError()`   | Caught exceptions (HTTP errors, API failures) |
| `captureWarning()` | Non-fatal issues (YouTube player errors)      |
| `captureInfo()`    | Informational events                          |
| `setUser()`        | Associate/clear user on login/logout          |
| `addBreadcrumb()`  | Manual navigation/interaction breadcrumbs     |
| `setTag()`         | Custom tags for filtering                     |

**Instrumented locations:**

- `errorInterceptor` — all HTTP errors except 401 (session expiry)
- `YoutubePlayerService.onError()` — player errors as warnings
- `InitService` — user association on login/logout

**Release tracking:** `SENTRY_RELEASE` is injected into `environment.prod.ts` via `sed` in CI before the production build. Source maps are uploaded to Sentry with the same release tag.

**Environment tagging:** Each environment file sets `SENTRY_ENVIRONMENT` explicitly (`development`, `e2e`, `staging`, `production`). This avoids staging errors being tagged as production.

**CI secrets required:** `SENTRY_AUTH_TOKEN` (for source map uploads, scoped to the upload step only)

## Git Conventions

```
feat|fix|refactor|test|docs: short description
```

## Commands

```bash
npm start                    # Dev server
npm run serve:ssr:zeffyrmusic # SSR server (serves dist after npm run build)
npm test                    # Vitest watch mode
npx vitest run              # Single run
npx vitest run --coverage   # With coverage
npm run lint                # ESLint
npm run build               # Production build
npm run e2e                 # Playwright E2E tests (alias: ng e2e)
npm run e2e:ui              # Playwright interactive UI mode (alias: ng e2e --ui)
```

## AI Tooling — Claude Code

The primary AI agent for this repo is **Claude Code**. Its configuration lives under `.claude/`
and is documented in **[`CLAUDE.md`](CLAUDE.md)**:

- **`.claude/skills/*/SKILL.md`** — domain guides loaded on demand (components, templates, services,
  stores, SSR, CSS critical rules, styling, testing, e2e, SEO, CI, API mapping, player lifecycle)
- **`.claude/agents/*.md`** — subagents (`angular-migration`, `player-debug`, `ssr-debug`)
- **`.claude/commands/*.md`** — slash commands (`/create-component`, `/refactor-to-signals`, …)
- **`.claude/settings.json`** — `PostToolUse` hook running `prettier --write` + `eslint --fix` on edits

## Angular CLI MCP Server (optional)

The Angular CLI ships an MCP server that gives AI agents Angular-aware tools. It is **optional**.

- **Claude Code:** register it with `claude mcp add angular -- npx @angular/cli mcp` (or add it to a
  project-level `.mcp.json`), then enable experimental tools with the `-E` flag.
- **VS Code (Angular Language Service):** `.vscode/settings.json` sets
  `"angular.experimental.autoStartMCP": true`.

### Default Tools

| Tool                        | Description                                                                          | Local | Network |
| --------------------------- | ------------------------------------------------------------------------------------ | ----- | ------- |
| `ai_tutor`                  | Interactive AI-powered Angular tutor                                                 | Yes   | Yes     |
| `find_examples`             | Find authoritative code examples from official best-practice database                | Yes   | Yes     |
| `get_best_practices`        | Retrieve Angular Best Practices Guide (standalone, typed forms, modern control flow) | Yes   | Yes     |
| `list_projects`             | List all applications and libraries in the workspace from `angular.json`             | Yes   | Yes     |
| `onpush_zoneless_migration` | Analyze code and provide step-by-step plan to migrate to OnPush/zoneless             | Yes   | Yes     |
| `search_documentation`      | Search official Angular documentation at angular.dev                                 | No    | Yes     |

### Experimental Tools (enabled via `-E`)

| Tool                       | Description                                                     |
| -------------------------- | --------------------------------------------------------------- |
| `build`                    | One-off `ng build` (non-watched)                                |
| `test`                     | Run the project's unit tests                                    |
| `e2e`                      | Execute end-to-end tests                                        |
| `devserver.start`          | Start `ng serve` asynchronously (watch mode)                    |
| `devserver.stop`           | Stop a running dev server                                       |
| `devserver.wait_for_build` | Get output logs of the most recent dev server build             |
| `modernize`                | Run code migrations to align with latest Angular best practices |

### Usage Notes

- `devserver.start` consumes a port — avoid if a dev server is already running
- `modernize` is read-only safe and can suggest migration steps
- Once registered, these tools are available to any MCP-capable agent, including Claude Code

## Playwright MCP Server (optional)

`@playwright/mcp` lets an agent pilot a real browser to navigate, interact, take screenshots, and
verify UI after code changes. It is **optional**.

- **Claude Code:** register it with `claude mcp add playwright -- npx @playwright/mcp@latest`
  (or add it to a project-level `.mcp.json`).

### Available Capabilities

| Capability   | Description                            |
| ------------ | -------------------------------------- |
| `navigate`   | Open a URL in the browser              |
| `click`      | Click on elements                      |
| `fill`       | Fill form inputs                       |
| `screenshot` | Capture and analyze screenshots        |
| `snapshot`   | Get accessibility snapshot of the page |
| `evaluate`   | Run JavaScript in the browser console  |

### Usage Notes

- Use after UI modifications to visually validate the result
- The dev server must be running (`npm start` or `npm run serve:ssr`)
- Prefer `snapshot` over `screenshot` for text content verification
