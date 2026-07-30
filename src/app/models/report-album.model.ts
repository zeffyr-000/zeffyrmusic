/**
 * Album Report — API contract models
 *
 * POST /api/report-album
 *
 * Error slugs returned in `error`: already_reported | album_not_found | unauthorized
 */

/**
 * Report reasons, in display order. Each value is part of the backend contract
 * (stored verbatim) and has a `report_album_reason_<code>` translation key.
 * The union type is derived from this array so the rendered list and the
 * accepted payload can never drift apart.
 */
export const REPORT_ALBUM_REASONS = ['missing_tracks', 'wrong_titles', 'wrong_album'] as const;

export type ReportAlbumReason = (typeof REPORT_ALBUM_REASONS)[number];

export interface ReportAlbumPayload {
  id_playlist: string;
  reason: ReportAlbumReason;
}

/**
 * Error slugs the backend can return. Narrowing the response field lets
 * TypeScript reject a typo in the `already_reported` comparison and in the
 * ERROR_KEY_MAP keys of the report modal. Unknown slugs are still handled
 * defensively at runtime — the server is not bound by this type.
 */
export type ReportAlbumError = 'already_reported' | 'album_not_found' | 'unauthorized';

export interface ReportAlbumResponse {
  success: boolean;
  error?: ReportAlbumError;
}
