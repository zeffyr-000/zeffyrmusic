/**
 * Admin Artist Merge — API contract models
 *
 * POST /api/admin/merge-artists
 */

export interface MergeArtistsPayload {
  keep_artist_id: string;
  delete_artist_id: string;
  nom_from: string;
  id_artiste_deezer_from: string;
}

export interface MergeArtistsResponse {
  success: boolean;
  error?: string;
}
