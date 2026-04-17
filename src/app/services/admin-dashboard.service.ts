import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardApiResponse, DashboardResponse } from '../models/admin-dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardService {
  private readonly httpClient = inject(HttpClient);

  getDashboard(): Observable<DashboardResponse> {
    return this.httpClient
      .get<DashboardApiResponse>(environment.URL_SERVER + 'admin/dashboard')
      .pipe(map(raw => this.mapResponse(raw)));
  }

  private mapResponse(raw: DashboardApiResponse): DashboardResponse {
    return {
      stats: {
        newUsersLast24h: raw.stats.new_users_24h,
        totalUsers: raw.stats.total_users,
        activeUsersLast7d: raw.stats.active_users_7d,
        activeUsersLast30d: raw.stats.active_users_30d,
        totalPlaylists: raw.stats.total_playlists,
        totalAlbums: raw.stats.total_albums,
        totalArtists: raw.stats.total_artists,
        totalTracks: raw.stats.total_tracks,
        totalLikes: raw.stats.total_likes,
        playlistsCreatedLast24h: raw.stats.playlists_created_24h,
        likesLast24h: raw.stats.likes_24h,
        usersByLanguage: raw.stats.users_by_language,
        usersByDarkMode: raw.stats.users_by_dark_mode,
      },
      growth: {
        signups: raw.growth.signups,
      },
    };
  }
}
