import { NgZone, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { of } from 'rxjs';
import { SearchBarComponent, SearchResultItem } from './search-bar.component';
import { TranslocoService } from '@jsverse/transloco';
import { MockTestComponent } from '../mock-test.component';
import { SearchService } from '../services/search.service';
import { SearchBarResponse } from '../models/search.model';
import { getTranslocoTestingProviders } from '../transloco-testing';

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let googleAnalyticsServiceSpy: { pageView: any };
  let ngZone: NgZone;
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
    searchServiceMock = {
      searchBar: vi.fn().mockReturnValue(of(mockSearchBarResponse)),
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([{ path: 'test', component: MockTestComponent }]),
        SearchBarComponent,
      ],
      declarations: [MockTestComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: SearchService, useValue: searchServiceMock },
        { provide: GoogleAnalyticsService, useValue: googleAnalyticsServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    TestBed.inject(TranslocoService).setDefaultLang('en');
  });

  beforeEach(() => {
    ngZone = TestBed.inject(NgZone);
    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a searchTypeahead function', () => {
    expect(component.searchTypeahead).toBeDefined();
    expect(typeof component.searchTypeahead).toBe('function');
  });

  it('should return empty string from inputFormatter', () => {
    expect(component.inputFormatter()).toBe('');
  });

  it('should return label from resultFormatter', () => {
    const item: SearchResultItem = {
      type: 'artist',
      label: 'Test Artist',
      navigateUrl: '/artist/1',
    };
    expect(component.resultFormatter(item)).toBe('Test Artist');
  });

  describe('onSelect', () => {
    it('should navigate to the selected item URL and clear query', () => {
      const routerSpy = vi.spyOn(component['router'], 'navigate');
      const item: SearchResultItem = {
        type: 'artist',
        label: 'Test Artist',
        navigateUrl: '/artist/123',
        original: {
          artist: 'Test Artist',
          artiste: 'Test Artist',
          id_artiste: '123',
          id_artiste_deezer: '456',
        },
      };

      component.query.set('test');

      ngZone.run(() => {
        component.onSelect({ item, preventDefault: vi.fn() });
      });

      expect(component.query()).toBe('');
      expect(routerSpy).toHaveBeenCalledWith(['/artist/123']);
      expect(googleAnalyticsServiceSpy.pageView).toHaveBeenCalledWith('/recherche?q=test');
    });

    it('should navigate to "all results" without analytics', () => {
      const routerSpy = vi.spyOn(component['router'], 'navigate');
      const item: SearchResultItem = {
        type: 'all',
        label: '',
        navigateUrl: '/search/test',
      };

      ngZone.run(() => {
        component.onSelect({ item, preventDefault: vi.fn() });
      });

      expect(routerSpy).toHaveBeenCalledWith(['/search/test']);
      expect(googleAnalyticsServiceSpy.pageView).not.toHaveBeenCalled();
    });
  });

  describe('getQuerystr', () => {
    it('should return the query string encoded', () => {
      component.query.set('test query');
      expect(component.getQuerystr()).toEqual(encodeURIComponent('test query'));
    });
  });
});
