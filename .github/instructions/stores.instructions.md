---
applyTo: 'src/app/store/**/*.ts'
---

# Signal Store Instructions

## Store Structure

```typescript
import { signalStore, withState, withComputed, withMethods } from '@ngrx/signals';
import { withSsrSafety } from './features/with-ssr-safety';

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
    addItem(item: Item): void {
      patchState(store, { items: [...store.items(), item] });
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
- Keep methods focused - one action per method
- Define computed signals for derived state

## Store Features

Available reusable features in `src/app/store/features/`:

| Feature           | Purpose                 |
| ----------------- | ----------------------- |
| `withSsrSafety()` | Platform checks for SSR |

## SSR Safety

```typescript
withMethods((store, ssrSafety = inject(SsrSafetyToken)) => ({
  saveToStorage(): void {
    if (ssrSafety.isBrowser()) {
      localStorage.setItem('key', JSON.stringify(store.data()));
    }
  },
})),
```

## Available Stores

- `AuthStore` - Authentication, user preferences
- `PlayerStore` - Playback state (status, progress, volume)
- `QueueStore` - Playlist queue, current track
- `UserDataStore` - User playlists, follows, likes
- `UiStore` - UI state (modals, notifications)
