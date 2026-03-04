import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LyricsResponse } from '../models/lyrics.model';

/**
 * LyricsService — Fetches synchronized lyrics from LRCLIB via backend.
 *
 * Backend parses LRC format and returns pre-structured lines.
 * Maintains an in-memory cache to avoid redundant HTTP calls
 * when the user reopens the panel on the same track.
 */
@Injectable({
  providedIn: 'root',
})
export class LyricsService {
  private readonly httpClient = inject(HttpClient);
  private readonly cache = new Map<string, LyricsResponse>();

  /** Fetch lyrics for a video by its database ID (cached). */
  getLyrics(idVideo: string): Observable<LyricsResponse> {
    const cached = this.cache.get(idVideo);
    if (cached) {
      return of(cached);
    }
    return this.httpClient
      .get<LyricsResponse>(environment.URL_SERVER + 'lyrics/' + encodeURIComponent(idVideo))
      .pipe(tap(response => this.cache.set(idVideo, response)));
  }

  /** Clear the in-memory lyrics cache. */
  clearCache(): void {
    this.cache.clear();
  }
}
