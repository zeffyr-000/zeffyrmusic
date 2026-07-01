---
name: signal-store-patterns
description: 'Create or modify @ngrx/signals Signal Stores. Use when adding store state, computed signals, store methods, store features like withSsrSafety or withLocalStorage, or debugging reactive state issues in Zeffyr Music.'
---

# Signal Store Patterns — Zeffyr Music

## Store Architecture

All shared state lives in 5 `signalStore` instances (never `BehaviorSubject` for app state):

| Store           | File                                         | Key Signals                                                               |
| --------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `AuthStore`     | `src/app/store/auth/auth.store.ts`           | `isAuthenticated()`, `pseudo()`, `isDarkMode()`, `language()`             |
| `PlayerStore`   | `src/app/store/player/player.store.ts`       | `isPlaying()`, `progress()`, `volume()`, `isMuted()`, `hasError()`        |
| `QueueStore`    | `src/app/store/queue/queue.store.ts`         | `currentVideo()`, `currentKey()`, `items()`, `isShuffled()`, `hasNext()`  |
| `UserDataStore` | `src/app/store/user-data/user-data.store.ts` | `playlists()`, `follows()`, `likedVideos()`, `hasPlaylists()`             |
| `UiStore`       | `src/app/store/ui/ui.store.ts`               | `isPlayerExpanded()`, `hasActiveModal()`, `notifications()`, `isMobile()` |

Barrel export: `import { AuthStore, PlayerStore, ... } from './store';` (from `src/app/store/index.ts`)

## Creating a New Store

```typescript
import { computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { withSsrSafety } from '../features/with-ssr-safety';

// 1. Define state interface + initial state
interface MyState {
  items: Item[];
  loading: boolean;
  error: string | null;
}

const initialState: MyState = {
  items: [],
  loading: false,
  error: null,
};

// 2. Create the store
export const MyStore = signalStore(
  { providedIn: 'root' }, // Always root-provided

  withState(initialState),
  withSsrSafety(), // REQUIRED — SSR compatibility

  withComputed(store => ({
    itemCount: computed(() => store.items().length),
    hasItems: computed(() => store.items().length > 0),
  })),

  withMethods(store => ({
    setItems(items: Item[]): void {
      patchState(store, { items, loading: false, error: null });
    },

    setLoading(): void {
      patchState(store, { loading: true });
    },

    reset(): void {
      patchState(store, initialState);
    },
  }))
);
```

## Required Feature: `withSsrSafety()`

**Every store MUST include `withSsrSafety()`** — provides browser-safe utilities:

```typescript
// Available methods from withSsrSafety():
store.isBrowser()                              // boolean
store.runInBrowser(() => { ... }, fallback?)    // Execute browser-only code
store.getLocalStorage('key', defaultValue)      // Safe localStorage read
store.setLocalStorage('key', value)             // Safe localStorage write
store.removeLocalStorage('key')                 // Safe localStorage remove
store.getDocument()                             // Document | null
store.setBodyAttribute('name', 'value')         // Safe body attribute
store.removeBodyAttribute('name')               // Safe body attribute removal
store.checkIsMobile()                           // matchMedia check
```

### Usage in Store Methods

```typescript
withMethods(store => ({
  initFromLocalStorage(): void {
    const saved = store.getLocalStorage<string[]>('savedItems', []);
    patchState(store, { items: saved });
  },

  saveToLocalStorage(): void {
    store.setLocalStorage('savedItems', store.items());
  },

  applyTheme(): void {
    store.setBodyAttribute('data-bs-theme', 'dark');
  },
})),
```

## State Update Patterns

### Simple update

```typescript
patchState(store, { loading: true });
```

### Computed update (reading current state)

```typescript
patchState(store, { items: [...store.items(), newItem] });
```

### Conditional update

```typescript
patchState(store, {
  status: store.status() === 'error' ? 'idle' : store.status(),
});
```

### Partial update with spread

```typescript
patchState(store, {
  preferences: { ...store.preferences(), darkModeEnabled: true },
});
```

## Consuming Stores in Components

```typescript
@Component({
  // OnPush is the Angular 22 zoneless default — no changeDetection needed
  // ...
})
export class MyComponent {
  // Always readonly + inject()
  readonly authStore = inject(AuthStore);
  readonly playerStore = inject(PlayerStore);

  // Derived computed from store signals
  readonly displayName = computed(() => this.authStore.pseudo() || 'Guest');

  // In templates: {{ authStore.isAuthenticated() }}
  // In templates: @if (playerStore.isPlaying()) { ... }
}
```

## Cross-Component Events via UiStore

When one component needs to notify another (without direct coupling):

```typescript
// UiStore — notification signal
withState({
  videoAddedToPlaylistId: null as { id: string; ts: number } | null,
}),

withMethods(store => ({
  notifyVideoAddedToPlaylist(idPlaylist: string): void {
    patchState(store, {
      videoAddedToPlaylistId: { id: idPlaylist, ts: Date.now() },
    });
  },
})),
```

```typescript
// Consumer component — watch with effect()
effect(() => {
  const event = this.uiStore.videoAddedToPlaylistId();
  if (event && event.id === this.playlistId()) {
    untracked(() => this.loadPlaylist());
  }
});
```

> **Pattern:** Use `{ id, ts }` shape — the `ts` field ensures a new object reference on every notification, even for the same playlist ID.

## File Organization

```
src/app/store/
├── index.ts                    # Barrel exports
├── features/
│   └── with-ssr-safety.ts      # SSR feature (required in all stores)
├── auth/
│   ├── auth.store.ts           # AuthStore
│   └── auth.models.ts          # AuthState, UserInfo, UserPreferences
├── player/
│   ├── player.store.ts         # PlayerStore
│   └── player.models.ts        # PlayerState, PlayerStatus
├── queue/
│   ├── queue.store.ts          # QueueStore
│   └── queue.models.ts         # QueueState
├── user-data/
│   ├── user-data.store.ts      # UserDataStore
│   └── user-data.models.ts     # UserDataState
└── ui/
    ├── ui.store.ts             # UiStore
    └── ui.models.ts            # UiState, ModalType, Notification
```

## Checklist for New Store

1. Create `src/app/store/<name>/<name>.models.ts` with state interface + `initialState`
2. Create `src/app/store/<name>/<name>.store.ts` with `signalStore()`
3. Include `withSsrSafety()` feature
4. Add `{ providedIn: 'root' }` configuration
5. Export from `src/app/store/index.ts` barrel
6. Use `readonly` + `inject()` in consuming components
7. Access signals with function call syntax: `store.value()` not `store.value`
8. Test with `expect(store.mySignal()).toBe(expected)` (Vitest)

## Anti-Patterns

```typescript
// ❌ BehaviorSubject for shared state
private isPlaying$ = new BehaviorSubject<boolean>(false);

// ❌ Constructor injection
constructor(private authStore: AuthStore) {}

// ❌ Missing withSsrSafety() — breaks SSR
export const MyStore = signalStore(
  { providedIn: 'root' },
  withState(initialState), // No withSsrSafety()!
);

// ❌ Direct browser API in store methods
localStorage.getItem('key');  // Use store.getLocalStorage() instead

// ❌ ChangeDetectorRef with signals
this.cdr.markForCheck();  // Unnecessary — signals auto-notify OnPush

// ❌ Forgetting function call syntax
this.authStore.isAuthenticated  // Wrong — returns signal function, not value
this.authStore.isAuthenticated() // Correct — calls signal to get value
```
