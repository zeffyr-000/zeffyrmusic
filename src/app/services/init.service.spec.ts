import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { InitService, PingResponse } from './init.service';
import { HomeAlbum } from '../models/album.model';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { Observable } from 'rxjs';

describe('InitService', () => {
  let service: InitService;
  let httpMock: HttpTestingController;
  let transferState: TransferState;

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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handlePingResponseSpy = vi.spyOn(service as any, 'handlePingResponse');

        const initPlaylistSpy = vi.spyOn(service.subjectInitializePlaylist, 'next');
        const connectedChangeSpy = vi.spyOn(service.subjectConnectedChange, 'next');

        service.getPing().subscribe(success => {
          expect(success).toBe(true);
        });

        expect(transferState.get).toHaveBeenCalledWith(PING_KEY, null);
        expect(transferState.remove).toHaveBeenCalledWith(PING_KEY);
        expect(handlePingResponseSpy).toHaveBeenCalledWith(mockPingResponse);

        expect(connectedChangeSpy).toHaveBeenCalled();
        expect(initPlaylistSpy).toHaveBeenCalled();

        httpMock.expectNone(environment.URL_SERVER + 'ping');
        httpMock.expectNone('/api/ping');

        expect(handlePingResponseSpy).toHaveBeenCalledTimes(1);
      });

      it('should reset user data when not connected', () => {
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

        const onChangeIsConnectedSpy = vi.spyOn(service, 'onChangeIsConnected');
        const subjectNextSpy = vi.spyOn(service.subjectInitializePlaylist, 'next');
        const connectedChangeSpy = vi.spyOn(service.subjectConnectedChange, 'next');

        service.getPing().subscribe(success => {
          expect(success).toBe(true);
        });

        const req = httpMock.expectOne(environment.URL_SERVER + 'ping');
        req.flush(mockDisconnectedResponse);

        expect(onChangeIsConnectedSpy).toHaveBeenCalled();

        expect(connectedChangeSpy).toHaveBeenCalledWith({
          isConnected: false,
          pseudo: '',
          idPerso: '',
          mail: '',
          darkModeEnabled: false,
          language: 'fr',
        });

        expect(subjectNextSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            listPlaylist: [],
            listFollow: [],
            listLikeVideo: [],
          })
        );

        expect(service.getIsConnected()).toBe(false);
      });

      it('should set user data when connected', () => {
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

        const onChangeIsConnectedSpy = vi.spyOn(service, 'onChangeIsConnected');
        const subjectNextSpy = vi.spyOn(service.subjectInitializePlaylist, 'next');

        service.getPing().subscribe(success => {
          expect(success).toBe(true);
        });

        const req = httpMock.expectOne(environment.URL_SERVER + 'ping');
        req.flush(mockConnectedResponse);

        expect(onChangeIsConnectedSpy).toHaveBeenCalled();

        expect(service.subjectConnectedChange.value).toEqual({
          isConnected: true,
          pseudo: 'testUser',
          idPerso: '123',
          mail: 'test@example.com',
          darkModeEnabled: true,
          language: 'en',
        });

        expect(subjectNextSpy).toHaveBeenCalledWith({
          listPlaylist: mockConnectedResponse.liste_playlist,
          listFollow: mockConnectedResponse.liste_suivi,
          listVideo: mockConnectedResponse.liste_video,
          tabIndex: mockConnectedResponse.tab_index,
          listLikeVideo: mockConnectedResponse.like_video,
        });

        expect(service.getIsConnected()).toBe(true);
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
          const setSpy = vi.spyOn(transferState, 'set');

          let result: { top: HomeAlbum[]; top_albums: HomeAlbum[] } | undefined;
          service.getHomeInit().subscribe(data => {
            result = data;
          });

          const req = httpMock.expectOne(environment.URL_SERVER + 'home_init');
          expect(req.request.method).toBe('GET');
          req.flush(mockHomeData);

          expect(result).toEqual(mockHomeData);

          expect(setSpy).not.toHaveBeenCalled();
        });
      });
    });

    describe('onChangeIsConnected', () => {
      it('should emit a new value on subjectConnectedChange', () => {
        vi.spyOn(service.subjectConnectedChange, 'next');

        service.onChangeIsConnected();

        expect(service.subjectConnectedChange.next).toHaveBeenCalledWith({
          isConnected: false,
          pseudo: '',
          idPerso: '',
          mail: '',
          darkModeEnabled: false,
          language: 'fr',
        });
      });
    });

    describe('loginSuccess', () => {
      it('should set isConnected to true and update pseudo and idPerso', () => {
        vi.spyOn(service, 'onChangeIsConnected');

        service.loginSuccess('test_pseudo', 'test_id_perso', 'test_mail', false, 'fr');

        expect(service['isConnected']).toBe(true);
        expect(service['pseudo']).toBe('test_pseudo');
        expect(service['idPerso']).toBe('test_id_perso');
        expect(service['mail']).toBe('test_mail');
        expect(service['darkModeEnabled']).toBe(false);
        expect(service['language']).toBe('fr');

        expect(service.onChangeIsConnected).toHaveBeenCalled();
      });
    });

    describe('logOut', () => {
      it('should set isConnected to false and clear pseudo and idPerso', () => {
        vi.spyOn(service, 'onChangeIsConnected');

        service.logOut();

        expect(service['isConnected']).toBe(false);
        expect(service['pseudo']).toBe('');
        expect(service['idPerso']).toBe('');

        expect(service.onChangeIsConnected).toHaveBeenCalled();
      });
    });

    describe('onMessageUnlog', () => {
      it('should emit a new value on subjectMessageUnlog and set isConnected to false', () => {
        vi.spyOn(service.subjectMessageUnlog, 'next');
        vi.spyOn(service, 'onChangeIsConnected');

        service.onMessageUnlog();

        expect(service.subjectMessageUnlog.next).toHaveBeenCalledWith(true);
        expect(service['isConnected']).toBe(false);

        expect(service.onChangeIsConnected).toHaveBeenCalled();
      });
    });

    describe('getHomeInit', () => {
      it('should fetch home init data', () => {
        const mockHomeInitData: { top: HomeAlbum[]; top_albums: HomeAlbum[] } = {
          top: [{ id: '1', titre: 'Test Album', description: 'Test Description', url_image: '' }],
          top_albums: [
            { id: '2', titre: 'Test Album 2', description: 'Test Description 2', url_image: '' },
          ],
        };

        service.getHomeInit().subscribe(data => {
          expect(data).toEqual(mockHomeInitData);
        });

        const req = httpMock.expectOne(environment.URL_SERVER + 'home_init');

        expect(req.request.method).toBe('GET');

        req.flush(mockHomeInitData);
      });
    });

    describe('getIsConnected', () => {
      it('should return boolean when changeIsConnectedCalled is true', () => {
        service['changeIsConnectedCalled'] = true;
        service['isConnected'] = true;

        const result = service.getIsConnected();
        expect(result).toBe(true);

        service['isConnected'] = false;

        const newResult = service.getIsConnected();
        expect(newResult).toBe(false);
      });

      it('should return Observable when changeIsConnectedCalled is false', () => {
        service['changeIsConnectedCalled'] = false;

        const result = service.getIsConnected();

        expect(result).toEqual(expect.any(Observable));

        vi.spyOn(service.subjectConnectedChange, 'asObservable');
        service.getIsConnected();
        expect(service.subjectConnectedChange.asObservable).toHaveBeenCalled();

        expect(service.subjectConnectedChange.value.isConnected).toBe(false);

        service['isConnected'] = true;
        service.onChangeIsConnected();

        expect(service.getIsConnected()).toBe(true);
      });

      it('should update to boolean return type after onChangeIsConnected is called', () => {
        service['changeIsConnectedCalled'] = false;

        const initialResult = service.getIsConnected();
        expect(initialResult).toEqual(expect.any(Observable));

        service.onChangeIsConnected();

        const afterResult = service.getIsConnected();
        expect(typeof afterResult).toBe('boolean');
      });

      it('should return an Observable that maps to isConnected value', () => {
        // Utiliser le service injecté via TestBed au lieu d'une instance manuelle
        const testService = TestBed.inject(InitService);

        // S'assurer explicitement que changeIsConnectedCalled est false
        testService['changeIsConnectedCalled'] = false;

        // Forcer une valeur spécifique dans le BehaviorSubject
        testService.subjectConnectedChange.next({
          isConnected: true,
          pseudo: 'test',
          idPerso: '123',
          mail: 'test@example.com',
          darkModeEnabled: false,
          language: 'fr',
        });

        // Obtenir le résultat de getIsConnected() et vérifier son type
        const result = testService.getIsConnected();
        expect(result instanceof Observable).toBe(true);

        // Utiliser subscribe pour vérifier la valeur
        if (result instanceof Observable) {
          result.subscribe(value => {
            expect(value).toBe(true);
          });
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (globalThis as any).fail('Expected Observable but got boolean');
        }
      });
    });

    it('should return the correct connection status', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).isConnected = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).changeIsConnectedCalled = true;
      expect(service.getIsConnected()).toBe(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).isConnected = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).changeIsConnectedCalled = true;
      expect(service.getIsConnected()).toBe(false);
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
