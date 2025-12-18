import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PlaylistService } from './playlist.service';
import { Playlist } from '../models/playlist.model';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { environment } from 'src/environments/environment';

describe('PlaylistService', () => {
  describe('Browser context', () => {
    let service: PlaylistService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [],
        providers: [
          {
            provide: PLATFORM_ID,
            useValue: 'browser',
          },
          PlaylistService,
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
        ],
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
        id_artiste: '101112',
      };

      service.getPlaylist('test_url').subscribe(data => {
        expect(data).toEqual(mockPlaylistData);
      });

      const req = httpMock.expectOne('test_url');

      expect(req.request.method).toBe('GET');

      req.flush(mockPlaylistData);
    });

    it('should use stored value from transferState and remove key when in browser context', () => {
      const transferStateMock = { get: vi.fn(), set: vi.fn(), remove: vi.fn() };

      const storedPlaylistData: Playlist = {
        id_playlist: '123',
        id_perso: '456',
        title: 'Stored Playlist',
        description: 'Stored Description',
        est_suivi: false,
        id_top: '789',
        img_big: 'stored_img_big',
        liste_video: ['1', '2', '3'],
        str_index: [0, 1, 2],
        tab_video: [],
        est_prive: false,
        titre: 'Stored Playlist',
        artiste: 'Stored Artist',
        id_artiste: '101112',
      };

      transferStateMock.get.mockReturnValue(storedPlaylistData);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).transferState = transferStateMock;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((service as any).isBrowser).toBe(true);

      const testUrl = 'test_url';

      let result: Playlist | null = null;

      service.getPlaylist(testUrl).subscribe(data => {
        result = data;
      });

      httpMock.expectNone(testUrl);

      expect(result).toEqual(storedPlaylistData);
      expect(transferStateMock.get).toHaveBeenCalledWith('playlist-' + testUrl, null);
      expect(transferStateMock.remove).toHaveBeenCalledWith('playlist-' + testUrl);
      expect(transferStateMock.set).not.toHaveBeenCalled();
    });
  });

  describe('Server context', () => {
    let service: PlaylistService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [],
        providers: [
          {
            provide: PLATFORM_ID,
            useValue: 'server',
          },
          PlaylistService,
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
        ],
      });

      service = TestBed.inject(PlaylistService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should store playlist data in transferState when in server context', () => {
      const transferStateMock = { get: vi.fn(), set: vi.fn(), remove: vi.fn() };
      transferStateMock.get.mockReturnValue(null); // Simulate that no data is stored initially

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).transferState = transferStateMock;

      const testUrl = environment.URL_SERVER + 'json/playlist/123';
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
        id_artiste: '101112',
      };

      service.getPlaylist(testUrl).subscribe();

      const req = httpMock.expectOne(testUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockPlaylistData);

      expect(transferStateMock.set).toHaveBeenCalledWith('playlist-' + testUrl, mockPlaylistData);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((service as any).isBrowser).toBe(false);
      expect(transferStateMock.remove).not.toHaveBeenCalled();
    });

    it('should not remove data from transferState when in server context', () => {
      const transferStateMock = { get: vi.fn(), set: vi.fn(), remove: vi.fn() };

      const storedPlaylistData: Playlist = {
        id_playlist: '123',
        id_perso: '456',
        title: 'Stored Playlist',
        description: 'Stored Description',
        est_suivi: false,
        id_top: '789',
        img_big: 'stored_img_big',
        liste_video: ['1', '2', '3'],
        str_index: [0, 1, 2],
        tab_video: [],
        est_prive: false,
        titre: 'Stored Playlist',
        artiste: 'Stored Artist',
      };
      transferStateMock.get.mockReturnValue(storedPlaylistData);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).transferState = transferStateMock;

      const testUrl = 'test_url';

      let resultData: Playlist | null = null;
      service.getPlaylist(testUrl).subscribe(data => {
        resultData = data;
      });

      const req = httpMock.expectOne(testUrl);

      const httpResponseData: Playlist = {
        id_playlist: '123',
        id_perso: '456',
        title: 'HTTP Response Playlist',
        description: 'HTTP Response Description',
        est_suivi: false,
        id_top: '789',
        img_big: 'http_response_img_big',
        liste_video: ['1', '2', '3'],
        str_index: [0, 1, 2],
        tab_video: [],
        est_prive: false,
        titre: 'HTTP Response Playlist',
        artiste: 'HTTP Response Artist',
      };
      req.flush(httpResponseData);

      expect(resultData).toEqual(httpResponseData);
      expect(transferStateMock.set).toHaveBeenCalledWith('playlist-' + testUrl, httpResponseData);
      expect(transferStateMock.remove).not.toHaveBeenCalled();
    });
  });
});
