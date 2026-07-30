import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AdminReportService } from './admin-report.service';
import { environment } from '../../environments/environment';
import { AlbumReportApi } from '../models/album-report.model';
import { provideHttpTesting } from '../testing/http-testing';

describe('AdminReportService', () => {
  let service: AdminReportService;
  let httpMock: HttpTestingController;

  const mockApiResponse: AlbumReportApi[] = [
    {
      id_report: '412',
      date_report: 1753876320,
      id_playlist: '8371',
      titre: 'Random Access Memories',
      artiste: 'Daft Punk',
      reason: 'missing_tracks',
      pseudo: 'jdoe',
      status: 'pending',
    },
    {
      id_report: '399',
      date_report: 1753790000,
      id_playlist: '5120',
      titre: 'Nevermind',
      artiste: 'Nirvana',
      reason: 'wrong_album',
      pseudo: 'alice',
      status: 'processed',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminReportService, ...provideHttpTesting()],
    });

    service = TestBed.inject(AdminReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch and map reports', () => {
    service.getReports().subscribe(reports => {
      expect(reports).toHaveLength(2);
      expect(reports[0]).toEqual({
        id: '412',
        reportedAt: 1753876320,
        albumId: '8371',
        albumTitle: 'Random Access Memories',
        albumArtist: 'Daft Punk',
        reason: 'missing_tracks',
        userPseudo: 'jdoe',
        status: 'pending',
      });
      expect(reports[1].id).toBe('399');
      expect(reports[1].status).toBe('processed');
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'admin/reports');
    expect(req.request.method).toBe('GET');
    req.flush(mockApiResponse);
  });

  it('should map an empty list to an empty array', () => {
    service.getReports().subscribe(reports => {
      expect(reports).toEqual([]);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'admin/reports');
    req.flush([]);
  });

  it('should pass through empty album title and pseudo untouched', () => {
    service.getReports().subscribe(reports => {
      expect(reports[0].albumTitle).toBe('');
      expect(reports[0].albumArtist).toBe('');
      expect(reports[0].userPseudo).toBe('');
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'admin/reports');
    req.flush([{ ...mockApiResponse[0], titre: '', artiste: '', pseudo: '' }]);
  });
});
