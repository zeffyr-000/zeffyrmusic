# AI Agent Guidelines - Zeffyr Music

> Guidelines for AI agents working on this Angular project.
> Target quality: **17/20 minimum** - Production-ready, maintainable code.

## Project Overview

- **Framework**: Angular 21 with SSR (Server-Side Rendering)
- **State Management**: @ngrx/signals (Signal Stores)
- **Testing**: Vitest (unit), Cypress (E2E)
- **Styling**: SCSS + Bootstrap 5
- **i18n**: Transloco (fr/en)
- **Change Detection**: OnPush everywhere (zoneless-ready)

---

## 🚨 Critical Rules

### 1. State Management

**DO:**

```typescript
// Use Signal Stores for shared state
const playerStore = inject(PlayerStore);
if (playerStore.isPlaying()) { ... }
```

**DON'T:**

```typescript
// ❌ No BehaviorSubject/Subject for shared state
private isPlaying$ = new BehaviorSubject<boolean>(false);

// ❌ No manual state in services when store exists
this.currentVideo = video; // Use store instead
```

### 2. Change Detection

**DO:**

```typescript
// Use signals for local component state
readonly isLoading = signal(false);
readonly error = signal('');

// In callbacks:
this.isLoading.set(true);
// Automatic change detection - no markForCheck needed
```

**DON'T:**

```typescript
// ❌ No ChangeDetectorRef with signals
private cdr = inject(ChangeDetectorRef);
this.isLoading = true;
this.cdr.markForCheck(); // Unnecessary with signals
```

### 3. Dependency Injection

**DO:**

```typescript
// Use inject() function
private readonly userService = inject(UserService);
readonly authStore = inject(AuthStore);
```

**DON'T:**

```typescript
// ❌ No constructor injection
constructor(private userService: UserService) {}
```

### 4. Comments & Documentation

**DO:**

```typescript
/**
 * PlayerStore - Playback state management
 *
 * Manages playback status, progress, volume and repeat mode.
 */
```

**DON'T:**

````typescript
// ❌ No French comments
// Gère l'état de lecture

// ❌ No verbose JSDoc with @example, @signals, etc.
/**
 * @description ...
 * @example
 * ```typescript
 * ...
 * ```
 * @signals
 * - `status` - ...
 */
````

---

## Architecture

### Folder Structure

```
src/app/
├── store/                    # Signal Stores (centralized state)
│   ├── index.ts             # Public exports
│   ├── features/            # Reusable store features
│   │   ├── with-ssr-safety.ts
│   │   └── with-local-storage.ts
│   ├── auth/
│   │   ├── auth.store.ts
│   │   ├── auth.models.ts
│   │   └── auth.store.spec.ts
│   ├── player/
│   ├── queue/
│   ├── user-data/
│   └── ui/
├── utils/                    # Shared utility functions
│   ├── index.ts             # Barrel export
│   └── format-time.ts       # Time formatting (seconds → "m:ss")
├── services/                 # Business logic & HTTP
├── models/                   # TypeScript interfaces
├── components/               # Shared components
├── directives/
├── pipes/
└── [feature]/               # Feature modules (lazy-loaded)
```

### Utils - Shared Utilities

Before creating helper functions, check `src/app/utils/`:

| Function     | Purpose                   | Use in               |
| ------------ | ------------------------- | -------------------- |
| `formatTime` | Duration seconds → "m:ss" | TypeScript code only |

**For templates:**

- Duration display → `toMMSS` pipe: `{{ video.duree | toMMSS }}`
- Date/time display → Angular `date` pipe: `{{ date | date:'short' }}`

```typescript
// In TypeScript (computed signals, etc.)
import { formatTime } from '../utils';
const display = formatTime(125); // "2:05"
```

### Store vs Service Responsibilities

| Concern         | Store | Service |
| --------------- | ----- | ------- |
| State holding   | ✅    | ❌      |
| State mutations | ✅    | ❌      |
| HTTP calls      | ❌    | ✅      |
| Business logic  | ❌    | ✅      |
| Side effects    | ❌    | ✅      |

### API Data Mapping

```typescript
// API response (snake_case from PHP backend)
interface PingResponse {
  est_connecte: boolean;
  dark_mode_enabled: boolean;
  id_perso: string;
}

// Frontend models (camelCase)
interface UserInfo {
  isAuthenticated: boolean;
  darkModeEnabled: boolean;
  idPerso: string;
}
```

---

## SSR Compatibility

### Platform Checks

```typescript
// Use withSsrSafety() feature in stores
export const PlayerStore = signalStore(
  { providedIn: 'root' },
  withSsrSafety(),
  // ...
);

// In store methods:
if (this.isBrowser()) {
  localStorage.setItem(...);
}
```

### Browser-Only Code

```typescript
// ❌ Don't access directly
window.localStorage.getItem(...);
document.getElementById(...);

// ✅ Use platform checks
if (isPlatformBrowser(this.platformId)) {
  // Browser-only code
}
```

### TransferState

