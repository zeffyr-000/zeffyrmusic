/**
 * withSsrSafety - SSR compatibility feature
 *
 * Provides utility methods for browser-only code execution.
 */

import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, DOCUMENT } from '@angular/core';
import { signalStoreFeature, withMethods } from '@ngrx/signals';

export function withSsrSafety() {
  return signalStoreFeature(
    withMethods(() => {
      const platformId = inject(PLATFORM_ID);
      const document = inject(DOCUMENT);

      return {
        isBrowser(): boolean {
          return isPlatformBrowser(platformId);
        },

        runInBrowser<T>(fn: () => T, fallback?: T): T | undefined {
          return isPlatformBrowser(platformId) ? fn() : fallback;
        },

        getLocalStorage<T>(key: string, defaultValue: T): T {
          if (!isPlatformBrowser(platformId)) {
            return defaultValue;
          }
          try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
          } catch {
            return defaultValue;
          }
        },

        setLocalStorage<T>(key: string, value: T): void {
          if (isPlatformBrowser(platformId)) {
            try {
              localStorage.setItem(key, JSON.stringify(value));
            } catch {
              // Ignore storage errors
            }
          }
        },

        removeLocalStorage(key: string): void {
          if (isPlatformBrowser(platformId)) {
            localStorage.removeItem(key);
          }
        },

        getDocument(): Document | null {
          return isPlatformBrowser(platformId) ? document : null;
        },

        setBodyAttribute(name: string, value: string): void {
          if (isPlatformBrowser(platformId) && document.body) {
            document.body.setAttribute(name, value);
          }
        },

        removeBodyAttribute(name: string): void {
          if (isPlatformBrowser(platformId) && document.body) {
            document.body.removeAttribute(name);
          }
        },

        checkIsMobile(): boolean {
          if (!isPlatformBrowser(platformId)) {
            return false;
          }
          return window.matchMedia('(max-width: 768px)').matches;
        },
      };
    })
  );
}
