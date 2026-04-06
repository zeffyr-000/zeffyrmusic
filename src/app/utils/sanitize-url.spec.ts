import { describe, it, expect, vi } from 'vitest';

import { sanitizeUrl } from './sanitize-url';

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

  it('should use fallback when URL constructor throws', () => {
    vi.spyOn(globalThis, 'URL').mockImplementation(() => {
      throw new Error('Invalid URL');
    });
    expect(sanitizeUrl('/api/data?secret=123')).toBe('/api/data');
    vi.restoreAllMocks();
  });

  it('should strip scheme and host in fallback for absolute URL', () => {
    vi.spyOn(globalThis, 'URL').mockImplementation(() => {
      throw new Error('Invalid URL');
    });
    expect(sanitizeUrl('https://example.com/api/data?token=secret')).toBe('/api/data');
    vi.restoreAllMocks();
  });

  it('should return root in fallback for domain-only URL', () => {
    vi.spyOn(globalThis, 'URL').mockImplementation(() => {
      throw new Error('Invalid URL');
    });
    expect(sanitizeUrl('https://example.com')).toBe('/');
    vi.restoreAllMocks();
  });

  it('should return root in fallback for empty string', () => {
    vi.spyOn(globalThis, 'URL').mockImplementation(() => {
      throw new Error('Invalid URL');
    });
    expect(sanitizeUrl('')).toBe('/');
    vi.restoreAllMocks();
  });
});
