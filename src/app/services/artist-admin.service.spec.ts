import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { ArtistAdminService } from './artist-admin.service';
import { environment } from '../../environments/environment';
import { ArtistData } from '../models/artist.model';
import { MergeArtistsPayload, MergeArtistsResponse } from '../models/artist-admin.model';

describe('ArtistAdminService', () => {
  let service: ArtistAdminService;
  let httpMock: HttpTestingController;

  const mockArtist: ArtistData = {
    nom: 'Test Artist',
    id_artiste_deezer: '456',
    id_artist: '123',
    list_albums: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ArtistAdminService,
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ArtistAdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch artist details', () => {
    service.getArtistDetails('123').subscribe(data => {
      expect(data).toEqual(mockArtist);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'json/artist/123');
    expect(req.request.method).toBe('GET');
    req.flush(mockArtist);
  });

  it('should post merge artists request', () => {
    const payload: MergeArtistsPayload = {
      keep_artist_id: '123',
      delete_artist_id: '789',
      nom_from: '123',
      id_artiste_deezer_from: '123',
    };

    const mockResponse: MergeArtistsResponse = { success: true };

    service.mergeArtists(payload).subscribe(data => {
      expect(data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'admin/merge-artists');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('should handle merge error response', () => {
    const payload: MergeArtistsPayload = {
      keep_artist_id: '123',
      delete_artist_id: '789',
      nom_from: '123',
      id_artiste_deezer_from: '123',
    };

    const mockResponse: MergeArtistsResponse = { success: false, error: 'not_found' };

    service.mergeArtists(payload).subscribe(data => {
      expect(data.success).toBe(false);
      expect(data.error).toBe('not_found');
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'admin/merge-artists');
    req.flush(mockResponse);
  });
});
