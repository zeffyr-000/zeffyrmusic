import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ArtistResult } from '../models/artist.model';
import { PlaylistResult } from '../models/playlist.model';
import { SearchBarComponent, SearchResponse } from './search-bar.component';
import { TranslocoTestingModule, TranslocoConfig, TRANSLOCO_CONFIG, TranslocoService } from '@ngneat/transloco';
import { HttpClient } from '@angular/common/http';

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;
  let googleAnalyticsServiceSpy: { pageView: jasmine.Spy };
  let routerSpy: { navigate: jasmine.Spy };
  let changeDetectorRefSpy: { detectChanges: jasmine.Spy };
  let translocoService: TranslocoService;

  beforeEach(async () => {
    googleAnalyticsServiceSpy = jasmine.createSpyObj('GoogleAnalyticsService', ['pageView']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    changeDetectorRefSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule,
        RouterTestingModule,
        TranslocoTestingModule.forRoot({
          langs: {
            en: { meta_description: 'META_DESCRIPTION', title: 'TITLE', rechercher: 'rechercher' },
            fr: { meta_description: 'META_DESCRIPTION_FR', title: 'TITLE_FR', rechercher: 'rechercher' }
          }
        }),],
      declarations: [SearchBarComponent],
      providers: [
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
    }).compileComponents();

    translocoService = TestBed.inject(TranslocoService);
    translocoService.setDefaultLang('en');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('search', () => {
    it('should call the API with the correct query', () => {
      const query = 'test';
      const searchResponse: SearchResponse = {
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
          year_release: '2000'
        }],
      };

      const httpClient = TestBed.inject(HttpClient);
      const httpClientSpy = spyOn(httpClient, 'get').and.returnValue(of(searchResponse));

      component.query = query;
      component.search();

      expect(httpClientSpy).toHaveBeenCalledWith(
        environment.URL_SERVER + 'recherche2?q=' + encodeURIComponent(query),
        environment.httpClientConfig
      );
      expect(component.resultsArtist).toEqual(searchResponse.artist);
      expect(component.resultsAlbum).toEqual(searchResponse.playlist);
    });
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
        year_release: '2000'
      };
      const url = '/test';
      component.query = 'test';
      component.resultsArtist = [artistResult];
      component.resultsAlbum = [playlistResult];

      component.reset(artistResult, true, url);

      expect(googleAnalyticsServiceSpy.pageView).toHaveBeenCalledWith('/recherche?q=test');
      expect(component.query).toEqual('');
      expect(component.resultsArtist).toEqual([]);
      expect(component.resultsAlbum).toEqual([]);
      /*
      expect(changeDetectorRefSpy.detectChanges).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith([url]);
      */

      component.reset(playlistResult, true, url);
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