```typescript
// For SSR data hydration
const DATA_KEY = makeStateKey<DataType>('dataKey');

// Server: set data
if (isPlatformServer(this.platformId)) {
  this.transferState.set(DATA_KEY, data);
}

// Browser: get and remove
if (isPlatformBrowser(this.platformId)) {
  const stored = this.transferState.get(DATA_KEY, null);
  if (stored) {
    this.transferState.remove(DATA_KEY);
    return stored;
  }
}
```

---

## SEO Requirements

### Every Routed Component Must Have

```typescript
ngOnInit() {
  // 1. Page title
  this.titleService.setTitle(this.translocoService.translate('title_key'));

  // 2. Meta description
  this.metaService.updateTag({
    name: 'description',
    content: this.translocoService.translate('meta_description_key'),
  });

  // 3. Canonical URL
  this.seoService.updateCanonicalUrl(`${environment.URL_BASE}${path}`);
}
```

---

## Testing

### Requirements

- **Minimum coverage**: 80%
- **Framework**: Vitest
- **Run tests**: `npm test` or `npx vitest run`

### Test Structure

```typescript
describe('ComponentName', () => {
  let component: ComponentName;
  let fixture: ComponentFixture<ComponentName>;

  // Use typed mocks
  let serviceMock: MockedObject<ServiceName>;

  beforeEach(async () => {
    serviceMock = {
      method: vi.fn(),
    } as MockedObject<ServiceName>;

    await TestBed.configureTestingModule({
      imports: [ComponentName],
      providers: [{ provide: ServiceName, useValue: serviceMock }],
    }).compileComponents();
  });

  it('should...', () => {
    // Arrange
    serviceMock.method.mockReturnValue(of(response));

    // Act
    component.doSomething();

    // Assert - use signal() call syntax
    expect(component.isLoading()).toBe(false);
  });
});
```

### Typed Mocks

Use interfaces from `src/app/models/test-mocks.model.ts`:

```typescript
import type { MockPlayerService, MockInitService } from '../models/test-mocks.model';
```

---

## Code Quality Checklist

### Before Submitting

- [ ] **No dead code**: Remove unused imports, variables, methods
- [ ] **No code duplication**: Extract shared logic to services/utils
- [ ] **Low complexity**: Split large methods (max ~30 lines)
- [ ] **No `any` types**: Use proper typing (exceptions: test mocks with eslint-disable)
- [ ] **No French comments**: English only
- [ ] **Signals for local state**: No `markForCheck()` calls
- [ ] **Store for shared state**: No `BehaviorSubject` for app state
- [ ] **SSR compatible**: Platform checks for browser APIs
- [ ] **SEO complete**: Title, meta, canonical on routed components
- [ ] **Tests pass**: `npx vitest run` - all green
- [ ] **Coverage ≥ 80%**: `npx vitest run --coverage`

### Complexity Guidelines

| Metric                | Target     |
| --------------------- | ---------- |
| Method length         | ≤ 30 lines |
| Cyclomatic complexity | ≤ 10       |
| Parameters per method | ≤ 4        |
| Nested callbacks      | ≤ 2 levels |

### Common Anti-Patterns to Avoid

```typescript
// ❌ Nested subscriptions
this.service.getData().subscribe(data => {
  this.otherService.process(data).subscribe(result => { ... });
});

// ✅ Use RxJS operators
this.service.getData().pipe(
  switchMap(data => this.otherService.process(data))
).subscribe(result => { ... });

// ❌ Logic in templates
<div *ngIf="items.length > 0 && isAuthenticated && !isLoading">

// ✅ Use computed signals
readonly showItems = computed(() =>
  this.items().length > 0 && this.isAuthenticated() && !this.isLoading()
);
```

---

## Git Conventions

### Commit Messages

```
feat: add playlist sharing feature
fix: resolve SSR hydration mismatch
refactor: migrate SettingsComponent to signals
test: add coverage for AuthStore
docs: update AI agent guidelines
```

### PR Checklist

- [ ] All tests pass
- [ ] No lint errors (`npm run lint`)
- [ ] Coverage ≥ 80%
- [ ] No console.log statements
- [ ] SSR works (`npm run serve:ssr`)
- [ ] Responsive design checked

---

## Quick Reference

### Stores Available

| Store           | Purpose                                   |
| --------------- | ----------------------------------------- |
| `AuthStore`     | Authentication, user preferences          |
| `PlayerStore`   | Playback state (status, progress, volume) |
| `QueueStore`    | Playlist queue, current track             |
| `UserDataStore` | User playlists, follows, likes            |
| `UiStore`       | UI state (modals, notifications, mobile)  |

### Key Services

| Service                | Purpose                           |
| ---------------------- | --------------------------------- |
| `InitService`          | App bootstrap, session management |
| `PlayerService`        | Playback orchestration            |
| `YoutubePlayerService` | YouTube IFrame API wrapper        |
| `UserService`          | User HTTP operations              |
| `SeoService`           | Canonical URL management          |

### Commands

```bash
# Development
npm start                    # Dev server
npm run serve:ssr           # SSR dev server

# Testing
npm test                    # Watch mode
npx vitest run              # Single run
npx vitest run --coverage   # With coverage

# Linting
npm run lint                # ESLint check
npm run lint -- --fix       # Auto-fix

# Build
npm run build               # Production build
npm run build:ssr           # SSR production build
```
