import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { TranslocoTestingModule, TranslocoConfig, TRANSLOCO_CONFIG, TranslocoService } from '@ngneat/transloco';
import { environment } from '../../environments/environment';
import { InitService, PingResponse } from './init.service';

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
      imports: [
        HttpClientTestingModule,
        TranslocoTestingModule.forRoot({
          langs: { en: { meta_description: 'META_DESCRIPTION', title: 'TITLE' }, fr: { meta_description: 'META_DESCRIPTION_FR', title: 'TITLE_FR' } }
        }),],
      providers: [
        InitService,
        {
          provide: DOCUMENT,
          useValue: documentMock,
        },
        {
          provide: TRANSLOCO_CONFIG, useValue: {
            reRenderOnLangChange: true,
            availableLangs: ['en', 'fr'],
            defaultLang: 'en',
            prodMode: false,
          } as TranslocoConfig
        }
      ],
    }).compileComponents();

    service = TestBed.inject(InitService);
    httpMock = TestBed.inject(HttpTestingController);
    translocoService = TestBed.inject(TranslocoService);
    translocoService.setDefaultLang('en');
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
            artists: [{ id_artiste: 'test_id_artiste', label: 'test_nom_artiste' }],
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
            artists: [{ id_artiste: 'test_id_artiste2', label: 'test_nom_artiste2' }],
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

      /*
      expect(service.subjectConnectedChange).toEqual(
        new BehaviorSubject({
          isConnected: true,
          pseudo: 'test_pseudo',
          idPerso: 'test_id_perso',
          mail: 'test_mail',
        })
      );

      expect(service.subjectInitializePlaylist).toEqual(
        new Subject<{
          listPlaylist: UserPlaylist[];
          listFollow: FollowItem[];
          listVideo: Video[];
          tabIndex: number[];
          listLikeVideo: UserVideo[];
        }>()
      );
      */
    });

    it('should set isConnected to false and initialize playlist when server returns invalid data', () => {
      const pingResponse: PingResponse = {
        est_connecte: false,
        pseudo: '',
        id_perso: '',
        mail: '',
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
        expect(value).toEqual({ isConnected: false, pseudo: '', idPerso: '', mail: '' });
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
      });
    });
  });

  describe('loginSuccess', () => {
    it('should set isConnected to true and update pseudo and idPerso', () => {
      spyOn(service, 'onChangeIsConnected');

      service.loginSuccess('test_pseudo', 'test_id_perso');

      expect(service['isConnected']).toBeTrue();
      expect(service['pseudo']).toBe('test_pseudo');
      expect(service['idPerso']).toBe('test_id_perso');

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
});