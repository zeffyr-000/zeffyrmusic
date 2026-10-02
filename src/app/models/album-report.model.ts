/**
 * Admin Album Reports — API contract models
 *
 * GET /api/admin/reports
 *
 * Returns a bare array sorted by date descending (server-side).
 */

import { ReportAlbumReason } from './report-album.model';

/**
 * Processing state of a report. Values are the contract with the backend
 * (returned verbatim) and each one has an `admin_reports_status_<code>`
 * translation key.
 */
export type AlbumReportStatus = 'pending' | 'processed';

/**
 * Result codes of the automatic processing that have an
 * `admin_reports_result_<code>` translation key. The API may add new codes,
 * so `AlbumReport.result` stays a plain string and unknown codes are shown raw.
 */
export const ALBUM_REPORT_KNOWN_RESULTS: ReadonlySet<string> = new Set([
  'regenere_a_verifier',
  'playlist_inchangee',
  'reference_douteuse',
  'album_conforme_conteste',
  'trop_essais',
  'album_absent',
  'relance_admin',
  'yt_error',
  'yt_playlist_absente',
  'yt_playlist_vide',
  'yt_sans_resultat',
  'yt_indisponible',
  'reference_absente',
  'album_vide',
  'regenere',
  'titres_reparses',
  'pistes_etrangeres_supprimees',
  'album_conforme',
  'clos_admin',
]);

/** Result codes that wait for an admin decision (highlighted in the list). */
export const ALBUM_REPORT_ADMIN_RESULTS: ReadonlySet<string> = new Set([
  'regenere_a_verifier',
  'playlist_inchangee',
  'reference_douteuse',
  'album_conforme_conteste',
  'trop_essais',
  'album_absent',
]);

export interface AlbumReport {
  id: string; // ← id_report
  /** Unix timestamp in seconds, as stored by the backend. */
  reportedAt: number; // ← date_report
  albumId: string; // ← id_playlist
  albumTitle: string; // ← titre (empty when the album no longer exists)
  albumArtist: string; // ← artiste (empty when the album no longer exists)
  reason: ReportAlbumReason; // ← reason
  userPseudo: string; // ← pseudo (empty when the account was deleted)
  status: AlbumReportStatus; // ← status
  /** Processing result code, empty while the report was never processed. */
  result: string; // ← resultat
}

/** Raw snake_case response from the PHP backend */
export interface AlbumReportApi {
  id_report: string;
  date_report: number;
  id_playlist: string;
  titre: string;
  artiste: string;
  reason: ReportAlbumReason;
  pseudo: string;
  status: AlbumReportStatus;
  resultat: string;
}

/**
 * POST /api/admin/close-report and /api/admin/retry-report
 * Both act on every unprocessed report of the album the given report targets.
 */
export interface AlbumReportActionResponse {
  success: boolean;
  error?: string;
}
