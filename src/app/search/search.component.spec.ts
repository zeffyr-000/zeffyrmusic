import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { BehaviorSubject, of } from 'rxjs';
import { SearchResults1, SearchResults2, SearchResults3 } from '../models/search.model';
import { InitService } from '../services/init.service';
import { PlayerService } from '../services/player.service';
import { SearchComponent } from './search.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { SearchService } from '../services/search.service';
import { MockTestComponent } from '../mock-test.component';
import { ToMMSSPipe } from '../pipes/to-mmss.pipe';
import { getTranslocoModule } from '../transloco-testing.module';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let titleService: Title;
  let translocoService: TranslocoService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let initService: InitService;
  let playerService: PlayerService;
  let googleAnalyticsService: GoogleAnalyticsService;
  let searchServiceMock: Partial<SearchService>;
  let activatedRouteMock: jasmine.SpyObj<ActivatedRoute>;

  const searchResults1: SearchResults1 = {
    artist: [{ id_artiste: '1', artiste: 'Test Artist', artist: 'Test Artist', id_artiste_deezer: '123' }],
    playlist: [{ id_playlist: '1', artiste: 'Test Artist', ordre: '1', titre: 'Test Album', url_image: '', year_release: 2021 }],
  };
  const searchResults2: SearchResults2 = {
    tab_video: [{
      id_video: '1', artiste: 'Test Artist', artists: [{ id_artist: '1', label: 'Test Artist' }], duree: '100', id_playlist: '1', key: 'XXX-XXX', ordre: '1', titre: 'Test Track', titre_album: 'Test Album'
    }],
  };
  const searchResults3: SearchResults3 = {
    tab_extra: [{ key: 'TEST', title: 'TITLE', duree: 100 }],
  };

  beforeEach(async () => {
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
    ]);
    playerServiceMock.subjectCurrentKeyChange = new BehaviorSubject({ currentKey: 'test-key', currentTitle: 'test-title', currentArtist: 'test-artist' });
    initServiceMock.subjectConnectedChange = new BehaviorSubject({ isConnected: true, pseudo: 'test-pseudo', idPerso: 'test-idPerso', mail: 'test-mail' });
    searchServiceMock = {
      fullSearch1: jasmine.createSpy('fullSearch1').and.returnValue(of(searchResults1)),
      fullSearch2: jasmine.createSpy('fullSearch2').and.returnValue(of(searchResults2)),
      fullSearch3: jasmine.createSpy('fullSearch3').and.returnValue(of(searchResults3)),
    };
    activatedRouteMock = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        url: {
          join: () => 'search/test'
        }
      },
      params: new BehaviorSubject({ query: 'test' }),
      paramMap: of(convertToParamMap({ query: 'test' })),
    });

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'test', component: MockTestComponent }
        ]),
        getTranslocoModule(),
      ],
      declarations: [SearchComponent, ToMMSSPipe, MockTestComponent],
      providers: [
        {
          provide: SearchService,
          useValue: searchServiceMock,
        },
        {
          provide: ActivatedRoute,
          useValue: activatedRouteMock,
        },
        {
          provide: Title,
          useValue: {
            setTitle: () => { },
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
          provide: GoogleAnalyticsService,
          useValue: {
            pageView: () => { },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    translocoService = TestBed.inject(TranslocoService);
    translocoService.setDefaultLang('en');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    titleService = TestBed.inject(Title);
    translocoService = TestBed.inject(TranslocoService);
    initService = TestBed.inject(InitService);
    playerService = TestBed.inject(PlayerService);
    googleAnalyticsService = TestBed.inject(GoogleAnalyticsService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set title and load data on init', () => {
    spyOn(titleService, 'setTitle');
    spyOn(googleAnalyticsService, 'pageView');
    component.ngOnInit();
    expect(titleService.setTitle).toHaveBeenCalledWith('Search results "test" - Zeffyr Music');
    expect(component.listArtists).toEqual(searchResults1.artist);
    expect(component.listAlbums).toEqual(searchResults1.playlist);
    expect(component.listTracks).toEqual(searchResults2.tab_video);
    expect(component.listExtras).toEqual(searchResults3.tab_extra);
    expect(googleAnalyticsService.pageView).toHaveBeenCalledWith('search/test');
  });

  it('should set limitArtist to listArtists length on moreArtists', () => {
    component.listArtists = [{
      artist: 'Test Artist',
      artiste: 'Test Artist',
      id_artiste: '1',
      id_artiste_deezer: '123'
    },
    {
      artist: 'Test Artist 2',
      artiste: 'Test Artist 2',
      id_artiste: '2',
      id_artiste_deezer: '1234'
    }
    ];
    component.moreArtists();
    expect(component.limitArtist).toEqual(component.listArtists.length);
  });

  it('should set limitAlbum to listAlbums length on moreAlbums', () => {
    component.listAlbums = [{
      artiste: 'Test Artist',
      id_playlist: '1',
      ordre: '1',
      titre: 'Test Album',
      url_image: '',
      year_release: 2021
    },
    {
      artiste: 'Test Artist 2',
      id_playlist: '2',
      ordre: '2',
      titre: 'Test Album 2',
      url_image: '',
      year_release: 2021
    }];
    component.moreAlbums();
    expect(component.limitAlbum).toEqual(component.listAlbums.length);
  });

  it('should call playerService.runPlaylist on runPlaylistTrack', () => {
    const index = 0;
    component.listTracks = [{
      id_video: '1',
      artiste: 'Test Artist',
      artists: [{ id_artist: '1', label: 'Test Artist' }],
      duree: '100',
      id_playlist: '1',
      key: 'XXX-XXX',
      ordre: '1',
      titre: 'Test Track',
      titre_album: 'Test Album'
    }];
    component.runPlaylistTrack(index);
    expect(playerService.runPlaylist).toHaveBeenCalledWith(component.listTracks, index);
  });

  it('should call playerService.addVideoInPlaylist on addVideo', () => {
    const key = 'test';
    const artist = 'Test Artist';
    const title = 'Test Track';
    const duration = 100;
    component.addVideo(key, artist, title, duration);
    expect(playerService.addVideoInPlaylist).toHaveBeenCalledWith(key, artist, title, duration);
  });

  it('should set limitTrack to listTracks length on moreTracks', () => {
    component.listTracks = [{
      id_video: '1',
      artiste: 'Test Artist',
      artists: [{ id_artist: '1', label: 'Test Artist' }],
      duree: '100',
      id_playlist: '1',
      key: 'XXX-XXX',
      ordre: '1',
      titre: 'Test Track',
      titre_album: 'Test Album'
    },
    {
      id_video: '2',
      artiste: 'Test Artist 2',
      artists: [{ id_artist: '2', label: 'Test Artist 2' }],
      duree: '100',
      id_playlist: '2',
      key: 'XXX-XXX',
      ordre: '2',
      titre: 'Test Track 2',
      titre_album: 'Test Album 2'
    }];
    component.moreTracks();
    expect(component.limitTrack).toEqual(component.listTracks.length);
  });

  it('should call playerService.runPlaylist on runPlaylistExtra', () => {
    const index = 0;
    component.listExtras = [{
      key: 'TEST',
      title: 'TITLE',
      duree: 100
    }];
    component.runPlaylistExtra(index);
    expect(playerService.runPlaylist).toHaveBeenCalled();
  });

  it('should set limitExtra to listExtras length on moreExtras', () => {
    component.listExtras = [{
      key: 'TEST',
      title: 'TITLE',
      duree: 100
    },
    {
      key: 'TEST2',
      title: 'TITLE2',
      duree: 100
    }];
    component.moreExtras();
    expect(component.limitExtra).toEqual(component.listExtras.length);
  });

  it('should unsubscribe from subscription on ngOnDestroy', () => {
    const unsubscribeSpy = spyOn(component['subscriptionConnected'], 'unsubscribe');
    const unsubscribeSpy2 = spyOn(component['paramMapSubscription'], 'unsubscribe');

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
    expect(unsubscribeSpy2).toHaveBeenCalled();
  });
});
