/**
 * Returns a random integer in [0, max].
 * Uses crypto.getRandomValues with rejection sampling when available,
 * falls back to Math.random when crypto is unavailable (SSR).
 */
function getRandomIntInclusive(max: number, buffer: Uint32Array<ArrayBuffer>): number {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const range = max + 1;
    const limit = Math.floor(0x100000000 / range) * range - 1;
    while (true) {
      globalThis.crypto.getRandomValues(buffer);
      if (buffer[0] <= limit) {
        return buffer[0] % range;
      }
    }
  }
  return Math.floor(Math.random() * (max + 1));
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
