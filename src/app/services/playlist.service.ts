import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Playlist } from '../models/playlist.model';
import { isPlatformBrowser } from '@angular/common';

const PLAYLIST_KEY = (id: string) => makeStateKey<Playlist>(`playlist-${id}`);

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: object,
    private httpClient: HttpClient,
    private transferState: TransferState
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  getPlaylist(url: string, idPlaylist?: string): Observable<Playlist> {
    if (!url) {
      url = environment.URL_SERVER + 'json/playlist/' + idPlaylist;
    }

    const key = PLAYLIST_KEY(url);
    const storedValue = this.transferState.get(key, null);

    if (storedValue) {
      return of(storedValue);
    }

    return this.httpClient.get<Playlist>(url).pipe(
      tap((data) => {
        if (!this.isBrowser) {
          this.transferState.set(key, data);
        }
      })
    );
  }
}