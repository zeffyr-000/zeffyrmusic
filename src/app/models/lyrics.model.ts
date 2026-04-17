/**
 * Lyrics models
 * Karaoke-style synchronized lyrics from LRCLIB via backend.
 */

/** Single synchronized lyrics line (pre-parsed by backend). */
export interface LyricsLine {
  /** Timestamp in seconds (e.g. 12.50) */
  time: number;
  /** Lyrics text for this line */
  text: string;
}

/** Successful lyrics response with data */
export interface LyricsSuccessResponse {
  success: true;
  /** Whether synchronized (timed) lyrics are available */
  synced: boolean;
  /** Pre-parsed synced lines. `null` when `synced` is `false` */
  lines: LyricsLine[] | null;
  /** Plain text lyrics fallback (no timestamps) */
  plainLyrics: string | null;
  /** Track name according to LRCLIB */
  trackName: string | null;
  /** Artist name according to LRCLIB */
  artistName: string | null;
}

/** HTTP 200 response indicating lyrics are not available */
export interface LyricsNotAvailableResponse {
  success: false;
  error: 'no_metadata' | 'lyrics_not_found';
}

/** API response from GET /api/lyrics/:id_video */
export type LyricsResponse = LyricsSuccessResponse | LyricsNotAvailableResponse;
