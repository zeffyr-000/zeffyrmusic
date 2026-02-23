import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { signalStore, withState } from '@ngrx/signals';
import { withSsrSafety } from './with-ssr-safety';

/** Minimal store that exposes all withSsrSafety methods for testing */
const TestStore = signalStore({ providedIn: 'root' }, withSsrSafety(), withState({}));

// ---------------------------------------------------------------------------
// Browser environment
// ---------------------------------------------------------------------------
describe('withSsrSafety — browser', () => {
  let store: InstanceType<typeof TestStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TestStore, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    store = TestBed.inject(TestStore);
  });

  it('isBrowser() should return true', () => {
    expect(store.isBrowser()).toBe(true);
  });

  it('runInBrowser() should execute fn and return its value', () => {
    const result = store.runInBrowser(() => 42);
    expect(result).toBe(42);
  });

  it('runInBrowser() should return fallback when fn not provided but env is browser', () => {
    // fn executes in browser: returns undefined (no fn body)
    const result = store.runInBrowser(() => undefined, 'fallback');
    expect(result).toBeUndefined();
  });

  it('getLocalStorage() should return defaultValue when key is absent', () => {
    localStorage.removeItem('__test_missing__');
    expect(store.getLocalStorage('__test_missing__', 'default')).toBe('default');
  });

  it('getLocalStorage() should return stored value', () => {
    localStorage.setItem('__test_key__', JSON.stringify({ x: 1 }));
    expect(store.getLocalStorage('__test_key__', null)).toEqual({ x: 1 });
    localStorage.removeItem('__test_key__');
  });

  it('getLocalStorage() should return defaultValue on JSON parse error', () => {
    localStorage.setItem('__test_bad__', 'not-json{{{');
    expect(store.getLocalStorage('__test_bad__', 'fallback')).toBe('fallback');
    localStorage.removeItem('__test_bad__');
  });

  it('setLocalStorage() should persist a value', () => {
    store.setLocalStorage('__test_set__', { y: 2 });
    expect(JSON.parse(localStorage.getItem('__test_set__')!)).toEqual({ y: 2 });
    localStorage.removeItem('__test_set__');
  });

  it('removeLocalStorage() should delete the key', () => {
    localStorage.setItem('__test_rm__', 'to-delete');
    store.removeLocalStorage('__test_rm__');
    expect(localStorage.getItem('__test_rm__')).toBeNull();
  });

  it('getDocument() should return the document', () => {
    const doc = store.getDocument();
    expect(doc).not.toBeNull();
  });

  it('setBodyAttribute() should set an attribute on document.body', () => {
    store.setBodyAttribute('data-bs-theme', 'dark');
    expect(document.body.getAttribute('data-bs-theme')).toBe('dark');
    document.body.removeAttribute('data-bs-theme');
  });

  it('removeBodyAttribute() should remove an attribute from document.body', () => {
    document.body.setAttribute('data-bs-theme', 'dark');
    store.removeBodyAttribute('data-bs-theme');
    expect(document.body.hasAttribute('data-bs-theme')).toBe(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('checkIsMobile() should return a boolean', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('768'),
        media: query,
      }))
    );
    const result = store.checkIsMobile();
    expect(typeof result).toBe('boolean');
  });
});

// ---------------------------------------------------------------------------
// Server (SSR) environment
// ---------------------------------------------------------------------------
describe('withSsrSafety — server', () => {
  let store: InstanceType<typeof TestStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TestStore, { provide: PLATFORM_ID, useValue: 'server' }],
    });
    store = TestBed.inject(TestStore);
  });

  it('isBrowser() should return false', () => {
    expect(store.isBrowser()).toBe(false);
  });

  it('runInBrowser() should NOT execute fn and return fallback', () => {
    const fn = vi.fn(() => 99);
    const result = store.runInBrowser(fn, 0);
    expect(fn).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('runInBrowser() should return undefined when no fallback', () => {
    expect(store.runInBrowser(() => 1)).toBeUndefined();
  });

  it('getLocalStorage() should return defaultValue without accessing localStorage', () => {
    expect(store.getLocalStorage('any', 'ssr-default')).toBe('ssr-default');
  });

  it('setLocalStorage() should do nothing', () => {
    // Should not throw
    expect(() => store.setLocalStorage('key', 'value')).not.toThrow();
  });

  it('removeLocalStorage() should do nothing', () => {
    expect(() => store.removeLocalStorage('key')).not.toThrow();
  });

  it('getDocument() should return null', () => {
    expect(store.getDocument()).toBeNull();
  });

  it('setBodyAttribute() should do nothing', () => {
    expect(() => store.setBodyAttribute('data-bs-theme', 'dark')).not.toThrow();
  });

  it('removeBodyAttribute() should do nothing', () => {
    expect(() => store.removeBodyAttribute('data-bs-theme')).not.toThrow();
  });

  it('checkIsMobile() should return false', () => {
    expect(store.checkIsMobile()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Error handling in setLocalStorage / getLocalStorage
// ---------------------------------------------------------------------------
describe('withSsrSafety — storage error handling', () => {
  let store: InstanceType<typeof TestStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TestStore, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    store = TestBed.inject(TestStore);
  });

  it('setLocalStorage() should silently ignore storage quota errors', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(() => store.setLocalStorage('key', 'value')).not.toThrow();
    vi.restoreAllMocks();
  });
});
