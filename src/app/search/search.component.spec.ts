import type { Mock, MockedObject } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { BehaviorSubject, of } from 'rxjs';
import { SearchResults1, SearchResults2, SearchResults3 } from '../models/search.model';
import { PlayerService } from '../services/player.service';
import { SearchComponent } from './search.component';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { SearchService } from '../services/search.service';
import { MockTestComponent } from '../mock-test.component';
import { ToMMSSPipe } from '../pipes/to-mmss.pipe';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { AuthStore, QueueStore } from '../store';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let titleService: Title;
  let translocoService: TranslocoService;
  let playerService: PlayerService;
  let googleAnalyticsService: GoogleAnalyticsService;
  let searchServiceMock: Partial<SearchService>;
  let activatedRouteMock: MockedObject<ActivatedRoute>;
  let authStore: InstanceType<typeof AuthStore>;
  let queueStore: InstanceType<typeof QueueStore>;

  const searchResults1: SearchResults1 = {
    artist: [
      { id_artiste: '1', artiste: 'Test Artist', artist: 'Test Artist', id_artiste_deezer: '123' },
    ],
    playlist: [
      {
        id_playlist: '1',
        artiste: 'Test Artist',
        ordre: '1',
        titre: 'Test Album',
        url_image: '',
        year_release: 2021,
      },
    ],
  };
  const searchResults2: SearchResults2 = {
    tab_video: [
      {
        id_video: '1',
        artiste: 'Test Artist',
        artists: [{ id_artist: '1', label: 'Test Artist' }],
        duree: '100',
        id_playlist: '1',
        key: 'XXX-XXX',
        ordre: '1',
        titre: 'Test Track',
        titre_album: 'Test Album',
      },
    ],
  };
  const searchResults3: SearchResults3 = {
    tab_extra: [{ key: 'TEST', title: 'TITLE', duree: 100 }],
  };

  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerServiceMock: any = {
      lecture: vi.fn(),
      removeToPlaylist: vi.fn(),
      switchFollow: vi.fn(),
      runPlaylist: vi.fn(),
      addInCurrentList: vi.fn(),
      addVideoInPlaylist: vi.fn(),
      removeVideo: vi.fn(),
      addVideoAfterCurrentInList: vi.fn(),
    };
    searchServiceMock = {
      fullSearch1: vi.fn().mockReturnValue(of(searchResults1)),
      fullSearch2: vi.fn().mockReturnValue(of(searchResults2)),
      fullSearch3: vi.fn().mockReturnValue(of(searchResults3)),
    };
    activatedRouteMock = {
      snapshot: {
        url: {
          join: () => 'search/test',
        },
      },
      params: new BehaviorSubject({ query: 'test' }),
      paramMap: of(convertToParamMap({ query: 'test' })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([{ path: 'test', component: MockTestComponent }]),
        SearchComponent,
        ToMMSSPipe,
      ],
      declarations: [MockTestComponent],
      providers: [
        getTranslocoTestingProviders(),
        {
          provide: PLATFORM_ID,
          useValue: 'browser',
        },
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
            setTitle: () => {
              // Mock setTitle
            },
          },
        },
        {
          provide: PlayerService,
          useValue: playerServiceMock,
        },
        {
          provide: GoogleAnalyticsService,
          useValue: { pageView: vi.fn() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    translocoService = TestBed.inject(TranslocoService);
    translocoService.setDefaultLang('en');
    authStore = TestBed.inject(AuthStore);
    queueStore = TestBed.inject(QueueStore);
    authStore.logout();
    queueStore.clear();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    titleService = TestBed.inject(Title);
    translocoService = TestBed.inject(TranslocoService);
    playerService = TestBed.inject(PlayerService);
    googleAnalyticsService = TestBed.inject(GoogleAnalyticsService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set title and load data on init', () => {
    vi.spyOn(titleService, 'setTitle');

    // Set language to English for predictable test output
    translocoService.setActiveLang('en');

    component.ngOnInit();
    expect(titleService.setTitle).toHaveBeenCalledWith('Search results "test" - Zeffyr Music');
    expect(component.listArtists).toEqual(searchResults1.artist);
    expect(component.listAlbums).toEqual(searchResults1.playlist);
    expect(component.listTracks).toEqual(searchResults2.tab_video);

    if (component['isBrowser']) {
      expect(googleAnalyticsService.pageView).toHaveBeenCalledWith('search/test');
    }
  });

  it('should set limitArtist to listArtists length on moreArtists', () => {
    component.listArtists = [
      {
        artist: 'Test Artist',
        artiste: 'Test Artist',
        id_artiste: '1',
        id_artiste_deezer: '123',
      },
      {
        artist: 'Test Artist 2',
        artiste: 'Test Artist 2',
        id_artiste: '2',
        id_artiste_deezer: '1234',
      },
    ];
    component.moreArtists();
    expect(component.limitArtist).toEqual(component.listArtists.length);
  });

  it('should set limitAlbum to listAlbums length on moreAlbums', () => {
    component.listAlbums = [
      {
        artiste: 'Test Artist',
        id_playlist: '1',
        ordre: '1',
        titre: 'Test Album',
        url_image: '',
        year_release: 2021,
      },
      {
        artiste: 'Test Artist 2',
        id_playlist: '2',
        ordre: '2',
        titre: 'Test Album 2',
        url_image: '',
        year_release: 2021,
      },
    ];
    component.moreAlbums();
    expect(component.limitAlbum).toEqual(component.listAlbums.length);
  });

  it('should call playerService.runPlaylist on runPlaylistTrack', () => {
    const index = 0;
    component.listTracks = [
      {
        id_video: '1',
        artiste: 'Test Artist',
        artists: [{ id_artist: '1', label: 'Test Artist' }],
        duree: '100',
        id_playlist: '1',
        key: 'XXX-XXX',
        ordre: '1',
        titre: 'Test Track',
        titre_album: 'Test Album',
      },
    ];
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
    component.listTracks = [
      {
        id_video: '1',
        artiste: 'Test Artist',
        artists: [{ id_artist: '1', label: 'Test Artist' }],
        duree: '100',
        id_playlist: '1',
        key: 'XXX-XXX',
        ordre: '1',
        titre: 'Test Track',
        titre_album: 'Test Album',
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
        titre_album: 'Test Album 2',
      },
    ];
    component.moreTracks();
    expect(component.limitTrack).toEqual(component.listTracks.length);
  });

  it('should call playerService.runPlaylist on runPlaylistExtra', () => {
    const index = 0;
    component.listExtras = [
      {
        key: 'TEST',
        title: 'TITLE',
        duree: 100,
      },
    ];
    component.runPlaylistExtra(index);
    expect(playerService.runPlaylist).toHaveBeenCalled();
  });

  it('should set limitExtra to listExtras length on moreExtras', () => {
    component.listExtras = [
      {
        key: 'TEST',
        title: 'TITLE',
        duree: 100,
      },
      {
        key: 'TEST2',
        title: 'TITLE2',
        duree: 100,
      },
    ];
    component.moreExtras();
    expect(component.limitExtra).toEqual(component.listExtras.length);
  });

  it('should handle undefined tab_extra in search results', () => {
    const searchResults3WithoutTabExtra = {} as SearchResults3;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (searchServiceMock.fullSearch3 as Mock<any>).mockReturnValue(of(searchResults3WithoutTabExtra));

    // Login user to trigger fullSearch3
    authStore.login(
      { pseudo: 'test', mail: 'test@test.com', idPerso: '123' },
      { darkModeEnabled: false, language: 'fr' }
    );

    component.listExtras = [{ key: 'OLD_VALUE', title: 'Should be cleared', duree: 100 }];

    component.ngOnInit();

    expect(component.listExtras).toEqual([]);
    expect(searchServiceMock.fullSearch3).toHaveBeenCalled();
  });

  it('should unsubscribe from subscription on ngOnDestroy', () => {
    const unsubscribeSpy = vi.spyOn(component['paramMapSubscription'], 'unsubscribe');

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
