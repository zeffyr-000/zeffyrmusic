import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';
import { environment } from '../../environments/environment';
import { InitService, PingResponse } from './init.service';
import { HomeAlbum } from '../models/album.model';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { getTranslocoModule } from '../transloco-testing.module';

describe('InitService', () => {
  let service: InitService;
  let httpMock: HttpTestingController;
  let documentMock: Partial<Document>;
  let translocoService: TranslocoService;

  beforeEach(async () => {
    documentMock = {
      querySelector: () => ({
        setAttribute: () => { },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      querySelectorAll: () => [] as any,
    };

    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      providers: [
        InitService,
        {
          provide: DOCUMENT,
          useValue: documentMock,
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    service = TestBed.inject(InitService);
    httpMock = TestBed.inject(HttpTestingController);
    translocoService = TestBed.inject(TranslocoService);
    translocoService.setDefaultLang('fr');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPing', () => {
    it('should set isConnected to true and initialize playlist when server returns valid data', () => {
      const pingResponse: PingResponse = {
        est_connecte: true,
        pseudo: 'test_pseudo',
        id_perso: 'test_id_perso',
        mail: 'test_mail',
        dark_mode_enabled: false,
        language: 'fr',
        liste_playlist: [
          {
            id_playlist: '1',
            titre: 'test_playlist',
            prive: false,
          },
          {
            id_playlist: '2',
            titre: 'test_playlist',
            prive: true,
          }
        ],
        liste_suivi: [
          {
            id_playlist: '1',
            titre: 'test_playlist',
          },
          {
            id_playlist: '2',
            titre: 'test_playlist',
          }
        ],
        like_video: [
          {
            id: '1',
            key: 'test_key',
            titre: 'test_titre',
            duree: '100',
            artiste: 'test_artiste'
          },
          {
            id: '2',
            key: 'test_key2',
            titre: 'test_titre2',
            duree: '100',
            artiste: 'test_artiste2'
          },
        ],
        liste_video: [
          {
            id_video: '1',
            artiste: 'test_artiste',
            artists: [{ id_artist: 'test_id_artiste', label: 'test_nom_artiste' }],
            duree: '100',
            id_playlist: '1',
            key: 'test_key',
            ordre: '1',
            titre: 'test_titre',
            titre_album: 'test_titre_album',
          },
          {
            id_video: '2',
            artiste: 'test_artiste2',
            artists: [{ id_artist: 'test_id_artiste2', label: 'test_nom_artiste2' }],
            duree: '100',
            id_playlist: '2',
            key: 'test_key2',
            ordre: '2',
            titre: 'test_titre2',
            titre_album: 'test_titre_album2',
          }
        ],
        tab_index: [1, 2, 3],
        tab_video: ['test_tab_video'],
      };

      service.getPing();

      const req = httpMock.expectOne(`${environment.URL_SERVER}ping`);
      expect(req.request.method).toBe('GET');
      req.flush(pingResponse);

      expect(service['isConnected']).toBeTrue();
      expect(service['pseudo']).toBe('test_pseudo');
      expect(service['idPerso']).toBe('test_id_perso');
      expect(service['mail']).toBe('test_mail');
    });

    it('should set isConnected to false and initialize playlist when server returns invalid data', () => {
      const pingResponse: PingResponse = {
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

      service.getPing();

      const req = httpMock.expectOne(`${environment.URL_SERVER}ping`);
      expect(req.request.method).toBe('GET');
      req.flush(pingResponse);

      expect(service['isConnected']).toBeFalse();
      expect(service['pseudo']).toBe('');
      expect(service['idPerso']).toBe('');
      expect(service['mail']).toBe('');

      service.subjectConnectedChange.subscribe(value => {
        expect(value).toEqual({ isConnected: false, pseudo: '', idPerso: '', mail: '', darkModeEnabled: false, language: 'fr', pingInitialized: true });
      });
      service.subjectInitializePlaylist.subscribe(value => {
        expect(value).toEqual({
          listPlaylist: [],
          listFollow: [],
          listVideo: [],
          tabIndex: [],
          listLikeVideo: [],
        });
      });
    });
  });

  describe('onChangeIsConnected', () => {
    it('should emit a new value on subjectConnectedChange', () => {
      spyOn(service.subjectConnectedChange, 'next');

      service.onChangeIsConnected();

      expect(service.subjectConnectedChange.next).toHaveBeenCalledWith({
        isConnected: false,
        pseudo: '',
        idPerso: '',
        mail: '',
        darkModeEnabled: false,
        language: 'fr',
        pingInitialized: false,
      });
    });
  });

  describe('loginSuccess', () => {
    it('should set isConnected to true and update pseudo and idPerso', () => {
      spyOn(service, 'onChangeIsConnected');

      service.loginSuccess('test_pseudo', 'test_id_perso', 'test_mail', false, 'fr');

      expect(service['isConnected']).toBeTrue();
      expect(service['pseudo']).toBe('test_pseudo');
      expect(service['idPerso']).toBe('test_id_perso');
      expect(service['mail']).toBe('test_mail');
      expect(service['darkModeEnabled']).toBeFalse();
      expect(service['language']).toBe('fr');
      expect(service['pingInitialized']).toBeFalse();

      expect(service.onChangeIsConnected).toHaveBeenCalled();
    });
  });

  describe('logOut', () => {
    it('should set isConnected to false and clear pseudo and idPerso', () => {
      spyOn(service, 'onChangeIsConnected');

      service.logOut();

      expect(service['isConnected']).toBeFalse();
      expect(service['pseudo']).toBe('');
      expect(service['idPerso']).toBe('');

      expect(service.onChangeIsConnected).toHaveBeenCalled();
    });
  });

  describe('onMessageUnlog', () => {
    it('should emit a new value on subjectMessageUnlog and set isConnected to false', () => {
      spyOn(service.subjectMessageUnlog, 'next');
      spyOn(service, 'onChangeIsConnected');

      service.onMessageUnlog();

      expect(service.subjectMessageUnlog.next).toHaveBeenCalledWith(true);
      expect(service['isConnected']).toBeFalse();

      expect(service.onChangeIsConnected).toHaveBeenCalled();
    });
  });

  describe('getHomeInit', () => {
    it('should fetch home init data', () => {
      const mockHomeInitData: { top: HomeAlbum[], top_albums: HomeAlbum[] } = {
        top: [{ id: '1', titre: 'Test Album', description: 'Test Description', url_image: '' }],
        top_albums: [{ id: '2', titre: 'Test Album 2', description: 'Test Description 2', url_image: '' }]
      };

      service.getHomeInit().subscribe(data => {
        expect(data).toEqual(mockHomeInitData);
      });

      const req = httpMock.expectOne(environment.URL_SERVER + 'home_init');

      expect(req.request.method).toBe('GET');

      req.flush(mockHomeInitData);
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