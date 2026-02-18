import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ThumbnailResult {
  img_big: string;
}

@Injectable({
  providedIn: 'root',
})
export class PlaylistThumbnailService {
  private readonly http = inject(HttpClient);

  uploadThumbnail(idPlaylist: string, blob: Blob, mimeType: string): Observable<ThumbnailResult> {
    const formData = new FormData();
    const ext = mimeType.split('/')[1] || 'jpeg';
    formData.append('image', blob, `thumbnail.${ext}`);
    return this.http.post<ThumbnailResult>(
      `${environment.URL_SERVER}playlist-image/${idPlaylist}`,
      formData
    );
  }

  resetThumbnail(idPlaylist: string): Observable<ThumbnailResult> {
    return this.http.post<ThumbnailResult>(
      `${environment.URL_SERVER}playlist-image-delete/${idPlaylist}`,
      null
    );
  }
}
