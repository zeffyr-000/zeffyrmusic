import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { InitService, PingResponse } from './init.service';
import { HomeAlbum } from '../models/album.model';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { AuthStore } from '../store';
import { UserDataStore } from '../store/user-data/user-data.store';
import { QueueStore } from '../store/queue/queue.store';
import { UiStore } from '../store/ui/ui.store';

describe('InitService', () => {
  let service: InitService;
  let httpMock: HttpTestingController;
  let transferState: TransferState;
  let authStore: InstanceType<typeof AuthStore>;
  let userDataStore: InstanceType<typeof UserDataStore>;

  const mockPingResponse: PingResponse = {
    est_connecte: true,
    pseudo: 'testUser',
    id_perso: '123',
    mail: 'test@example.com',
    dark_mode_enabled: true,
    language: 'fr',
    liste_playlist: [],
    liste_suivi: [],
    like_video: [],
    liste_video: [],
    tab_index: [],
    tab_video: [],
  };

  const mockHomeData = {
    top: [
      {
        id: '1',
        titre: 'Album 1',
        description: 'Description 1',
        url_image: 'image1.jpg',
      },
    ],
    top_albums: [{ id: '2', titre: 'Album 2', description: 'Artiste 2', url_image: 'image2.jpg' }],
  };

  describe('In browser environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [],
        providers: [
          getTranslocoTestingProviders(),
          InitService,
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });

      service = TestBed.inject(InitService);
      httpMock = TestBed.inject(HttpTestingController);
      transferState = TestBed.inject(TransferState);
      authStore = TestBed.inject(AuthStore);
      userDataStore = TestBed.inject(UserDataStore);
      TestBed.inject(QueueStore); // Injected to initialize store but not used directly in tests
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    describe('getPing', () => {
      it('should load ping data from TransferState when available in browser', () => {
        const PING_KEY = makeStateKey<PingResponse>('pingData');

        vi.spyOn(transferState, 'get').mockReturnValue(mockPingResponse);
        vi.spyOn(transferState, 'remove');

        const handlePingResponseSpy = vi.spyOn(
          service as unknown as { handlePingResponse: (response: PingResponse) => void },
          'handlePingResponse'
        );
        const initializeSpy = vi.spyOn(userDataStore, 'initialize');

        service.getPing().subscribe(success => {
          expect(success).toBe(true);
        });

        expect(transferState.get).toHaveBeenCalledWith(PING_KEY, null);
        expect(transferState.remove).toHaveBeenCalledWith(PING_KEY);
        expect(handlePingResponseSpy).toHaveBeenCalledWith(mockPingResponse);
        expect(initializeSpy).toHaveBeenCalled();

        httpMock.expectNone(environment.URL_SERVER + 'ping');
      });

      it('should call authStore.initializeAnonymous when not connected', () => {
        const mockDisconnectedResponse: PingResponse = {
          est_connecte: false,
          pseudo: '',
          id_perso: '',
          mail: '',
          dark_mode_enabled: false,
          language: 'fr',
          liste_playlist: [],
          liste_suivi: [],
          like_video: [],
          liste_video: [],
          tab_index: [],
          tab_video: [],
        };

        const initAnonymousSpy = vi.spyOn(authStore, 'initializeAnonymous');
        const initializeSpy = vi.spyOn(userDataStore, 'initialize');

        service.getPing().subscribe(success => {
          expect(success).toBe(true);
        });

        const req = httpMock.expectOne(environment.URL_SERVER + 'ping');
        req.flush(mockDisconnectedResponse);

        expect(initAnonymousSpy).toHaveBeenCalled();
        expect(initializeSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            playlists: [],
            follows: [],
            likedVideos: [],
          })
        );
        expect(authStore.isAuthenticated()).toBe(false);
      });

      it('should call authStore.login when connected', () => {
        const mockConnectedResponse: PingResponse = {
          est_connecte: true,
          pseudo: 'testUser',
          id_perso: '123',
          mail: 'test@example.com',
          dark_mode_enabled: true,
          language: 'en',
          liste_playlist: [{ id_playlist: '1', titre: 'Playlist 1', prive: false }],
          liste_suivi: [{ id_playlist: '2', titre: 'Artist 2' }],
          like_video: [
            {
              id: '1',
              key: 'XXX1',
              titre: 'titre1',
              duree: '100',
              artiste: 'Artist 1',
            },
          ],
          liste_video: [],
          tab_index: [1, 2, 3],
          tab_video: ['vid1', 'vid2'],
        };

        const loginSpy = vi.spyOn(authStore, 'login');
        const initializeSpy = vi.spyOn(userDataStore, 'initialize');

        service.getPing().subscribe(success => {
          expect(success).toBe(true);
        });

        const req = httpMock.expectOne(environment.URL_SERVER + 'ping');
        req.flush(mockConnectedResponse);

        expect(loginSpy).toHaveBeenCalledWith(
          { pseudo: 'testUser', idPerso: '123', mail: 'test@example.com' },
          { darkModeEnabled: true, language: 'en' }
        );

        expect(initializeSpy).toHaveBeenCalledWith({
          playlists: mockConnectedResponse.liste_playlist,
          follows: mockConnectedResponse.liste_suivi,
          likedVideos: mockConnectedResponse.like_video,
          initialVideos: mockConnectedResponse.liste_video,
          initialTabIndex: mockConnectedResponse.tab_index,
        });

        expect(authStore.isAuthenticated()).toBe(true);
      });

      it('should handle HTTP error gracefully', () => {
        service.getPing().subscribe(success => {
          expect(success).toBe(false);
        });

        const req = httpMock.expectOne(environment.URL_SERVER + 'ping');
        req.error(new ErrorEvent('Network error'));
      });
    });

    describe('getHomeInit', () => {
      const HOME_KEY = makeStateKey<{ top: HomeAlbum[]; top_albums: HomeAlbum[] }>('homeData');

      it('should use cached data from TransferState and remove it', () => {
        vi.spyOn(transferState, 'get').mockReturnValue(mockHomeData);
        const removeSpy = vi.spyOn(transferState, 'remove');

        let result: { top: HomeAlbum[]; top_albums: HomeAlbum[] } | undefined;
        service.getHomeInit().subscribe(data => {
          result = data;
        });

        expect(transferState.get).toHaveBeenCalledWith(HOME_KEY, null);
        expect(removeSpy).toHaveBeenCalledWith(HOME_KEY);
        expect(result).toEqual(mockHomeData);

        httpMock.expectNone(environment.URL_SERVER + 'home_init');
      });

      it('should make HTTP request when no cached data exists', () => {
        vi.spyOn(transferState, 'get').mockReturnValue(null);

        let result: { top: HomeAlbum[]; top_albums: HomeAlbum[] } | undefined;
        service.getHomeInit().subscribe(data => {
          result = data;
        });

        const req = httpMock.expectOne(environment.URL_SERVER + 'home_init');
        expect(req.request.method).toBe('GET');
        req.flush(mockHomeData);

        expect(result).toEqual(mockHomeData);
      });
    });

    describe('loginSuccess', () => {
      it('should call authStore.login with correct parameters', () => {
        const loginSpy = vi.spyOn(authStore, 'login');

        service.loginSuccess('test_pseudo', 'test_id_perso', 'test_mail', true, 'en');

        expect(loginSpy).toHaveBeenCalledWith(
          { pseudo: 'test_pseudo', idPerso: 'test_id_perso', mail: 'test_mail' },
          { darkModeEnabled: true, language: 'en' }
        );
        expect(authStore.isAuthenticated()).toBe(true);
      });
    });

    describe('logOut', () => {
      it('should call authStore.logout', () => {
        // First login
        authStore.login(
          { pseudo: 'test', idPerso: '123', mail: 'test@test.com' },
          { darkModeEnabled: false, language: 'fr' }
        );
        expect(authStore.isAuthenticated()).toBe(true);

        const logoutSpy = vi.spyOn(authStore, 'logout');

        service.logOut();

        expect(logoutSpy).toHaveBeenCalled();
        expect(authStore.isAuthenticated()).toBe(false);
      });
    });

    describe('onMessageUnlog', () => {
      it('should call uiStore.showSessionExpired and authStore.logout', () => {
        const uiStore = TestBed.inject(UiStore);
        const showSessionExpiredSpy = vi.spyOn(uiStore, 'showSessionExpired');
        const logoutSpy = vi.spyOn(authStore, 'logout');

        service.onMessageUnlog();

        expect(showSessionExpiredSpy).toHaveBeenCalled();
        expect(logoutSpy).toHaveBeenCalled();
      });
    });
  });

  describe('In server environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [],
        providers: [
          getTranslocoTestingProviders(),
          InitService,
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });

      service = TestBed.inject(InitService);
      httpMock = TestBed.inject(HttpTestingController);
      transferState = TestBed.inject(TransferState);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    describe('getHomeInit', () => {
      const HOME_KEY = makeStateKey<{ top: HomeAlbum[]; top_albums: HomeAlbum[] }>('homeData');

      it('should store data in TransferState when on server', () => {
        vi.spyOn(transferState, 'get').mockReturnValue(null);
        const setSpy = vi.spyOn(transferState, 'set');

        let result: { top: HomeAlbum[]; top_albums: HomeAlbum[] } | undefined;
        service.getHomeInit().subscribe(data => {
          result = data;
        });

        const req = httpMock.expectOne(environment.URL_SERVER + 'home_init');
        expect(req.request.method).toBe('GET');
        req.flush(mockHomeData);

        expect(setSpy).toHaveBeenCalledWith(HOME_KEY, mockHomeData);
        expect(result).toEqual(mockHomeData);
      });
    });
  });
});
