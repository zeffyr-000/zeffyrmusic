/**
 * Returns an unbiased random integer in [0, max] using rejection sampling
 * to eliminate modulo bias when (max + 1) doesn't evenly divide 2^32.
 * Reuses a single buffer to avoid repeated allocations.
 * Relies on globalThis.crypto, available in Node 20+ and all modern browsers.
 */
function getRandomIntInclusive(max: number, buffer: Uint32Array<ArrayBuffer>): number {
  const range = max + 1;
  // Largest multiple of range that fits in a uint32, minus 1.
  const limit = Math.floor(0x100000000 / range) * range - 1;
  while (true) {
    globalThis.crypto.getRandomValues(buffer);
    if (buffer[0] <= limit) {
      return buffer[0] % range;
    }
  }
}

/**
 * Returns a new shuffled copy of the array using an unbiased Fisher-Yates
 * algorithm with crypto-secure PRNG. Does not mutate the original array.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  const buffer = new Uint32Array(new ArrayBuffer(4));
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getRandomIntInclusive(i, buffer);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
