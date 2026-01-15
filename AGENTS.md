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

## Critical Rules

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
```

### 2. Change Detection

**DO:**

```typescript
readonly isLoading = signal(false);
this.isLoading.set(true);
// Automatic change detection - no markForCheck needed
```

**DON'T:**

```typescript
// ❌ No ChangeDetectorRef with signals
this.cdr.markForCheck();
```

### 3. Dependency Injection

**DO:**

```typescript
private readonly userService = inject(UserService);
readonly authStore = inject(AuthStore);
```

**DON'T:**

```typescript
// ❌ No constructor injection
constructor(private userService: UserService) {}
```

### 4. Transloco + Signal Forms

**DO:**

```typescript
// Arrow functions for validation messages (lazy evaluation)
minLength(schemaPath.password, 4, {
  message: () => this.translocoService.translate('validation_minlength', { min: 4 }),
});
```

### 5. Comments

- Write all comments in English (no French)
- Keep JSDoc concise

## Architecture

### Store vs Service Responsibilities

| Concern         | Store | Service |
| --------------- | ----- | ------- |
| State holding   | ✅    | ❌      |
| State mutations | ✅    | ❌      |
| HTTP calls      | ❌    | ✅      |
| Business logic  | ❌    | ✅      |

### Available Stores

- `AuthStore` - Authentication, user preferences
- `PlayerStore` - Playback state (status, progress, volume)
- `QueueStore` - Playlist queue, current track
- `UserDataStore` - User playlists, follows, likes
- `UiStore` - UI state (modals, notifications)

## SSR Compatibility

- Use `withSsrSafety()` feature in stores
- Always check platform before accessing browser APIs
- Never access `window`, `document`, `localStorage` directly

## Testing

- Framework: Vitest
- Minimum coverage: 80%
- Use typed mocks from `src/app/models/test-mocks.model.ts`
- Test signal values: `expect(component.isLoading()).toBe(false)`

## Code Quality Checklist

- [ ] No dead code
- [ ] No code duplication
- [ ] Method length ≤ 30 lines
- [ ] Cyclomatic complexity ≤ 10
- [ ] No `any` types
- [ ] No French comments
- [ ] Signals for local state
- [ ] Store for shared state
- [ ] SSR compatible
- [ ] Tests pass with ≥ 80% coverage

## Commands

```bash
npm start                    # Dev server
npm run serve:ssr           # SSR dev server
npm test                    # Watch mode
npx vitest run              # Single run
npx vitest run --coverage   # With coverage
npm run lint                # ESLint check
```
