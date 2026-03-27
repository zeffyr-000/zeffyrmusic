/**
 * Admin Album Merge — API contract models
 *
 * POST /api/admin/merge-albums
 */

export interface MergeAlbumsPayload {
  keep_album_id: string;
  delete_album_id: string;
  titre_from: string;
  artiste_from: string;
  img_from: string;
  videos_from: string;
  year_from: string;
}

export interface MergeAlbumsResponse {
  success: boolean;
  error?: string;
}
