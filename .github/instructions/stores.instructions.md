---
applyTo: 'src/app/store/**/*.ts'
---

# Signal Store Instructions

## Structure

```typescript
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { withSsrSafety } from './features/with-ssr-safety';

interface MyState {
  items: Item[];
  loading: boolean;
  error: string | null;
}

const initialState: MyState = { items: [], loading: false, error: null };

export const MyStore = signalStore(
  { providedIn: 'root' },
  withSsrSafety(),
  withState(initialState),
  withComputed(store => ({
    itemCount: computed(() => store.items().length),
    hasItems: computed(() => store.items().length > 0),
  })),
  withMethods(store => ({
    setItems(items: Item[]): void {
      patchState(store, { items, loading: false });
    },
    reset(): void {
      patchState(store, initialState);
    },
  }))
);
```

## Critical Rules

- Always use `withSsrSafety()` for browser API access
- Use `patchState()` to update state immutably
- Keep methods focused — one action per method
- Define computed signals for derived state
- Export from `src/app/store/index.ts` barrel

## withSsrSafety() Methods

| Method                 | Purpose                       |
| ---------------------- | ----------------------------- |
| `isBrowser()`          | Returns `true` in browser     |
| `runInBrowser(fn)`     | Execute only in browser       |
| `getLocalStorage(k)`   | Safe localStorage read        |
| `setLocalStorage(k,v)` | Safe localStorage write       |
| `setBodyAttribute()`   | Set attribute on `<body>` tag |
| `checkIsMobile()`      | Check viewport width          |

## Available Stores

| Store           | Key Signals                                                 |
| --------------- | ----------------------------------------------------------- |
| `AuthStore`     | `isAuthenticated()`, `pseudo()`, `isDarkMode()`             |
| `PlayerStore`   | `isPlaying()`, `volume()`, `progress()`                     |
| `QueueStore`    | `currentVideo()`, `items()`, `isShuffled()`                 |
| `UserDataStore` | `playlists()`, `follows()`, `likedVideos()`                 |
| `UiStore`       | `isPlayerExpanded()`, `hasActiveModal()`, `notifications()` |

## Usage in Components

```typescript
readonly authStore = inject(AuthStore);
readonly playerStore = inject(PlayerStore);

// Read signals in template: {{ authStore.pseudo() }}
// Read in code: if (this.authStore.isAuthenticated()) { ... }
```
