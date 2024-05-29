import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PlaylistService } from './playlist.service';
import { Playlist } from '../models/playlist.model';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('PlaylistService', () => {
  let service: PlaylistService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [PlaylistService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});

    service = TestBed.inject(PlaylistService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch playlist data', () => {
    const mockPlaylistData: Playlist = {
      id_playlist: '123',
      id_perso: '456',
      title: 'Test Playlist',
      description: 'Test Description',
      est_suivi: false,
      id_top: '789',
      img_big: 'test_img_big',
      liste_video: ['1', '2', '3'],
      str_index: [0, 1, 2],
      tab_video: [],
      est_prive: false,
      titre: 'Test Titre',
      artiste: 'Test Artiste',
      id_artiste: '101112'
    };

    service.getPlaylist('test_url').subscribe(data => {
      expect(data).toEqual(mockPlaylistData);
    });

    const req = httpMock.expectOne('test_url');

    expect(req.request.method).toBe('GET');

    req.flush(mockPlaylistData);
  });
});