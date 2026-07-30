import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { AlbumReport, AlbumReportApi } from '../models/album-report.model';

@Injectable({
  providedIn: 'root',
})
export class AdminReportService {
  private readonly httpClient = inject(HttpClient);

  /** Album reports submitted by users, newest first (sorted server-side). */
  getReports(): Observable<AlbumReport[]> {
    return this.httpClient
      .get<AlbumReportApi[]>(environment.URL_SERVER + 'admin/reports')
      .pipe(map(reports => reports.map(report => this.mapReport(report))));
  }

  private mapReport(report: AlbumReportApi): AlbumReport {
    return {
      id: report.id_report,
      reportedAt: report.date_report,
      albumId: report.id_playlist,
      albumTitle: report.titre,
      albumArtist: report.artiste,
      reason: report.reason,
      userPseudo: report.pseudo,
      status: report.status,
    };
  }
}
