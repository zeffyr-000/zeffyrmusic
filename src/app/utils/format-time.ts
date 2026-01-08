/**
 * Formats duration in seconds to "m:ss" display string.
 *
 * Use for duration formatting in TypeScript code (computed signals, etc.).
 * In templates, prefer the `toMMSS` pipe instead.
 *
 * @param seconds - Duration in seconds (can be float)
 * @returns Formatted string like "3:45" or "0:00" if invalid
 *
 * @example
 * formatTime(125)  // "2:05"
 * formatTime(45)   // "0:45"
 * formatTime(3600) // "60:00"
 */
export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
