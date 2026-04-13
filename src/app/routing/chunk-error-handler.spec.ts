import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearChunkRetryFlag, handleChunkLoadError, navigation } from './chunk-error-handler';

describe('handleChunkLoadError', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    vi.spyOn(navigation, 'reload').mockImplementation(() => {});
  });

  it('should ignore non-chunk errors', () => {
    handleChunkLoadError(new Error('Some random error'));

    expect(navigation.reload).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('chunk-retry')).toBeNull();
  });

  it('should do nothing when sessionStorage is unavailable (SSR)', () => {
    const original = globalThis.sessionStorage;
    Object.defineProperty(globalThis, 'sessionStorage', { value: undefined, configurable: true });

    try {
      handleChunkLoadError(
        new TypeError(
          'Failed to fetch dynamically imported module: https://example.com/chunk-ABC.js'
        )
      );

      expect(navigation.reload).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, 'sessionStorage', { value: original, configurable: true });
    }
  });

  it('should reload on first Chrome chunk error', () => {
    handleChunkLoadError(
      new TypeError('Failed to fetch dynamically imported module: https://example.com/chunk-ABC.js')
    );

    expect(sessionStorage.getItem('chunk-retry')).toBe('1');
    expect(navigation.reload).toHaveBeenCalledOnce();
  });

  it('should reload on first Firefox chunk error', () => {
    handleChunkLoadError(
      new TypeError('error loading dynamically imported module: https://example.com/chunk-ABC.js')
    );

    expect(sessionStorage.getItem('chunk-retry')).toBe('1');
    expect(navigation.reload).toHaveBeenCalledOnce();
  });

  it('should reload on first Safari chunk error', () => {
    handleChunkLoadError(new TypeError('Importing a module script failed.'));

    expect(sessionStorage.getItem('chunk-retry')).toBe('1');
    expect(navigation.reload).toHaveBeenCalledOnce();
  });

  it('should reload on first webpack chunk error', () => {
    handleChunkLoadError(new Error('Loading chunk 123 failed'));

    expect(sessionStorage.getItem('chunk-retry')).toBe('1');
    expect(navigation.reload).toHaveBeenCalledOnce();
  });

  it('should not reload on second failure and clear flag', () => {
    sessionStorage.setItem('chunk-retry', '1');

    handleChunkLoadError(
      new TypeError('Failed to fetch dynamically imported module: https://example.com/chunk-XYZ.js')
    );

    expect(sessionStorage.getItem('chunk-retry')).toBeNull();
    expect(navigation.reload).not.toHaveBeenCalled();
  });

  it('should handle non-Error values gracefully', () => {
    handleChunkLoadError('dynamically imported module');

    expect(sessionStorage.getItem('chunk-retry')).toBe('1');
    expect(navigation.reload).toHaveBeenCalledOnce();
  });
});

describe('clearChunkRetryFlag', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should remove the chunk-retry flag', () => {
    sessionStorage.setItem('chunk-retry', '1');

    clearChunkRetryFlag();

    expect(sessionStorage.getItem('chunk-retry')).toBeNull();
  });

  it('should do nothing if no flag is set', () => {
    clearChunkRetryFlag();

    expect(sessionStorage.getItem('chunk-retry')).toBeNull();
  });
});
