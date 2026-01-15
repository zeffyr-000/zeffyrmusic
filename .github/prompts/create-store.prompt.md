# Create Signal Store

Create a new NgRx Signal Store following project conventions.

## Requirements

- Use `@ngrx/signals` APIs
- Include `withSsrSafety()` for browser API access
- Define typed initial state
- Use `patchState()` for immutable updates
- Create computed signals for derived state

## Template

```typescript
import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { withSsrSafety } from './features/with-ssr-safety';

// State interface
interface MyStoreState {
  items: Item[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: MyStoreState = {
  items: [],
  selectedId: null,
  loading: false,
  error: null,
};

export const MyStore = signalStore(
  { providedIn: 'root' },
  withSsrSafety(),
  withState(initialState),
  withComputed(store => ({
    // Computed signals
    itemCount: computed(() => store.items().length),
    hasItems: computed(() => store.items().length > 0),
    selectedItem: computed(() => store.items().find(item => item.id === store.selectedId())),
  })),
  withMethods(store => ({
    // Actions
    setItems(items: Item[]): void {
      patchState(store, { items, loading: false, error: null });
    },

    addItem(item: Item): void {
      patchState(store, { items: [...store.items(), item] });
    },

    removeItem(id: string): void {
      patchState(store, {
        items: store.items().filter(item => item.id !== id),
      });
    },

    selectItem(id: string | null): void {
      patchState(store, { selectedId: id });
    },

    setLoading(loading: boolean): void {
      patchState(store, { loading });
    },

    setError(error: string | null): void {
      patchState(store, { error, loading: false });
    },

    reset(): void {
      patchState(store, initialState);
    },
  }))
);
```

## Available Store Features

| Feature           | Import from                  | Purpose                 |
| ----------------- | ---------------------------- | ----------------------- |
| `withSsrSafety()` | `./features/with-ssr-safety` | Platform checks for SSR |
