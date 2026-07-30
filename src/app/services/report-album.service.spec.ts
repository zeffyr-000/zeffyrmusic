import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { ReportAlbumService } from './report-album.service';
import { environment } from '../../environments/environment';
import { ReportAlbumPayload, ReportAlbumResponse } from '../models/report-album.model';
import { provideHttpTesting } from '../testing/http-testing';

describe('ReportAlbumService', () => {
  let service: ReportAlbumService;
  let httpMock: HttpTestingController;

  const payload: ReportAlbumPayload = {
    id_playlist: '42',
    reason: 'missing_tracks',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReportAlbumService, ...provideHttpTesting()],
    });

    service = TestBed.inject(ReportAlbumService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should post the report with the snake_case payload', () => {
    const mockResponse: ReportAlbumResponse = { success: true };

    service.reportAlbum(payload).subscribe(data => {
      expect(data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'report-album');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ id_playlist: '42', reason: 'missing_tracks' });
    req.flush(mockResponse);
  });

  it('should pass an error response through to the subscriber', () => {
    const mockResponse: ReportAlbumResponse = { success: false, error: 'already_reported' };

    service.reportAlbum(payload).subscribe(data => {
      expect(data.success).toBe(false);
      expect(data.error).toBe('already_reported');
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'report-album');
    req.flush(mockResponse);
  });
});
