import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { BehaviorSubject, of } from 'rxjs';
import { PlaylistComponent } from './playlist.component';
import { environment } from 'src/environments/environment';
import { InitService } from '../services/init.service';
import { PlayerService } from '../services/player.service';
import { FollowItem } from '../models/follow.model';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { UserVideo, Video } from '../models/video.model';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { getTranslocoModule } from '../transloco-testing.module';
import { TranslocoService } from '@jsverse/transloco';
import { Playlist } from '../models/playlist.model';

describe('PlaylistComponent', () => {
  let component: PlaylistComponent;
  let fixture: ComponentFixture<PlaylistComponent>;
  let titleService: Title;
  let translocoService: TranslocoService;
  let googleAnalyticsService: GoogleAnalyticsService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let initService: InitService;
  let playerService: PlayerService;
  let metaService: Meta;
  let activatedRouteMock: jasmine.SpyObj<ActivatedRoute>;
  const mockPlaylistData = {
    id_playlist: '1',
    title: 'title',
    description: 'description',
    est_suivi: false,
    id_top: '1',
    img_big: 'img_big',
    liste_video: ['1', '2', '3'],
    str_index: [1, 2, 3],
    tab_video: [{ id_video: '1', title: 'title', artist: 'artist', id_artist: '1', img: 'img', duration: 'duration' }],
    est_prive: undefined as boolean,
    titre: 'titre',
    artiste: 'artiste',
    id_artiste: '1'
  };


  beforeEach(async () => {
    const metaServiceMock = jasmine.createSpyObj('Meta', ['updateTag']);
    const initServiceMock = jasmine.createSpyObj('InitService', ['init']);
    const playerServiceMock = jasmine.createSpyObj('PlayerService', [
      'launchYTApi',
      'lecture',
      'removeToPlaylist',
      'switchFollow',
      'runPlaylist',
      'addInCurrentList',
      'addVideoInPlaylist',
      'removeVideo',
      'addInCurrentList',
      'addVideoAfterCurrentInList',
      'onPlayPause'
    ]);
    initServiceMock.subjectConnectedChange = new BehaviorSubject({ isConnected: true, pseudo: 'test-pseudo', idPerso: 'test-idPerso', mail: 'test-mail' });
    playerServiceMock.subjectCurrentPlaylistChange = new BehaviorSubject([]);
    playerServiceMock.subjectCurrentKeyChange = new BehaviorSubject({ currentKey: 'test-key', currentTitle: 'test-title', currentArtist: 'test-artist' });
    playerServiceMock.subjectListFollow = new BehaviorSubject([]);
    playerServiceMock.subjectListLikeVideo = new BehaviorSubject([]);
    playerServiceMock.subjectIsPlayingChange = new BehaviorSubject(false);
    activatedRouteMock = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        paramMap: { get: () => '1' },
        url: [{ path: 'top' }]
      },
      params: new BehaviorSubject({ id: '1' }),
    });

    await TestBed.configureTestingModule({
      declarations: [PlaylistComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [getTranslocoModule()],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        {
          provide: GoogleAnalyticsService,
          useValue: {
            pageView: () => { },
          },
        },
        {
          provide: InitService,
          useValue: initServiceMock,
        },
        {
          provide: PlayerService,
          useValue: playerServiceMock,
        },
        {
          provide: Meta,
          useValue: metaServiceMock,
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    translocoService = TestBed.inject(TranslocoService);
    translocoService.setDefaultLang('en');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaylistComponent);
    component = fixture.componentInstance;
    titleService = TestBed.inject(Title);
    translocoService = TestBed.inject(TranslocoService);
    googleAnalyticsService = TestBed.inject(GoogleAnalyticsService);
    initService = TestBed.inject(InitService);
    playerService = TestBed.inject(PlayerService);
    metaService = TestBed.inject(Meta);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe to subjectListFollow', () => {
    component.initLoad();
    expect(component.subscriptionChangeFollow).toBeDefined();
  });

  it('should update isFollower when subjectListFollow emits', () => {
    const listFollow = [{ id_playlist: '1', titre: 'titre' }] as FollowItem[];
    const fixture = TestBed.createComponent(PlaylistComponent);
    const component = fixture.componentInstance;

    component.idPlaylist = '1'; // Initialisez idPlaylist avant d'émettre une nouvelle valeur à partir de subjectListFollow

    fixture.detectChanges(); // Initialise le composant

    playerService.subjectListFollow.next(listFollow);

    expect(component.isFollower).toBeTrue();
  });

  it('should call loadLike when url path is "like"', () => {
    const loadLikeSpy = spyOn(component, 'loadLike');
    activatedRouteMock.snapshot.url[0].path = 'like';
    component.initLoad();
    expect(loadLikeSpy).toHaveBeenCalled();
  });

  it('should call loadPlaylist with correct url when url path is not "like"', () => {
    const loadPlaylistSpy = spyOn(component, 'loadPlaylist');
    component.idPlaylist = null;

    // Mock ActivatedRoute
    const activatedRoute = fixture.debugElement.injector.get(ActivatedRoute);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activatedRoute.snapshot.url = [{ path: 'top' }] as any;
    activatedRoute.snapshot.paramMap.get = (value) => value === 'id_playlist' ? null : '1';

    fixture.detectChanges(); // Initialise le composant

    component.initLoad();
    expect(loadPlaylistSpy).toHaveBeenCalledWith(environment.URL_SERVER + 'json/top/1');
  });

  it('should call loadPlaylist with correct url when url path is playlist', () => {
    const loadPlaylistSpy = spyOn(component, 'loadPlaylist');
    component.idPlaylist = null;

    // Mock ActivatedRoute
    const activatedRoute = fixture.debugElement.injector.get(ActivatedRoute);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activatedRoute.snapshot.url = [{ path: 'playlist' }] as any;
    activatedRoute.snapshot.paramMap.get = () => null;

    fixture.detectChanges(); // Initialise le composant

    component.initLoad();
    expect(loadPlaylistSpy).toHaveBeenCalledWith('');
  });

  it('should return immediately when listFollow is null or undefined', () => {
    const listFollow = undefined as FollowItem[];
    const fixture = TestBed.createComponent(PlaylistComponent);
    const component = fixture.componentInstance;

    component.idPlaylist = '1'; // Initialisez idPlaylist avant d'émettre une nouvelle valeur à partir de subjectListFollow

    fixture.detectChanges(); // Initialise le composant

    playerService.subjectListFollow.next(listFollow);

    expect(component.isFollower).toBeFalse();
  });

  it('should call httpClient.get with the correct url and update properties when loadPlaylist is called', () => {
    const httpClient = TestBed.inject(HttpClient);
    const httpClientSpy = spyOn(httpClient, 'get').and.returnValue(of(mockPlaylistData));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const titleServiceSpy = spyOn(titleService, 'setTitle');
    const googleAnalyticsServiceSpy = spyOn(googleAnalyticsService, 'pageView');
    const url = environment.URL_SERVER + 'json/playlist/1';

    // Mock ActivatedRoute
    const activatedRoute = fixture.debugElement.injector.get(ActivatedRoute);

    component.loadPlaylist(url);

    expect(httpClientSpy).toHaveBeenCalledWith(url, environment.httpClientConfig);
    expect(component.isPrivate).toBeFalse();
    expect(component.idPlaylist).toEqual(mockPlaylistData.id_playlist);
    // Vérifiez les autres propriétés de la même manière
    //expect(titleServiceSpy).toHaveBeenCalledWith(mockPlaylistData.title + ' - Zeffyr Music');
    expect(metaService.updateTag).toHaveBeenCalled();
    expect(googleAnalyticsServiceSpy).toHaveBeenCalledWith(activatedRoute.snapshot.url.join('/'));
  });

  it('private', () => {
    const mockPlaylistDataPrivate = { ...mockPlaylistData, est_prive: true };

    const httpClient = TestBed.inject(HttpClient);
    const httpClientSpy = spyOn(httpClient, 'get').and.returnValue(of(mockPlaylistDataPrivate));
    const googleAnalyticsServiceSpy = spyOn(googleAnalyticsService, 'pageView');
    const url = environment.URL_SERVER + 'json/playlist/1';

    // Mock ActivatedRoute
    const activatedRoute = fixture.debugElement.injector.get(ActivatedRoute);

    component.loadPlaylist(url);

    expect(httpClientSpy).toHaveBeenCalledWith(url, environment.httpClientConfig);
    expect(component.isPrivate).toBeTrue();
    // Vérifiez les autres propriétés de la même manière
    expect(googleAnalyticsServiceSpy).toHaveBeenCalledWith(activatedRoute.snapshot.url.join('/'));
  });

  it('share title', () => {
    const mockPlaylistDataTitle = { ...mockPlaylistData, titre: undefined as string };

    const httpClient = TestBed.inject(HttpClient);
    const httpClientSpy = spyOn(httpClient, 'get').and.returnValue(of(mockPlaylistDataTitle));
    const titleServiceSpy = spyOn(titleService, 'setTitle');
    const googleAnalyticsServiceSpy = spyOn(googleAnalyticsService, 'pageView');
    const url = environment.URL_SERVER + 'json/playlist/1';

    // Mock ActivatedRoute
    const activatedRoute = fixture.debugElement.injector.get(ActivatedRoute);

    component.loadPlaylist(url);

    expect(httpClientSpy).toHaveBeenCalledWith(url, environment.httpClientConfig);
    expect(component.isPrivate).toBeFalse();
    expect(component.idPlaylist).toEqual(mockPlaylistData.id_playlist);
    // Vérifiez les autres propriétés de la même manière
    expect(titleServiceSpy).toHaveBeenCalledWith('title - The Must-Haves of the Moment | Zeffyr Music');
    //expect(metaService.updateTag).toHaveBeenCalledWith({ name: 'og:description', content: 'description_partage_playlist' });
    expect(googleAnalyticsServiceSpy).toHaveBeenCalledWith(activatedRoute.snapshot.url.join('/'));
  });

  it('url empty', () => {
    const httpClient = TestBed.inject(HttpClient);
    const httpClientSpy = spyOn(httpClient, 'get').and.returnValue(of(mockPlaylistData));
    const url = '';
    component.idPlaylist = '1';


    component.loadPlaylist(url);

    expect(httpClientSpy).toHaveBeenCalledWith(environment.URL_SERVER + 'json/playlist/1', environment.httpClientConfig);
  });

  it('no description', () => {
    const httpClient = TestBed.inject(HttpClient);
    const httpClientSpy = spyOn(httpClient, 'get').and.returnValue(of({ ...mockPlaylistData, description: undefined }));
    const url = environment.URL_SERVER + 'json/playlist/1';
    component.idPlaylist = '1';

    component.loadPlaylist(url);

    expect(httpClientSpy).toHaveBeenCalledWith(environment.URL_SERVER + 'json/playlist/1', environment.httpClientConfig);
    expect(component.description).toEqual('');
  });


  it('should initialize properties and call services with correct arguments when loadLike is called', () => {
    const titleServiceSpy = spyOn(titleService, 'setTitle');
    const googleAnalyticsServiceSpy = spyOn(googleAnalyticsService, 'pageView');
    const subjectListLikeVideoSubscribeSpy = spyOn(playerService.subjectListLikeVideo, 'subscribe');

    // Mock ActivatedRoute
    const activatedRoute = fixture.debugElement.injector.get(ActivatedRoute);

    component.loadLike();

    expect(component.isPrivate).toBeFalse();
    expect(component.idPlaylist).toEqual('');
    // Vérifiez les autres propriétés de la même manière
    expect(subjectListLikeVideoSubscribeSpy).toHaveBeenCalled();
    expect(titleServiceSpy).toHaveBeenCalledWith(translocoService.translate('mes_likes') + ' - Zeffyr Music');
    expect(metaService.updateTag).toHaveBeenCalled();
    expect(googleAnalyticsServiceSpy).toHaveBeenCalledWith(activatedRoute.snapshot.url.join('/'));
  });

  it('should update playlist when subjectListLikeVideo emits', () => {
    const mockListLikeVideo = [
      {
        id: '1',
        key: 'XXX1',
        titre: 'Titre 1',
        duree: '100',
        artiste: 'Artist 1'
      },
      {
        id: '2',
        key: 'XXX2',
        titre: 'Titre 2',
        duree: '200',
        artiste: 'Artist 2'
      }
    ] as UserVideo[];

    component.loadLike();
    playerService.subjectListLikeVideo.next(mockListLikeVideo);
    expect(component.playlist.length).toEqual(2);

    playerService.subjectListLikeVideo.next(null);
    expect(component.playlist.length).toEqual(2);
  });

  it('should call playerService.switchFollow with correct arguments when switchFollow is called', () => {
    component.idPlaylist = 'testId';
    component.titre = 'testTitle';
    component.artist = 'testArtist';
    component.imgBig = 'testImgBig';

    component.switchFollow();

    expect(playerService.switchFollow).toHaveBeenCalledWith('testId', 'testTitle', 'testArtist', 'testImgBig');
  });

  it('should call playerService.runPlaylist with correct arguments when runPlaylist is called', () => {
    const playlistData = [{
      id_video: '1',
      artiste: 'Artiste 1',
      artists: [{ id_artist: '1', label: 'Artiste 1' }],
      duree: '100',
      id_playlist: '1',
      key: 'XXX-XXX',
      ordre: '1',
      titre: 'Titre 1',
      titre_album: 'Titre album 1'
    }] as Video[];
    component.playlist = playlistData;

    component.runPlaylist(0);

    expect(playerService.runPlaylist).toHaveBeenCalledWith(playlistData, 0, null);
  });

  it('should call playerService.runPlaylist without arguments', () => {
    const playlistData = [{
      id_video: '1',
      artiste: 'Artiste 1',
      artists: [{ id_artist: '1', label: 'Artiste 1' }],
      duree: '100',
      id_playlist: '1',
      key: 'XXX-XXX',
      ordre: '1',
      titre: 'Titre 1',
      titre_album: 'Titre album 1'
    }] as Video[];
    component.playlist = playlistData;
    component.runPlaylist();

    expect(playerService.runPlaylist).toHaveBeenCalledWith(playlistData, 0, null);
  });

  it('should call playerService.addInCurrentList with correct arguments when addInCurrentList is called', () => {
    const playlistData = [{
      id_video: '1',
      artiste: 'Artiste 1',
      artists: [{ id_artist: '1', label: 'Artiste 1' }],
      duree: '100',
      id_playlist: '1',
      key: 'XXX-XXX',
      ordre: '1',
      titre: 'Titre 1',
      titre_album: 'Titre album 1'
    }] as Video[];
    component.playlist = playlistData;

    component.addInCurrentList();

    expect(playerService.addInCurrentList).toHaveBeenCalledWith(playlistData, null);
  });

  it('should call playerService.addVideoInPlaylist with correct arguments when addVideo is called', () => {
    component.addVideo('testKey', 'testArtist', 'testTitle', 100);

    expect(playerService.addVideoInPlaylist).toHaveBeenCalledWith('testKey', 'testArtist', 'testTitle', 100);
  });

  it('should call playerService.removeVideo with correct arguments when removeVideo is called', () => {
    component.removeVideo('testIdVideo');

    expect(playerService.removeVideo).toHaveBeenCalledWith('testIdVideo', jasmine.any(Function));
  });

  it('should call playerService.addVideoAfterCurrentInList with correct arguments when addVideoAfterCurrentInList is called', () => {
    const videoData = {
      id_video: '1',
      artiste: 'Artiste 1',
      artists: [{ id_artist: '1', label: 'Artiste 1' }],
      duree: '100',
      id_playlist: '1',
      key: 'XXX-XXX',
      ordre: '1',
      titre: 'Titre 1',
      titre_album: 'Titre album 1'
    } as Video;

    component.addVideoAfterCurrentInList(videoData);

    expect(playerService.addVideoAfterCurrentInList).toHaveBeenCalledWith(videoData);
  });

  it('should call playerService.addInCurrentList with correct arguments when addVideoInEndCurrentList is called', () => {
    const videoData = {
      id_video: '1',
      artiste: 'Artiste 1',
      artists: [{ id_artist: '1', label: 'Artiste 1' }],
      duree: '100',
      id_playlist: '1',
      key: 'XXX-XXX',
      ordre: '1',
      titre: 'Titre 1',
      titre_album: 'Titre album 1'
    } as Video;

    component.addVideoInEndCurrentList(videoData);

    expect(playerService.addInCurrentList).toHaveBeenCalledWith([videoData], null);
  });

  it('should return correct duration when sumDurationPlaylist is called with playlist', () => {
    component.playlist = [
      { duree: '120' } as Video,
      { duree: '240' } as Video,
      { duree: '3600' } as Video
    ];

    const result = component.sumDurationPlaylist();

    expect(result).toEqual('1 h 6 min');
  });

  it('should return empty string when sumDurationPlaylist is called without playlist', () => {
    component.playlist = undefined;

    const result = component.sumDurationPlaylist();

    expect(result).toEqual('');
  });

  it('should return correct duration when sumDurationPlaylist is called with playlist without hours', () => {
    component.playlist = [
      { duree: '120' } as Video,
      { duree: '240' } as Video
    ];

    const result = component.sumDurationPlaylist();

    expect(result).toEqual('6 min');
  });

  it('should pause the playlist', () => {
    component.pausePlaylist();
    expect(playerService.onPlayPause).toHaveBeenCalled();
  });

  it('should generate top description when id_top is defined', () => {
    const data: Playlist = {
      id_playlist: '1',
      id_perso: '1',
      description: 'description',
      est_suivi: false,
      id_top: '1',
      title: 'Top Title',
      img_big: 'img_big',
      liste_video: ['1', '2', '3'],
      str_index: [1, 2, 3],
      tab_video: [{
        id_video: '1',
        artiste: 'Artiste 1',
        artists: [],
        duree: '100',
        id_playlist: '1',
        key: 'XXX-XXX',
        ordre: '1',
        titre: 'Titre 1',
        titre_album: 'Titre album 1'
      }],
    };
    expect(component.getMetaDescription(data)).toBe('Discover "{title}", {description}. Enjoy {count, plural, =1 {one must-hear track} other {# must-hear tracks}}. Listen now!');
  });

  /*
  it('should generate album description when artiste and titre are defined', () => {
    const data: Playlist = {
      id_playlist: '1',
      id_perso: '1',
      description: 'description',
      est_suivi: false,
      title: 'Playlist Title',
      artiste: 'Artiste 1',
      titre: 'Titre 1',
      img_big: 'img_big',
      year: 2021,
      liste_video: ['1', '2', '3'],
      str_index: [1, 2, 3],
      tab_video: [{
        id_video: '1',
        artiste: 'Artiste 1',
        artists: [],
        duree: '100',
        id_playlist: '1',
        key: 'XXX-XXX',
        ordre: '1',
        titre: 'Titre 1',
        titre_album: 'Titre album 1'
      }],
    };
    expect(component.getMetaDescription(data)).toBe('Discover the album "{title}" by {artist}, released in {year}. Enjoy {count, plural, =1 {one captivating track} other {# captivating tracks}}. Listen now!');
  });

  it('should generate album description when titre are defined', () => {
    const data: Playlist = {
      id_playlist: '1',
      id_perso: '1',
      description: 'description',
      est_suivi: false,
      title: 'Playlist Title',
      artiste: '',
      titre: 'Titre 1',
      img_big: 'img_big',
      year: 2021,
      liste_video: ['1', '2', '3'],
      str_index: [1, 2, 3],
      tab_video: [{
        id_video: '1',
        artiste: 'Artiste 1',
        artists: [],
        duree: '100',
        id_playlist: '1',
        key: 'XXX-XXX',
        ordre: '1',
        titre: 'Titre 1',
        titre_album: 'Titre album 1'
      }],
    };
    expect(component.getMetaDescription(data)).toBe('Dive into "{title}", a {year} album with {count, plural, =1 {one electrifying track} other {# electrifying tracks}}. Explore the album now!');
  });
  */

  it('should generate playlist description when neither id_top nor artiste and titre are defined', () => {
    const data: Playlist = {
      id_playlist: '1',
      id_perso: '1',
      description: 'description',
      est_suivi: false,
      title: 'Playlist Title',
      img_big: 'img_big',
      liste_video: ['1', '2', '3'],
      str_index: [1, 2, 3],
      tab_video: [{
        id_video: '1',
        artiste: 'Artiste 1',
        artists: [],
        duree: '100',
        id_playlist: '1',
        key: 'XXX-XXX',
        ordre: '1',
        titre: 'Titre 1',
        titre_album: 'Titre album 1'
      }],
    };
    expect(component.getMetaDescription(data)).toBe('Discover the playlist "{title}". Enjoy {count, plural, =1 {one carefully selected track} other {# carefully selected tracks}}. Listen now!');
  });

  it('should display the default image when img_big is not defined', () => {
    const mockPlaylistDataImageDefault = { ...mockPlaylistData, img_big: undefined as string };

    const httpClient = TestBed.inject(HttpClient);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const httpClientSpy = spyOn(httpClient, 'get').and.returnValue(of(mockPlaylistDataImageDefault));
    const url = environment.URL_SERVER + 'json/playlist/1';

    // Mock ActivatedRoute
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const activatedRoute = fixture.debugElement.injector.get(ActivatedRoute);

    component.loadPlaylist(url);

    expect(component.imgBig).toBe('assets/img/default.jpg');
  });

  it('should assign title from data', () => {
    const data = { title: 'Test Title' } as Playlist;
    component.title = data.title;

    const title = component.getMetaTitle(data);

    expect(title).toBe('Test Title');
  });
});