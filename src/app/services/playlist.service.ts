import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Playlist } from '../models/playlist.model';

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {
  constructor(private httpClient: HttpClient) { }

  getPlaylist(url: string, idPlaylist?: string): Observable<Playlist> {
    if (!url) {
      url = environment.URL_SERVER + 'json/playlist/' + idPlaylist;
    }

    return this.httpClient.get<Playlist>(url, environment.httpClientConfig);
  }
}