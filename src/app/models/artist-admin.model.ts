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

/**
 * Admin Duplicate Artists — API contract models
 *
 * GET /api/admin/duplicate-artists
 */

export interface DuplicateArtistItem {
  id: string; // ← id_artist
  name: string; // ← nom
  albumCount: number; // ← nb_albums
  deezerId: string; // ← id_artiste_deezer
}

export interface DuplicateArtistGroup {
  key: string; // ← key (normalized name used to group)
  artists: DuplicateArtistItem[];
}

/** Raw snake_case response from the PHP backend */
export interface DuplicateArtistGroupApi {
  key: string;
  artists: {
    id_artist: string;
    nom: string;
    nb_albums: number;
    id_artiste_deezer: string;
  }[];
}
