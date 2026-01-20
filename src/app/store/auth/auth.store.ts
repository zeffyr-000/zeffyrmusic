import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { TranslocoService } from '@jsverse/transloco';
import { Language, UserInfo, UserPreferences, initialAuthState } from './auth.models';
import { withSsrSafety } from '../features/with-ssr-safety';

/**
 * AuthStore - Authentication and user preferences
 *
 * Manages login state, user profile, dark mode and language settings.
 */
export const AuthStore = signalStore(
  { providedIn: 'root' },

  withState(initialAuthState),

  withSsrSafety(),

  withComputed(state => ({
    pseudo: computed(() => state.user()?.pseudo ?? ''),
    mail: computed(() => state.user()?.mail ?? ''),
    idPerso: computed(() => state.user()?.idPerso ?? ''),
    isDarkMode: computed(() => state.preferences().darkModeEnabled),
    language: computed(() => state.preferences().language),
  })),

  withMethods(store => {
    const transloco = inject(TranslocoService);

    return {
      login(user: UserInfo, preferences: UserPreferences): void {
        patchState(store, {
          isAuthenticated: true,
          user,
          preferences,
          initialized: true,
        });
        this._applyDarkMode(preferences.darkModeEnabled);
        this._applyLanguage(preferences.language);
      },

      logout(): void {
        patchState(store, {
          isAuthenticated: false,
          user: null,
          preferences: {
            darkModeEnabled: false,
            language: 'fr',
          },
        });
        store.runInBrowser(() => {
          document.cookie = 'login= ; expires=Sun, 01 Jan 2000 00:00:00 UTC; path=/';
        });
        this._applyDarkMode(false);
        this._applyLanguage('fr');
      },

      initializeAnonymous(): void {
        patchState(store, {
          isAuthenticated: false,
          user: null,
          initialized: true,
        });
      },

      setDarkMode(enabled: boolean): void {
        patchState(store, {
          preferences: {
            ...store.preferences(),
            darkModeEnabled: enabled,
          },
        });
        this._applyDarkMode(enabled);
      },

      toggleDarkMode(): void {
        this.setDarkMode(!store.preferences().darkModeEnabled);
      },

      setLanguage(lang: Language): void {
        patchState(store, {
          preferences: {
            ...store.preferences(),
            language: lang,
          },
        });
        this._applyLanguage(lang);
      },

      updateUser(updates: Partial<UserInfo>): void {
        const currentUser = store.user();
        if (currentUser) {
          patchState(store, {
            user: { ...currentUser, ...updates },
          });
        }
      },

      updatePreferences(updates: Partial<UserPreferences>): void {
        const current = store.preferences();
        patchState(store, { preferences: { ...current, ...updates } });

        if (updates.darkModeEnabled !== undefined) {
          this._applyDarkMode(updates.darkModeEnabled);
        }
        if (updates.language !== undefined) {
          this._applyLanguage(updates.language);
        }
      },

      setInitialized(): void {
        patchState(store, { initialized: true });
      },

      _applyDarkMode(enabled: boolean): void {
        if (enabled) {
          store.setBodyAttribute('data-bs-theme', 'dark');
        } else {
          store.removeBodyAttribute('data-bs-theme');
        }
      },

      _applyLanguage(lang: Language): void {
        transloco.setActiveLang(lang);
        // Update HTML lang attribute for accessibility and SEO
        store.runInBrowser(() => {
          if (document?.documentElement) {
            document.documentElement.lang = lang;
          }
        });
      },
    };
  })
);

export type AuthStoreType = InstanceType<typeof AuthStore>;
