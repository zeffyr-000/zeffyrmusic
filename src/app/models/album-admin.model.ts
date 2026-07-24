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

/**
 * Admin Duplicate Albums — API contract models
 *
 * GET /api/admin/duplicate-albums
 */

export interface DuplicateAlbumItem {
  id: string; // ← id_playlist
  title: string; // ← titre
  artist: string; // ← artiste
  year: number; // ← year
  image: string; // ← img_big
  videoCount: number; // ← nb_videos
}

export interface DuplicateAlbumGroup {
  key: string; // ← key (normalized title/artist used to group)
  albums: DuplicateAlbumItem[];
}

/** Raw snake_case response from the PHP backend */
export interface DuplicateAlbumGroupApi {
  key: string;
  albums: {
    id_playlist: string;
    titre: string;
    artiste: string;
    year: number;
    img_big: string;
    nb_videos: number;
  }[];
}
