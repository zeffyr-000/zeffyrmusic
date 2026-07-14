import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { InitService, PingResponse } from './init.service';
import { HomeAlbum } from '../models/album.model';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { AuthStore } from '../store';
import { UserDataStore } from '../store/user-data/user-data.store';
import { QueueStore } from '../store/queue/queue.store';
import { UiStore } from '../store/ui/ui.store';
import { provideRouter, Router } from '@angular/router';
import { routes } from '../app.routes';
import { provideHttpTesting } from '../testing/http-testing';

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
    is_admin: false,
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
          ...provideHttpTesting(),
          provideRouter(routes),
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

        expect(transferState.get).toHaveBeenCalledWith(PING_KEY, undefined);
        expect(transferState.remove).toHaveBeenCalledWith(PING_KEY);
        expect(handlePingResponseSpy).toHaveBeenCalledWith(mockPingResponse);
        expect(initializeSpy).toHaveBeenCalled();

        expect(httpMock.match(environment.URL_SERVER + 'ping')).toHaveLength(0);
      });

      it('should call authStore.initializeAnonymous when not connected', () => {
        const mockDisconnectedResponse: PingResponse = {
          est_connecte: false,
          pseudo: '',
          id_perso: '',
          mail: '',
          is_admin: false,
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
          is_admin: true,
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
              artists: [{ id_artist: '1', label: 'Artist 1' }],
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
          { pseudo: 'testUser', idPerso: '123', mail: 'test@example.com', isAdmin: true },
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

    describe('onMessageUnlog', () => {
      it('should show warning toast, logout and reset userDataStore', () => {
        const uiStore = TestBed.inject(UiStore);
        const showWarningSpy = vi.spyOn(uiStore, 'showWarning');
        const logoutSpy = vi.spyOn(authStore, 'logout');
        const resetSpy = vi.spyOn(userDataStore, 'reset');

        service.onMessageUnlog();

        expect(showWarningSpy).toHaveBeenCalledWith(expect.any(String), 8000);
        expect(logoutSpy).toHaveBeenCalled();
        expect(resetSpy).toHaveBeenCalled();
      });

      it('should redirect to / when on a protected route', () => {
        const router = TestBed.inject(Router);
        vi.spyOn(router, 'url', 'get').mockReturnValue('/settings');
        const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

        service.onMessageUnlog();

        expect(navigateSpy).toHaveBeenCalledWith(['/']);
      });

      it('should not redirect when on a public route', () => {
        const router = TestBed.inject(Router);
        vi.spyOn(router, 'url', 'get').mockReturnValue('/search/test');
        const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

        service.onMessageUnlog();

        expect(navigateSpy).not.toHaveBeenCalled();
      });
    });

    describe('checkSessionIfNeeded', () => {
      const SIX_MINUTES = 6 * 60 * 1000;

      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should not ping if user is not authenticated', () => {
        authStore.initializeAnonymous();

        service.checkSessionIfNeeded();

        expect(httpMock.match(environment.URL_SERVER + 'ping')).toHaveLength(0);
      });

      it('should not ping if last check was recent', () => {
        // Bootstrap with authenticated user to set lastSessionCheck
        service.getPing().subscribe();
        const req = httpMock.expectOne(environment.URL_SERVER + 'ping');
        req.flush(mockPingResponse);

        // Immediately check again — should be throttled
        service.checkSessionIfNeeded();

        expect(httpMock.match(environment.URL_SERVER + 'ping')).toHaveLength(0);
      });

      it('should ping and call onMessageUnlog when est_connecte is false', () => {
        authStore.login(
          { pseudo: 'test', idPerso: '1', mail: 'a@b.com', isAdmin: false },
          { darkModeEnabled: false, language: 'fr' }
        );
        // Advance time beyond SESSION_CHECK_INTERVAL to make lastSessionCheck stale
        vi.advanceTimersByTime(SIX_MINUTES);

        const onMessageUnlogSpy = vi.spyOn(service, 'onMessageUnlog');

        service.checkSessionIfNeeded();

        const req = httpMock.expectOne(environment.URL_SERVER + 'ping');
        req.flush({ est_connecte: false });

        expect(onMessageUnlogSpy).toHaveBeenCalled();
      });

      it('should ping and update lastSessionCheck when est_connecte is true', () => {
        authStore.login(
          { pseudo: 'test', idPerso: '1', mail: 'a@b.com', isAdmin: false },
          { darkModeEnabled: false, language: 'fr' }
        );
        vi.advanceTimersByTime(SIX_MINUTES);

        service.checkSessionIfNeeded();

        const req = httpMock.expectOne(environment.URL_SERVER + 'ping');
        req.flush({ est_connecte: true });

        // A second call immediately after should be throttled (lastSessionCheck was updated)
        service.checkSessionIfNeeded();
        expect(httpMock.match(environment.URL_SERVER + 'ping')).toHaveLength(0);
      });

      it('should not force logout on network error but update throttle', () => {
        authStore.login(
          { pseudo: 'test', idPerso: '1', mail: 'a@b.com', isAdmin: false },
          { darkModeEnabled: false, language: 'fr' }
        );
        vi.advanceTimersByTime(SIX_MINUTES);

        const onMessageUnlogSpy = vi.spyOn(service, 'onMessageUnlog');

        service.checkSessionIfNeeded();

        const req = httpMock.expectOne(environment.URL_SERVER + 'ping');
        req.error(new ErrorEvent('Network error'));

        expect(onMessageUnlogSpy).not.toHaveBeenCalled();

        // A second call immediately after should be throttled (lastSessionCheck was updated on error)
        service.checkSessionIfNeeded();
        expect(httpMock.match(environment.URL_SERVER + 'ping')).toHaveLength(0);
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
          ...provideHttpTesting(),
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
