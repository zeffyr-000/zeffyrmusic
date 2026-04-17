import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AdminDashboardService } from './admin-dashboard.service';
import { environment } from '../../environments/environment';
import { DashboardApiResponse } from '../models/admin-dashboard.model';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let httpMock: HttpTestingController;

  const mockApiResponse: DashboardApiResponse = {
    stats: {
      new_users_24h: 12,
      total_users: 5000,
      active_users_7d: 320,
      active_users_30d: 1200,
      total_playlists: 800,
      total_albums: 3500,
      total_artists: 1500,
      total_tracks: 25000,
      total_likes: 15000,
      playlists_created_24h: 5,
      likes_24h: 42,
      users_by_language: { fr: 120, en: 45 },
      users_by_dark_mode: { enabled: 80, disabled: 90 },
    },
    growth: {
      signups: [
        { date: '2026-03-01', count: 3 },
        { date: '2026-03-02', count: 7 },
      ],
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminDashboardService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AdminDashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch and map dashboard data', () => {
    service.getDashboard().subscribe(data => {
      expect(data.stats.newUsersLast24h).toBe(12);
      expect(data.stats.totalUsers).toBe(5000);
      expect(data.stats.activeUsersLast7d).toBe(320);
      expect(data.stats.activeUsersLast30d).toBe(1200);
      expect(data.stats.totalPlaylists).toBe(800);
      expect(data.stats.totalAlbums).toBe(3500);
      expect(data.stats.totalArtists).toBe(1500);
      expect(data.stats.totalTracks).toBe(25000);
      expect(data.stats.totalLikes).toBe(15000);
      expect(data.stats.playlistsCreatedLast24h).toBe(5);
      expect(data.stats.likesLast24h).toBe(42);
      expect(data.stats.usersByLanguage).toEqual({ fr: 120, en: 45 });
      expect(data.stats.usersByDarkMode).toEqual({ enabled: 80, disabled: 90 });
      expect(data.growth.signups).toHaveLength(2);
      expect(data.growth.signups[0]).toEqual({ date: '2026-03-01', count: 3 });
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'admin/dashboard');
    expect(req.request.method).toBe('GET');
    req.flush(mockApiResponse);
  });
});
