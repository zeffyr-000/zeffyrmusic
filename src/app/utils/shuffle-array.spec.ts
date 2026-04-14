import { afterEach, describe, it, expect, vi } from 'vitest';

import { shuffleArray } from './shuffle-array';

describe('shuffleArray', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('should return a new array (not mutate the original)', () => {
    const original = [1, 2, 3, 4, 5];
    const result = shuffleArray(original);

    expect(result).not.toBe(original);
    expect(original).toEqual([1, 2, 3, 4, 5]);
  });

  it('should return an array with the same elements', () => {
    const original = [10, 20, 30, 40, 50];
    const result = shuffleArray(original);

    expect(result).toHaveLength(original.length);
    expect(result.sort((a, b) => a - b)).toEqual(original.sort((a, b) => a - b));
  });

  it('should handle an empty array', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it('should handle a single-element array', () => {
    expect(shuffleArray([42])).toEqual([42]);
  });

  it('should handle a two-element array', () => {
    const result = shuffleArray([1, 2]);

    expect(result).toHaveLength(2);
    expect(result).toContain(1);
    expect(result).toContain(2);
  });

  it('should produce a deterministic shuffle with mocked crypto', () => {
    let callIndex = 0;
    const values = [2, 0, 1, 0];
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((<T extends ArrayBufferView>(
      buffer: T
    ): T => {
      if (buffer instanceof Uint32Array) {
        buffer[0] = values[callIndex++ % values.length];
      }
      return buffer;
    }) as typeof globalThis.crypto.getRandomValues);

    const result = shuffleArray([10, 20, 30, 40, 50]);

    expect(result).toEqual([50, 40, 20, 10, 30]);
  });

  it('should work with non-numeric types', () => {
    const original = ['a', 'b', 'c', 'd'];
    const result = shuffleArray(original);

    expect(result).toHaveLength(4);
    expect(result.sort()).toEqual(['a', 'b', 'c', 'd']);
  });
});
