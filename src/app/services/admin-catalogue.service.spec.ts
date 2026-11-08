import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AdminCatalogueService } from './admin-catalogue.service';
import { environment } from '../../environments/environment';
import { CatalogueApiResponse } from '../models/admin-catalogue.model';
import { provideHttpTesting } from '../testing/http-testing';

describe('AdminCatalogueService', () => {
  let service: AdminCatalogueService;
  let httpMock: HttpTestingController;

  const mockApiResponse: CatalogueApiResponse = {
    target: {
      albums_start: 21578,
      albums_now: 21655,
      albums_target: 43156,
      artists_start: 8820,
      artists_now: 8820,
      artists_target: 17640,
    },
    albums: {
      total: 21578,
      diagnosed: 202,
      processed: 2,
      units: 3,
      lines_removed: 62,
      dead_tracks: 1,
      duplicated: 52,
      current: { conforme: 133, non_diagnostique: 21376 },
      initial: { conforme: 130, incomplet: 3 },
      results: { album_conforme: 1 },
    },
    segments: [{ key: 'top', total: 45, processed: 1, compliant: 33 }],
    completion: {
      artists: 8829,
      artists_explored: 1,
      artists_candidates: 7,
      artists_selected: 2,
      artists_added: 0,
      units: 215,
      albums: { a_creer: 4, cree: 2 },
      albums_new_artists: { a_creer: 1 },
    },
    quota: [{ task: 'completion', budget: 9500, used_today: 215 }],
    history: [
      {
        date: '2026-10-31',
        task: 'completion',
        processed: 0,
        diagnosed: 0,
        created: 2,
        explored: 1,
        units: 215,
      },
    ],
    recent: {
      day: '2026-11-05',
      upgraded: [
        {
          id_playlist: '61190',
          date: 1793895800,
          title: 'Joie de vivre',
          artist: 'Louane',
          result: 'regenere',
          initial_state: 'incomplet',
          state: 'conforme',
          score: 95,
          units: 108,
        },
      ],
      created: [
        {
          id: '3067',
          id_playlist: '80604',
          date: 1793889618,
          title: 'Departure',
          artist: 'Taio Cruz',
          result: 'cree',
          units: 107,
          new_artist: true,
        },
      ],
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminCatalogueService, ...provideHttpTesting()],
    });

    service = TestBed.inject(AdminCatalogueService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch and map catalogue progress', () => {
    service.getCatalogue().subscribe(data => {
      expect(data.target).toEqual({
        albumsStart: 21578,
        albumsNow: 21655,
        albumsTarget: 43156,
        artistsStart: 8820,
        artistsNow: 8820,
        artistsTarget: 17640,
      });
      expect(data.albums.total).toBe(21578);
      expect(data.albums.linesRemoved).toBe(62);
      expect(data.albums.deadTracks).toBe(1);
      expect(data.albums.current).toEqual({ conforme: 133, non_diagnostique: 21376 });
      expect(data.segments[0]).toEqual({ key: 'top', total: 45, processed: 1, compliant: 33 });
      expect(data.completion.artistsExplored).toBe(1);
      expect(data.completion.artistsCandidates).toBe(7);
      expect(data.completion.artistsSelected).toBe(2);
      expect(data.completion.albumsNewArtists).toEqual({ a_creer: 1 });
      expect(data.completion.albums).toEqual({ a_creer: 4, cree: 2 });
      expect(data.quota[0]).toEqual({ task: 'completion', budget: 9500, usedToday: 215 });
      expect(data.history).toHaveLength(1);
      expect(data.recent.day).toBe('2026-11-05');
      expect(data.recent.upgraded[0]).toEqual({
        albumId: '61190',
        date: 1793895800,
        title: 'Joie de vivre',
        artist: 'Louane',
        result: 'regenere',
        initialState: 'incomplet',
        state: 'conforme',
        score: 95,
        units: 108,
      });
      expect(data.recent.created[0]).toEqual({
        id: '3067',
        albumId: '80604',
        date: 1793889618,
        title: 'Departure',
        artist: 'Taio Cruz',
        result: 'cree',
        units: 107,
        newArtist: true,
      });
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'admin/catalogue');
    expect(req.request.method).toBe('GET');
    req.flush(mockApiResponse);
  });
});
