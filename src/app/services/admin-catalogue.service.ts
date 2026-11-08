// TEMPORARY jour4: delete with its spec and the catalogue tab (API docs/mise-a-niveau-catalogue.md, section 8)
import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { CatalogueApiResponse, CatalogueResponse } from '../models/admin-catalogue.model';

@Service()
export class AdminCatalogueService {
  private readonly httpClient = inject(HttpClient);

  getCatalogue(): Observable<CatalogueResponse> {
    return this.httpClient
      .get<CatalogueApiResponse>(environment.URL_SERVER + 'admin/catalogue')
      .pipe(map(raw => this.mapResponse(raw)));
  }

  private mapResponse(raw: CatalogueApiResponse): CatalogueResponse {
    return {
      target: {
        albumsStart: raw.target.albums_start,
        albumsNow: raw.target.albums_now,
        albumsTarget: raw.target.albums_target,
        artistsStart: raw.target.artists_start,
        artistsNow: raw.target.artists_now,
        artistsTarget: raw.target.artists_target,
      },
      albums: {
        total: raw.albums.total,
        diagnosed: raw.albums.diagnosed,
        processed: raw.albums.processed,
        units: raw.albums.units,
        linesRemoved: raw.albums.lines_removed,
        deadTracks: raw.albums.dead_tracks,
        duplicated: raw.albums.duplicated,
        current: raw.albums.current,
        initial: raw.albums.initial,
        results: raw.albums.results,
      },
      segments: raw.segments,
      completion: {
        artists: raw.completion.artists,
        artistsExplored: raw.completion.artists_explored,
        artistsCandidates: raw.completion.artists_candidates,
        artistsSelected: raw.completion.artists_selected,
        artistsAdded: raw.completion.artists_added,
        units: raw.completion.units,
        albums: raw.completion.albums,
        albumsNewArtists: raw.completion.albums_new_artists,
      },
      quota: raw.quota.map(q => ({ task: q.task, budget: q.budget, usedToday: q.used_today })),
      history: raw.history,
      recent: {
        day: raw.recent.day,
        upgraded: raw.recent.upgraded.map(r => ({
          albumId: r.id_playlist,
          date: r.date,
          title: r.title,
          artist: r.artist,
          result: r.result,
          initialState: r.initial_state,
          state: r.state,
          score: r.score,
          units: r.units,
        })),
        created: raw.recent.created.map(r => ({
          id: r.id,
          albumId: r.id_playlist,
          date: r.date,
          title: r.title,
          artist: r.artist,
          result: r.result,
          units: r.units,
          newArtist: r.new_artist,
        })),
      },
    };
  }
}
