import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA, NgZone } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ArtistResult } from '../models/artist.model';
import { PlaylistResult } from '../models/playlist.model';
import { SearchBarComponent } from './search-bar.component';
import { TranslocoTestingModule, TranslocoConfig, TRANSLOCO_CONFIG, TranslocoService } from '@ngneat/transloco';
import { HttpClient } from '@angular/common/http';
import { MockTestComponent } from '../mock-test.component';
import { TestScheduler } from 'rxjs/testing';

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;
  let googleAnalyticsServiceSpy: { pageView: jasmine.Spy };
  let routerSpy: { navigate: jasmine.Spy };
  let changeDetectorRefSpy: { detectChanges: jasmine.Spy };
  let translocoService: TranslocoService;
  let ngZone: NgZone;
  let httpClient: HttpClient;
  let testScheduler: TestScheduler;

  beforeEach(async () => {
    googleAnalyticsServiceSpy = jasmine.createSpyObj('GoogleAnalyticsService', ['pageView']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    changeDetectorRefSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule,
        RouterTestingModule.withRoutes([
          { path: 'test', component: MockTestComponent },
        ]),
        TranslocoTestingModule.forRoot({
          langs: {
            en: { meta_description: 'META_DESCRIPTION', title: 'TITLE', rechercher: 'rechercher' },
            fr: { meta_description: 'META_DESCRIPTION_FR', title: 'TITLE_FR', rechercher: 'rechercher' }
          }
        }),],
      declarations: [SearchBarComponent, MockTestComponent],
      providers: [
        HttpClient,
        { provide: GoogleAnalyticsService, useValue: googleAnalyticsServiceSpy },
        { provide: RouterTestingModule, useValue: routerSpy },
        { provide: ChangeDetectorRef, useValue: changeDetectorRefSpy },
        {
          provide: TRANSLOCO_CONFIG, useValue: {
            reRenderOnLangChange: true,
            availableLangs: ['en', 'fr'],
            defaultLang: 'en',
            prodMode: false,
          } as TranslocoConfig
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    translocoService = TestBed.inject(TranslocoService);
    translocoService.setDefaultLang('en');
  });

  beforeEach(() => {
    ngZone = TestBed.inject(NgZone);
    fixture = TestBed.createComponent(SearchBarComponent);
    httpClient = TestBed.inject(HttpClient);
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
    testScheduler.run(({ cold }) => {
      const query = 'test';
      const searchResponse = {
        artist: [{
          artist: 'Artist 1',
          artiste: 'Artist 1',
          id_artiste: '1',
          id_artiste_deezer: '123'
        }],
        playlist: [{
          id_playlist: '1',
          artiste: 'Artist 1',
          ordre: '1',
          titre: 'Playlist 1',
          url_image: 'https://url.com/image.jpg',
          year_release: 2000
        }],
      };

      spyOn(httpClient, 'get').and.returnValue(cold('a|', { a: searchResponse }));

      const searchSubject = new Subject<string>();
      component['searchSubject'] = searchSubject;

      component.ngOnInit();

      testScheduler.schedule(() => searchSubject.next('te'), 0);
      testScheduler.schedule(() => searchSubject.next('tes'), 300);
      testScheduler.schedule(() => searchSubject.next('test'), 600);

      testScheduler.flush();

      expect(component['resultsAlbum']).toEqual(searchResponse.playlist);
      expect(component['resultsArtist']).toBe(searchResponse.artist);

      expect(httpClient.get).toHaveBeenCalledWith(
        environment.URL_SERVER + 'recherche2?q=' + encodeURIComponent(query),
        environment.httpClientConfig
      );
    });
  });

  it('should emit query value when search is called', () => {
    const query = 'test';
    component['query'] = query;
    const searchSubjectSpy = spyOn(component['searchSubject'], 'next');

    component.search();

    expect(searchSubjectSpy).toHaveBeenCalledWith(query);
  });

  describe('reset', () => {
    it('should reset the query and results and navigate to the given URL', () => {
      const artistResult: ArtistResult = {
        artist: 'Artist 1',
        artiste: 'Artist 1',
        id_artiste: '1',
        id_artiste_deezer: '123'
      };
      const playlistResult: PlaylistResult = {
        id_playlist: '1',
        artiste: 'Artist 1',
        ordre: '1',
        titre: 'Playlist 1',
        url_image: 'https://url.com/image.jpg',
        year_release: 2000
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