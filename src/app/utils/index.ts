/**
 * Utility Functions
 *
 * Shared helper functions used across the application.
 * Import via: import { functionName } from '../utils';
 *
 * Available utilities:
 * - formatTime: Duration in seconds to "m:ss" (for TS code, use toMMSS pipe in templates)
 * - formatPlaylistAsCsv: Playlist tracks to CSV string (TuneMyMusic/Soundiiz compatible)
 * - formatPlaylistAsText: Playlist tracks to "Artist - Title" text list
 *
 * @ai-hint For duration display in templates, use the `toMMSS` pipe.
 * For date/time display, use Angular's built-in `date` pipe.
 * Use formatTime only in TypeScript code (computed signals, etc.).
 */
export { formatTime } from './format-time';
export { formatPlaylistAsCsv, formatPlaylistAsText } from './export-playlist';
export { isOnProtectedRoute } from './is-on-protected-route';
export { sanitizeUrl } from './sanitize-url';
export { shuffleArray } from './shuffle-array';
