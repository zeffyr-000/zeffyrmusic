/**
 * withLocalStorage - Automatic localStorage persistence feature
 *
 * Persists and restores store properties to/from localStorage.
 * SSR-compatible (operations are ignored on server).
 */

import { isPlatformBrowser } from '@angular/common';
import { effect, inject, PLATFORM_ID, untracked } from '@angular/core';
import { getState, patchState, signalStoreFeature, withHooks } from '@ngrx/signals';

export interface LocalStorageConfig<T> {
  key: string;
  keys: (keyof T)[];
  debounce?: number;
}

function saveToLocalStorage<T extends object>(key: string, keys: (keyof T)[], state: T): void {
  try {
    const toSave: Partial<T> = {};
    keys.forEach(k => {
      if (state[k] !== undefined) {
        toSave[k] = state[k];
      }
    });
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch {
    // Ignore storage errors
  }
}

function loadFromLocalStorage<T>(key: string): Partial<T> | null {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function withLocalStorage<T extends object>(config: LocalStorageConfig<T>) {
  const { key, keys, debounce = 0 } = config;

  return signalStoreFeature(
    withHooks({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onInit(store: any) {
        const platformId = inject(PLATFORM_ID);

        if (!isPlatformBrowser(platformId)) {
          return;
        }

        const saved = loadFromLocalStorage<T>(key);
        if (saved) {
          const updates: Partial<T> = {};
          keys.forEach(k => {
            if (saved[k] !== undefined) {
              updates[k] = saved[k];
            }
          });
          if (Object.keys(updates).length > 0) {
            patchState(store, updates as object);
          }
        }

        let saveTimeout: ReturnType<typeof setTimeout> | null = null;

        effect(() => {
          const state = getState(store) as T;

          const toSave: Partial<T> = {};
          keys.forEach(k => {
            toSave[k] = state[k];
          });

          untracked(() => {
            if (saveTimeout) {
              clearTimeout(saveTimeout);
            }

            if (debounce > 0) {
              saveTimeout = setTimeout(() => {
                saveToLocalStorage(key, keys, state);
              }, debounce);
            } else {
              saveToLocalStorage(key, keys, state);
            }
          });
        });
      },
    })
  );
}
