import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Playlist } from '../models/playlist.model';
import {
  DuplicateAlbumGroup,
  DuplicateAlbumGroupApi,
  MergeAlbumsPayload,
  MergeAlbumsResponse,
} from '../models/album-admin.model';

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
      environment.URL_SERVER + 'admin/merge-albums',
      payload
    );
  }

  getDuplicateAlbums(): Observable<DuplicateAlbumGroup[]> {
    return this.httpClient
      .get<DuplicateAlbumGroupApi[]>(environment.URL_SERVER + 'admin/duplicate-albums')
      .pipe(map(groups => groups.map(group => this.mapGroup(group))));
  }

  private mapGroup(group: DuplicateAlbumGroupApi): DuplicateAlbumGroup {
    return {
      key: group.key,
      albums: group.albums.map(album => ({
        id: album.id_playlist,
        title: album.titre,
        artist: album.artiste,
        year: album.year,
        image: album.img_big,
        videoCount: album.nb_videos,
      })),
    };
  }
}
