import type { Mock } from 'vitest';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA, NgZone } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { Subject, of } from 'rxjs';
import { ArtistResult } from '../models/artist.model';
import { PlaylistResult } from '../models/playlist.model';
import { SearchBarComponent } from './search-bar.component';
import { TranslocoService } from '@jsverse/transloco';
import { MockTestComponent } from '../mock-test.component';
import { TestScheduler } from 'rxjs/testing';
import { SearchService } from '../services/search.service';
import { SearchBarResponse } from '../models/search.model';
import { getTranslocoModule } from '../transloco-testing.module';

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let googleAnalyticsServiceSpy: { pageView: any };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routerSpy: { navigate: any };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let changeDetectorRefSpy: { detectChanges: any };
  let translocoService: TranslocoService;
  let ngZone: NgZone;
  let testScheduler: TestScheduler;
  let searchServiceMock: Partial<SearchService>;
  const mockSearchBarResponse: SearchBarResponse = {
    playlist: [
      {
        id_playlist: 'test_id_playlist',
        artiste: 'test_artiste',
        ordre: '1',
        titre: 'test_titre',
        url_image: 'test_url_image',
        year_release: 2021,
      },
    ],
    artist: [
      {
        artist: 'test_artist',
        artiste: 'test_artiste',
        id_artiste: 'test_id_artiste',
        id_artiste_deezer: 'test_id_artiste_deezer',
      },
    ],
  };

  beforeEach(async () => {
    googleAnalyticsServiceSpy = { pageView: vi.fn() };
    routerSpy = { navigate: vi.fn() };
    changeDetectorRefSpy = { detectChanges: vi.fn() };
    searchServiceMock = {
      searchBar: vi.fn().mockReturnValue(of(mockSearchBarResponse)),
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([{ path: 'test', component: MockTestComponent }]),
        getTranslocoModule(),
        SearchBarComponent,
      ],
      declarations: [MockTestComponent],
      providers: [
        { provide: SearchService, useValue: searchServiceMock },
        { provide: GoogleAnalyticsService, useValue: googleAnalyticsServiceSpy },
        { provide: RouterTestingModule, useValue: routerSpy },
        { provide: ChangeDetectorRef, useValue: changeDetectorRefSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    translocoService = TestBed.inject(TranslocoService);
    translocoService.setDefaultLang('en');
  });

  beforeEach(() => {
    ngZone = TestBed.inject(NgZone);
    fixture = TestBed.createComponent(SearchBarComponent);
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should debounce, filter, and search for query in ngOnInit', () => {
    testScheduler.run(() => {
      const searchSubject = new Subject<string>();
      component['searchSubject'] = searchSubject;

      component.ngOnInit();

      testScheduler.schedule(() => searchSubject.next('te'), 0);
      testScheduler.schedule(() => searchSubject.next('tes'), 300);
      testScheduler.schedule(() => searchSubject.next('test'), 600);

      testScheduler.flush();

      expect(component['resultsAlbum']).toEqual(mockSearchBarResponse.playlist);
      expect(component['resultsArtist']).toBe(mockSearchBarResponse.artist);
    });
  });

  it('should emit query value when search is called', () => {
    const query = 'test';
    component['query'] = query;
    const searchSubjectSpy = vi.spyOn(component['searchSubject'], 'next');

    component.search();

    expect(searchSubjectSpy).toHaveBeenCalledWith(query);
  });

  it('should clear results when query is empty', () => {
    testScheduler.run(() => {
      component.resultsAlbum = [
        {
          id_playlist: '1',
          artiste: 'Test Artist',
          ordre: '1',
          titre: 'Test Album',
          url_image: 'https://example.com/image.jpg',
          year_release: 2020,
        },
      ];

      component.resultsArtist = [
        {
          artist: 'Test Artist',
          artiste: 'Test Artist',
          id_artiste: '1',
          id_artiste_deezer: '123',
        },
      ];

      const searchSubject = new Subject<string>();
      component['searchSubject'] = searchSubject;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (searchServiceMock.searchBar as Mock<any>).mockClear();

      component.ngOnInit();

      testScheduler.schedule(() => searchSubject.next(''), 0);

      testScheduler.flush();

      expect(component.resultsAlbum).toEqual([]);
      expect(component.resultsArtist).toEqual([]);

      expect(searchServiceMock.searchBar).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset the query and results and navigate to the given URL', () => {
      const artistResult: ArtistResult = {
        artist: 'Artist 1',
        artiste: 'Artist 1',
        id_artiste: '1',
        id_artiste_deezer: '123',
      };
      const playlistResult: PlaylistResult = {
        id_playlist: '1',
        artiste: 'Artist 1',
        ordre: '1',
        titre: 'Playlist 1',
        url_image: 'https://url.com/image.jpg',
        year_release: 2000,
      };
      const url = '/test';
      component.query = 'test';
      component.resultsArtist = [artistResult];
      component.resultsAlbum = [playlistResult];

      ngZone.run(() => {
        component.reset(artistResult, true, url);
      });

      expect(googleAnalyticsServiceSpy.pageView).toHaveBeenCalledWith('/recherche?q=test');
      expect(component.query).toEqual('');
      expect(component.resultsArtist).toEqual([]);
      expect(component.resultsAlbum).toEqual([]);

      ngZone.run(() => {
        component.reset(playlistResult, true, url);
      });
      expect(googleAnalyticsServiceSpy.pageView).toHaveBeenCalledWith('/recherche?q=test');
    });
  });

  describe('getQuerystr', () => {
    it('should return the query string encoded', () => {
      const query = 'test query';
      component.query = query;

      const result = component.getQuerystr();

      expect(result).toEqual(encodeURIComponent(query));
    });
  });
});
