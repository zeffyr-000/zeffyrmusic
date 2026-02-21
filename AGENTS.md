# AI Agent Guidelines — Zeffyr Music

> Single source of truth for AI agents. Read this file first.
> Target quality: **17/20 minimum** — Production-ready, maintainable code.

## Tech Stack

| Layer            | Technology                          | Version  |
| ---------------- | ----------------------------------- | -------- |
| Framework        | Angular (SSR, standalone, zoneless) | 21.1.5   |
| State Management | @ngrx/signals (Signal Stores)       | 21.0.1   |
| UI Framework     | Bootstrap + ng-bootstrap            | 5.3 / 20 |
| Icons            | Material Icons (optimized subset)   | 1.13     |
| i18n             | Transloco + MessageFormat           | 8.2      |
| Font             | Nunito (Regular/SemiBold/Bold/800)  | local    |
| Unit Tests       | Vitest                              | 4.x      |
| E2E Tests        | Cypress                             | 15.x     |
| Change Detection | OnPush everywhere (zoneless)        |          |
| Dark Mode        | `data-bs-theme="dark"` on `<body>`  |          |

## Required Reading Before Code Changes

1. **This file** — Architecture, rules, patterns
2. **`.github/instructions/css-critical-rules.md`** — YouTube player CSS (BREAKING if violated)
3. Relevant `.github/instructions/*.md` file for the domain you're modifying

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
│   └── UiStore        — Modals, notifications, mobile state
├── Services (HTTP + business logic, NO state holding)
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
├── services/                 # 13 services (all with specs)
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

```typescript
// ✅ Use withSsrSafety() in stores — provides isBrowser(), getLocalStorage(), setBodyAttribute()
export const MyStore = signalStore(
  { providedIn: 'root' },
  withSsrSafety(),
  withState(initialState)
);

// ❌ Never access browser APIs directly
window.localStorage.getItem('key');
document.getElementById('el');
```

### 6. CSS — YouTube Player (CRITICAL)

> **Read `.github/instructions/css-critical-rules.md` before ANY CSS change.**

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

## Component Pattern

```typescript
@Component({
  selector: 'app-my-feature',
  templateUrl: './my-feature.component.html',
  styleUrl: './my-feature.component.scss',    // singular styleUrl
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, NgbTooltip, ...],  // standalone by default in Angular 21
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

- Initial bundle: warning 1.2MB, error 1.5MB
- Component style: warning 12kb, error 16kb

## Git Conventions

```
feat|fix|refactor|test|docs: short description
```

## Commands

```bash
npm start                    # Dev server
npm run serve:ssr           # SSR dev server
npm test                    # Vitest watch mode
npx vitest run              # Single run
npx vitest run --coverage   # With coverage
npm run lint                # ESLint
npm run build               # Production build
```
