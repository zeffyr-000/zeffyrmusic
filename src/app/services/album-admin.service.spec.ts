import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AlbumAdminService } from './album-admin.service';
import { environment } from '../../environments/environment';
import { Playlist } from '../models/playlist.model';
import { MergeAlbumsPayload, MergeAlbumsResponse } from '../models/album-admin.model';

describe('AlbumAdminService', () => {
  let service: AlbumAdminService;
  let httpMock: HttpTestingController;

  const mockPlaylist: Playlist = {
    id_playlist: '123',
    id_perso: '',
    title: 'Test Album',
    description: '',
    est_suivi: false,
    img_big: 'https://example.com/img.jpg',
    og_image: '',
    liste_video: [],
    str_index: [],
    tab_video: [],
    titre: 'Test Album',
    artiste: 'Test Artist',
    year: 2023,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AlbumAdminService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AlbumAdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch album details', () => {
    service.getAlbumDetails('123').subscribe(data => {
      expect(data).toEqual(mockPlaylist);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'json/playlist/123');
    expect(req.request.method).toBe('GET');
    req.flush(mockPlaylist);
  });

  it('should post merge albums request', () => {
    const payload: MergeAlbumsPayload = {
      keep_album_id: '123',
      delete_album_id: '456',
      titre_from: '123',
      artiste_from: '123',
      img_from: '123',
      videos_from: '123',
      year_from: '123',
    };

    const mockResponse: MergeAlbumsResponse = { success: true };

    service.mergeAlbums(payload).subscribe(data => {
      expect(data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'api/admin/merge-albums');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('should handle merge error response', () => {
    const payload: MergeAlbumsPayload = {
      keep_album_id: '123',
      delete_album_id: '456',
      titre_from: '123',
      artiste_from: '123',
      img_from: '123',
      videos_from: '123',
      year_from: '123',
    };

    const mockResponse: MergeAlbumsResponse = { success: false, error: 'not_found' };

    service.mergeAlbums(payload).subscribe(data => {
      expect(data.success).toBe(false);
      expect(data.error).toBe('not_found');
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'api/admin/merge-albums');
    req.flush(mockResponse);
  });
});
