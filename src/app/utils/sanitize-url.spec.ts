import { describe, it, expect, vi } from 'vitest';

import { sanitizeUrl } from './sanitize-url';

// A regular function (not an arrow) so Vitest can treat it as a constructor —
// sanitizeUrl calls `new URL(...)`, and arrow functions are not constructible.
function throwingUrl(): never {
  throw new Error('Invalid URL');
}

function mockUrlConstructorThrow(): void {
  vi.spyOn(globalThis, 'URL').mockImplementation(throwingUrl as unknown as typeof URL);
}

describe('sanitizeUrl', () => {
  it('should strip query string from absolute URL', () => {
    expect(sanitizeUrl('https://example.com/api/test?token=secret&id=1')).toBe('/api/test');
  });

  it('should strip fragment from absolute URL', () => {
    expect(sanitizeUrl('https://example.com/page#section')).toBe('/page');
  });

  it('should strip both query string and fragment', () => {
    expect(sanitizeUrl('https://example.com/path?q=1#frag')).toBe('/path');
  });

  it('should return pathname for URL without query or fragment', () => {
    expect(sanitizeUrl('https://example.com/api/data')).toBe('/api/data');
  });

  it('should handle relative path with query string', () => {
    expect(sanitizeUrl('/api/test?token=secret')).toBe('/api/test');
  });

  it('should handle relative path without query or fragment', () => {
    expect(sanitizeUrl('/api/test')).toBe('/api/test');
  });

  it('should return root for domain-only URL', () => {
    expect(sanitizeUrl('https://example.com')).toBe('/');
  });

  it('should handle path with encoded characters', () => {
    expect(sanitizeUrl('https://example.com/path%20name?q=1')).toBe('/path%20name');
  });

  it('should handle empty string', () => {
    expect(sanitizeUrl('')).toBe('/');
  });

  it.each([
    ['relative path with query string', '/api/data?secret=123', '/api/data'],
    [
      'absolute URL (strips scheme and host)',
      'https://example.com/api/data?token=secret',
      '/api/data',
    ],
    ['domain-only URL', 'https://example.com', '/'],
    ['empty string', '', '/'],
  ])('should use fallback for %s when URL constructor throws', (_desc, input, expected) => {
    mockUrlConstructorThrow();
    expect(sanitizeUrl(input)).toBe(expected);
    vi.restoreAllMocks();
  });
});
