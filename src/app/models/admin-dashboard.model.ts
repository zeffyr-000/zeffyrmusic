/**
 * Admin Dashboard — API contract models
 *
 * GET /api/admin/dashboard
 */

export interface DashboardStats {
  // Users
  newUsersLast24h: number; // ← new_users_24h
  totalUsers: number; // ← total_users
  activeUsersLast7d: number; // ← active_users_7d
  activeUsersLast30d: number; // ← active_users_30d

  // Content
  totalPlaylists: number; // ← total_playlists
  totalAlbums: number; // ← total_albums
  totalArtists: number; // ← total_artists
  totalTracks: number; // ← total_tracks

  // Engagement
  totalLikes: number; // ← total_likes
  playlistsCreatedLast24h: number; // ← playlists_created_24h
  likesLast24h: number; // ← likes_24h

  // Preferences
  usersByLanguage: Record<string, number>; // ← users_by_language
  usersByDarkMode: Record<string, number>; // ← users_by_dark_mode
}

export interface GrowthPoint {
  date: string; // "2026-03-15"
  count: number;
}

export interface DashboardGrowth {
  signups: GrowthPoint[]; // ← signups[]
}

export interface DashboardResponse {
  stats: DashboardStats;
  growth: DashboardGrowth;
}

/** Raw snake_case response from the PHP backend */
export interface DashboardApiResponse {
  stats: {
    new_users_24h: number;
    total_users: number;
    active_users_7d: number;
    active_users_30d: number;
    total_playlists: number;
    total_albums: number;
    total_artists: number;
    total_tracks: number;
    total_likes: number;
    playlists_created_24h: number;
    likes_24h: number;
    users_by_language: Record<string, number>;
    users_by_dark_mode: Record<string, number>;
  };
  growth: {
    signups: { date: string; count: number }[];
  };
}
