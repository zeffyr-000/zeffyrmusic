import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ArtistData } from '../models/artist.model';
import { isPlatformServer } from '@angular/common';

const ARTIST_KEY = (id: string) => makeStateKey<ArtistData>(`artist-${id}`);

@Injectable({
  providedIn: 'root'
})
export class ArtistService {
  constructor(@Inject(PLATFORM_ID) private platformId: object,
    private httpClient: HttpClient,
    private transferState: TransferState
  ) { }

  getArtist(idArtist: string): Observable<ArtistData> {
    const key = ARTIST_KEY(idArtist);
    const storedValue = this.transferState.get(key, null);

    if (storedValue) {
      return of(storedValue);
    }

    return this.httpClient
      .get<ArtistData>(environment.URL_SERVER + 'json/artist/' + idArtist)
      .pipe(
        tap(data => {
          if (isPlatformServer(this.platformId)) {
            this.transferState.set(key, data);
          }
        })
      );
  }
}
