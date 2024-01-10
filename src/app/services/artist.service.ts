import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ArtistData } from '../models/artist.model';

@Injectable({
  providedIn: 'root'
})
export class ArtistService {
  constructor(private httpClient: HttpClient) { }

  getArtist(idArtist: string): Observable<ArtistData> {
    return this.httpClient.get<ArtistData>(environment.URL_SERVER + 'json/artist/' + idArtist, environment.httpClientConfig);
  }
}
