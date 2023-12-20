import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslocoTestingModule, TranslocoConfig, TRANSLOCO_CONFIG, TranslocoService } from '@ngneat/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { BehaviorSubject, of } from 'rxjs';
import { Extra } from '../models/search.model';
import { ArtistResult } from '../models/artist.model';
import { PlaylistResult } from '../models/playlist.model';
import { Video } from '../models/video.model';
import { InitService } from '../services/init.service';
import { PlayerService } from '../services/player.service';
import { SearchComponent } from './search.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let titleService: Title;
  let translocoService: TranslocoService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let initService: InitService;
  let playerService: PlayerService;
  let googleAnalyticsService: GoogleAnalyticsService;

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
    initServiceMock.subjectConnectedChange = new BehaviorSubject({ isConnected: true, pseudo: 'test-pseudo', idPerso: 'test-idPerso', mail: 'test-mail' });

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([
          { path: 'test', component: null }
        ]),
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              resultats_recherche: 'resultats_recherche',
              albums: 'albums', intitule_titre: 'intitule_titre', intitule_artiste: 'intitule_artiste',
              morceaux: 'morceaux', extras: 'extras', artistes: 'artistes', playlists: 'playlists'
            },
            fr: {
              resultats_recherche: 'resultats_recherche', albums: 'albums', intitule_titre: 'intitule_titre',
              intitule_artiste: 'intitule_artiste', morceaux: 'morceaux', extras: 'extras', artistes: 'artistes', playlists: 'playlists'
            }
          }
        })],
      declarations: [SearchComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'test',
              },
              url: ['search', 'test'],
            },
          },
        },
        {
          provide: Title,
          useValue: {
            setTitle: () => { },
          },
        },
        {
          provide: TRANSLOCO_CONFIG, useValue: {
            reRenderOnLangChange: true,
            availableLangs: ['en', 'fr'],
            defaultLang: 'en',
            prodMode: false,
          } as TranslocoConfig
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
    const data: { artist: ArtistResult[], playlist: PlaylistResult[], tab_video: Video[], tab_extra: Extra[] } = {
      artist: [{ id_artiste: '1', artiste: 'Test Artist', artist: 'Test Artist', id_artiste_deezer: '123' }],
      playlist: [{ id_playlist: '1', artiste: 'Test Artist', ordre: '1', titre: 'Test Album', url_image: '', year_release: 2021 }],
      tab_video: [{
        id_video: '1', artiste: 'Test Artist', artists: [{ id_artiste: '1', label: 'Test Artist' }], duree: '100', id_playlist: '1', key: 'XXX-XXX', ordre: '1', titre: 'Test Track', titre_album: 'Test Album'
      }],
      tab_extra: [{ key: 'TEST', title: 'TITLE', duree: 100 }],
    };
    spyOn(component['httpClient'], 'get').and.returnValue(of(data));
    spyOn(titleService, 'setTitle');
    spyOn(googleAnalyticsService, 'pageView');
    component.ngOnInit();
    expect(titleService.setTitle).toHaveBeenCalledWith('resultats_recherche - Zeffyr Music');
    expect(component.listArtists).toEqual(data.artist);
    expect(component.listAlbums).toEqual(data.playlist);
    expect(component.listTracks).toEqual(data.tab_video);
    expect(component.listExtras).toEqual(data.tab_extra);
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
      artists: [{ id_artiste: '1', label: 'Test Artist' }],
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
      artists: [{ id_artiste: '1', label: 'Test Artist' }],
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
      artists: [{ id_artiste: '2', label: 'Test Artist 2' }],
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

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
