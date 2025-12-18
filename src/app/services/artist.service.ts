import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, TransferState, makeStateKey, inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ArtistData } from '../models/artist.model';
import { isPlatformServer } from '@angular/common';

const ARTIST_KEY = (id: string) => makeStateKey<ArtistData>(`artist-${id}`);

@Injectable({
  providedIn: 'root',
})
export class ArtistService {
  private platformId = inject(PLATFORM_ID);
  private httpClient = inject(HttpClient);
  private transferState = inject(TransferState);

  getArtist(idArtist: string): Observable<ArtistData> {
    const key = ARTIST_KEY(idArtist);
    const storedValue = this.transferState.get(key, null);

    if (storedValue) {
      return of(storedValue);
    }

    return this.httpClient.get<ArtistData>(environment.URL_SERVER + 'json/artist/' + idArtist).pipe(
      tap(data => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(key, data);
        }
      })
    );
  }
}
