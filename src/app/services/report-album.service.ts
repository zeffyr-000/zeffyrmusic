import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReportAlbumPayload, ReportAlbumResponse } from '../models/report-album.model';

@Injectable({
  providedIn: 'root',
})
export class ReportAlbumService {
  private readonly http = inject(HttpClient);

  /** Submits a user report about a catalogue album. */
  reportAlbum(payload: ReportAlbumPayload): Observable<ReportAlbumResponse> {
    return this.http.post<ReportAlbumResponse>(`${environment.URL_SERVER}report-album`, payload);
  }
}
