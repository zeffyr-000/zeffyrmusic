import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, TransferState, makeStateKey, inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Playlist } from '../models/playlist.model';
import { isPlatformBrowser } from '@angular/common';

const PLAYLIST_KEY = (id: string) => makeStateKey<Playlist>(`playlist-${id}`);

@Injectable({
  providedIn: 'root',
})
export class PlaylistService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly httpClient = inject(HttpClient);
  private readonly transferState = inject(TransferState);

  private readonly isBrowser: boolean;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  getPlaylist(url: string, idPlaylist?: string): Observable<Playlist> {
    if (!url) {
      url = environment.URL_SERVER + 'json/playlist/' + idPlaylist;
    }

    const key = PLAYLIST_KEY(url);
    const storedValue = this.transferState.get(key, null);

    if (storedValue && this.isBrowser) {
      this.transferState.remove(key);
      // Don't use cached value if playlist is private — browser must re-fetch with auth cookie
      if (!storedValue.est_prive) {
        return of(storedValue);
      }
    }

    return this.httpClient.get<Playlist>(url).pipe(
      tap(data => {
        if (!this.isBrowser) {
          this.transferState.set(key, data);
        }
      })
    );
  }
}
