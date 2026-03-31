import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ArtistData } from '../models/artist.model';
import { MergeArtistsPayload, MergeArtistsResponse } from '../models/artist-admin.model';

@Injectable({
  providedIn: 'root',
})
export class ArtistAdminService {
  private readonly httpClient = inject(HttpClient);

  getArtistDetails(idArtist: string): Observable<ArtistData> {
    return this.httpClient.get<ArtistData>(environment.URL_SERVER + 'json/artist/' + idArtist);
  }

  mergeArtists(payload: MergeArtistsPayload): Observable<MergeArtistsResponse> {
    return this.httpClient.post<MergeArtistsResponse>(
      environment.URL_SERVER + 'admin/merge-artists',
      payload
    );
  }
}
