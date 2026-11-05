/**
 * Admin catalogue upgrade — API contract models
 *
 * GET /api/admin/catalogue
 *
 * TEMPORARY jour4: delete with the catalogue tab (API docs/mise-a-niveau-catalogue.md, section 8)
 */

/** Album states measured against the Deezer reference, in display order. */
export const CATALOGUE_STATES = [
  'conforme',
  'incomplet',
  'non_conforme',
  'douteux',
  'sans_reference',
  'a_supprimer',
  'non_diagnostique',
] as const;

/** Result codes specific to the catalogue, labelled `admin_catalogue_result_<code>`. */
export const CATALOGUE_KNOWN_RESULTS: ReadonlySet<string> = new Set([
  'titres_suspects',
  'cree',
  'cree_a_verifier',
]);

/** Result codes worth a manual check, highlighted in the recent albums panel. */
export const CATALOGUE_REVIEW_RESULTS: ReadonlySet<string> = new Set([
  'regenere_a_verifier',
  'cree_a_verifier',
  'titres_suspects',
  'reference_douteuse',
  'a_supprimer',
]);

/** Statuses of the missing-albums queue, in display order. */
export const CATALOGUE_MISSING_STATUSES = ['a_creer', 'cree', 'introuvable', 'ignore'] as const;

export type CatalogueSegmentKey = 'top' | 'top_artists' | 'long_tail';
export type CatalogueTask = 'mise_a_niveau' | 'completion';

export interface CatalogueAlbums {
  total: number;
  diagnosed: number;
  processed: number;
  units: number;
  linesRemoved: number; // ← lines_removed
  deadTracks: number; // ← dead_tracks
  duplicated: number;
  /** State code → album count. The API may add codes: unknown ones are shown raw. */
  current: Record<string, number>;
  initial: Record<string, number>;
  /** Result code of the last processing → album count. */
  results: Record<string, number>;
}

export interface CatalogueSegment {
  key: CatalogueSegmentKey;
  total: number;
  processed: number;
  compliant: number;
}

export interface CatalogueCompletion {
  artists: number;
  /** Catalogue artists whose Deezer discography was explored. */
  artistsExplored: number; // ← artists_explored
  /** Similar artists waiting to be selected, by Deezer fans. */
  artistsCandidates: number; // ← artists_candidates
  /** Similar artists selected for addition: explored, their albums queued. */
  artistsSelected: number; // ← artists_selected
  /** Selected artists that now have at least one album in the catalogue. */
  artistsAdded: number; // ← artists_added
  units: number;
  /** Queue status → album count. */
  albums: Record<string, number>;
  /** Same, for new artists only: they get 30 % of the creation budget. */
  albumsNewArtists: Record<string, number>; // ← albums_new_artists
}

export interface CatalogueQuota {
  task: CatalogueTask;
  budget: number;
  usedToday: number; // ← used_today
}

export interface CatalogueHistoryPoint {
  date: string; // "2026-10-31", YouTube quota day (Pacific time)
  task: CatalogueTask;
  processed: number;
  diagnosed: number;
  created: number;
  explored: number;
  units: number;
}

/** Client goal: double the starting albums and artists, not beyond. Start = first jour4 run. */
export interface CatalogueTarget {
  albumsStart: number; // ← albums_start
  albumsNow: number; // ← albums_now
  albumsTarget: number; // ← albums_target
  artistsStart: number; // ← artists_start
  artistsNow: number; // ← artists_now
  artistsTarget: number; // ← artists_target
}

/** Album processed by the upgrade task, newest first. */
export interface CatalogueRecentUpgrade {
  albumId: string; // ← id_playlist
  /** Unix timestamp in seconds. */
  date: number;
  title: string;
  artist: string;
  result: string;
  initialState: string; // ← initial_state
  state: string;
  /** Deezer score after processing, 0 to 100. */
  score: number;
  /** YouTube units spent on the album, all runs included. */
  units: number;
}

/** Album created by the completion task, newest first. */
export interface CatalogueRecentCreation {
  albumId: string; // ← id_playlist
  /** Unix timestamp in seconds. */
  date: number;
  title: string;
  artist: string;
  result: string;
  units: number;
  /** Artist added to the catalogue by the completion, not explored from it. */
  newArtist: boolean; // ← new_artist
}

/** The last albums of each task (100 at most), to check them by hand. */
export interface CatalogueRecent {
  upgraded: CatalogueRecentUpgrade[];
  created: CatalogueRecentCreation[];
}

export interface CatalogueResponse {
  target: CatalogueTarget;
  albums: CatalogueAlbums;
  segments: CatalogueSegment[];
  completion: CatalogueCompletion;
  quota: CatalogueQuota[];
  history: CatalogueHistoryPoint[];
  recent: CatalogueRecent;
}

/** Raw snake_case response from the PHP backend */
export interface CatalogueApiResponse {
  target: {
    albums_start: number;
    albums_now: number;
    albums_target: number;
    artists_start: number;
    artists_now: number;
    artists_target: number;
  };
  albums: {
    total: number;
    diagnosed: number;
    processed: number;
    units: number;
    lines_removed: number;
    dead_tracks: number;
    duplicated: number;
    current: Record<string, number>;
    initial: Record<string, number>;
    results: Record<string, number>;
  };
  segments: CatalogueSegment[];
  completion: {
    artists: number;
    artists_explored: number;
    artists_candidates: number;
    artists_selected: number;
    artists_added: number;
    units: number;
    albums: Record<string, number>;
    albums_new_artists: Record<string, number>;
  };
  quota: { task: CatalogueTask; budget: number; used_today: number }[];
  history: CatalogueHistoryPoint[];
  recent: {
    upgraded: {
      id_playlist: string;
      date: number;
      title: string;
      artist: string;
      result: string;
      initial_state: string;
      state: string;
      score: number;
      units: number;
    }[];
    created: {
      id_playlist: string;
      date: number;
      title: string;
      artist: string;
      result: string;
      units: number;
      new_artist: boolean;
    }[];
  };
}
