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
}
