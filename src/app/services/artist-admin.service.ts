import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ArtistData } from '../models/artist.model';
import {
  DuplicateArtistGroup,
  DuplicateArtistGroupApi,
  MergeArtistsPayload,
  MergeArtistsResponse,
} from '../models/artist-admin.model';

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

  getDuplicateArtists(): Observable<DuplicateArtistGroup[]> {
    return this.httpClient
      .get<DuplicateArtistGroupApi[]>(environment.URL_SERVER + 'admin/duplicate-artists')
      .pipe(map(groups => groups.map(group => this.mapGroup(group))));
  }

  private mapGroup(group: DuplicateArtistGroupApi): DuplicateArtistGroup {
    return {
      key: group.key,
      artists: group.artists.map(artist => ({
        id: artist.id_artist,
        name: artist.nom,
        albumCount: artist.nb_albums,
        deezerId: artist.id_artiste_deezer,
      })),
    };
  }
}
