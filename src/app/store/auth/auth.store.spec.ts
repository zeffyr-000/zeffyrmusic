/**
 * AuthStore Tests
 */

import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { AuthStore } from './auth.store';
import { UserInfo, UserPreferences } from './auth.models';

describe('AuthStore', () => {
  let store: InstanceType<typeof AuthStore>;
  let translocoServiceMock: { setActiveLang: ReturnType<typeof vi.fn> };

  const mockUser: UserInfo = {
    pseudo: 'testuser',
    idPerso: '123',
    mail: 'test@example.com',
  };

  const mockPreferences: UserPreferences = {
    darkModeEnabled: true,
    language: 'en',
  };

  beforeEach(() => {
    translocoServiceMock = {
      setActiveLang: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: TranslocoService, useValue: translocoServiceMock },
      ],
    });

    store = TestBed.inject(AuthStore);
  });

  describe('initial state', () => {
    it('should have initial state', () => {
      expect(store.isAuthenticated()).toBe(false);
      expect(store.user()).toBeNull();
      expect(store.initialized()).toBe(false);
      expect(store.preferences().darkModeEnabled).toBe(false);
      expect(store.preferences().language).toBe('fr');
    });
  });

  describe('computed properties', () => {
    it('should return empty string for pseudo when not authenticated', () => {
      expect(store.pseudo()).toBe('');
    });

    it('should return empty string for mail when not authenticated', () => {
      expect(store.mail()).toBe('');
    });

    it('should return empty string for idPerso when not authenticated', () => {
      expect(store.idPerso()).toBe('');
    });

    it('should return false for isDarkMode initially', () => {
      expect(store.isDarkMode()).toBe(false);
    });

    it('should return fr for language initially', () => {
      expect(store.language()).toBe('fr');
    });
  });

  describe('login', () => {
    it('should update state on login', () => {
      store.login(mockUser, mockPreferences);

      expect(store.isAuthenticated()).toBe(true);
      expect(store.user()).toEqual(mockUser);
      expect(store.preferences()).toEqual(mockPreferences);
      expect(store.initialized()).toBe(true);
    });

    it('should update computed properties on login', () => {
      store.login(mockUser, mockPreferences);

      expect(store.pseudo()).toBe('testuser');
      expect(store.mail()).toBe('test@example.com');
      expect(store.idPerso()).toBe('123');
      expect(store.isDarkMode()).toBe(true);
      expect(store.language()).toBe('en');
    });

    it('should apply language via transloco', () => {
      store.login(mockUser, mockPreferences);

      expect(translocoServiceMock.setActiveLang).toHaveBeenCalledWith('en');
    });
  });

  describe('logout', () => {
    it('should reset state on logout', () => {
      // First login
      store.login(mockUser, mockPreferences);
      expect(store.isAuthenticated()).toBe(true);

      // Then logout
      store.logout();

      expect(store.isAuthenticated()).toBe(false);
      expect(store.user()).toBeNull();
      expect(store.preferences().darkModeEnabled).toBe(false);
      expect(store.preferences().language).toBe('fr');
    });

    it('should reset computed properties on logout', () => {
      store.login(mockUser, mockPreferences);
      store.logout();

      expect(store.pseudo()).toBe('');
      expect(store.mail()).toBe('');
      expect(store.idPerso()).toBe('');
    });

    it('should apply default language via transloco', () => {
      store.login(mockUser, mockPreferences);
      store.logout();

      expect(translocoServiceMock.setActiveLang).toHaveBeenLastCalledWith('fr');
    });
  });

  describe('initializeAnonymous', () => {
    it('should mark as initialized without user', () => {
      store.initializeAnonymous();

      expect(store.isAuthenticated()).toBe(false);
      expect(store.user()).toBeNull();
      expect(store.initialized()).toBe(true);
    });
  });

  describe('setDarkMode', () => {
    it('should update dark mode preference', () => {
      store.setDarkMode(true);

      expect(store.preferences().darkModeEnabled).toBe(true);
      expect(store.isDarkMode()).toBe(true);
    });

    it('should disable dark mode', () => {
      store.setDarkMode(true);
      store.setDarkMode(false);

      expect(store.isDarkMode()).toBe(false);
    });
  });

  describe('toggleDarkMode', () => {
    it('should toggle dark mode from false to true', () => {
      expect(store.isDarkMode()).toBe(false);

      store.toggleDarkMode();

      expect(store.isDarkMode()).toBe(true);
    });

    it('should toggle dark mode from true to false', () => {
      store.setDarkMode(true);

      store.toggleDarkMode();

      expect(store.isDarkMode()).toBe(false);
    });
  });

  describe('setLanguage', () => {
    it('should update language preference', () => {
      store.setLanguage('fr');

      expect(store.preferences().language).toBe('fr');
      expect(store.language()).toBe('fr');
    });

    it('should apply language via transloco', () => {
      store.setLanguage('en');

      expect(translocoServiceMock.setActiveLang).toHaveBeenCalledWith('en');
    });

    it('should update HTML lang attribute', () => {
      store.setLanguage('en');

      expect(document.documentElement.lang).toBe('en');
    });

    it('should not throw error on SSR when updating HTML lang attribute', () => {
      // Reconfigure with server platform
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthStore,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: TranslocoService, useValue: translocoServiceMock },
        ],
      });
      const serverStore = TestBed.inject(AuthStore);

      // Should not throw error on server
      expect(() => serverStore.setLanguage('en')).not.toThrow();
    });
  });

  describe('updateUser', () => {
    it('should update user properties when authenticated', () => {
      store.login(mockUser, mockPreferences);

      store.updateUser({ pseudo: 'newpseudo' });

      expect(store.user()?.pseudo).toBe('newpseudo');
      expect(store.pseudo()).toBe('newpseudo');
      // Other properties should remain unchanged
      expect(store.user()?.mail).toBe('test@example.com');
    });

    it('should not update when not authenticated', () => {
      store.updateUser({ pseudo: 'newpseudo' });

      expect(store.user()).toBeNull();
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences partially', () => {
      store.updatePreferences({ darkModeEnabled: true });

      expect(store.isDarkMode()).toBe(true);
      expect(store.language()).toBe('fr'); // Should remain unchanged
    });

    it('should apply changes when updating preferences', () => {
      store.updatePreferences({ language: 'en' });

      expect(translocoServiceMock.setActiveLang).toHaveBeenCalledWith('en');
    });
  });

  describe('setInitialized', () => {
    it('should mark store as initialized', () => {
      expect(store.initialized()).toBe(false);

      store.setInitialized();

      expect(store.initialized()).toBe(true);
    });
  });

  describe('SSR safety', () => {
    it('should have isBrowser method', () => {
      expect(store.isBrowser()).toBe(true);
    });

    it('should have runInBrowser method', () => {
      const result = store.runInBrowser(() => 'browser-value', 'fallback');
      expect(result).toBe('browser-value');
    });
  });
});
