import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Playlist } from '../models/playlist.model';
import { MergeAlbumsPayload, MergeAlbumsResponse } from '../models/album-admin.model';

@Injectable({
  providedIn: 'root',
})
export class AlbumAdminService {
  private readonly httpClient = inject(HttpClient);

  getAlbumDetails(idPlaylist: string): Observable<Playlist> {
    return this.httpClient.get<Playlist>(environment.URL_SERVER + 'json/playlist/' + idPlaylist);
  }

  mergeAlbums(payload: MergeAlbumsPayload): Observable<MergeAlbumsResponse> {
    return this.httpClient.post<MergeAlbumsResponse>(
      environment.URL_SERVER + 'api/admin/merge-albums',
      payload
    );
  }
}
