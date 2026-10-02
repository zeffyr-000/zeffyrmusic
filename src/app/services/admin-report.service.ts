import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AlbumReport,
  AlbumReportActionResponse,
  AlbumReportApi,
} from '../models/album-report.model';

@Service()
export class AdminReportService {
  private readonly httpClient = inject(HttpClient);

  /** Album reports submitted by users, newest first (sorted server-side). */
  getReports(): Observable<AlbumReport[]> {
    return this.httpClient
      .get<AlbumReportApi[]>(environment.URL_SERVER + 'admin/reports')
      .pipe(map(reports => reports.map(report => this.mapReport(report))));
  }

  /** Marks every unprocessed report of the album as processed (`clos_admin`). */
  closeReport(id: string): Observable<AlbumReportActionResponse> {
    return this.httpClient.post<AlbumReportActionResponse>(
      environment.URL_SERVER + 'admin/close-report',
      { id_report: id }
    );
  }

  /** Re-queues every unprocessed report of the album for the next cron run. */
  retryReport(id: string): Observable<AlbumReportActionResponse> {
    return this.httpClient.post<AlbumReportActionResponse>(
      environment.URL_SERVER + 'admin/retry-report',
      { id_report: id }
    );
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
      result: report.resultat,
    };
  }
}
