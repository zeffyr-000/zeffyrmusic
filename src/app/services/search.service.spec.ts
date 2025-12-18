import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SearchService } from './search.service';
import { environment } from '../../environments/environment';
import {
  SearchBarResponse,
  SearchResults1,
  SearchResults2,
  SearchResults3,
} from '../models/search.model';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';

describe('SearchService', () => {
  describe('Browser context', () => {
    let service: SearchService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [],
        providers: [
          SearchService,
          { provide: PLATFORM_ID, useValue: 'browser' },
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
        ],
      });

      service = TestBed.inject(SearchService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should fetch search results 1', () => {
      const mockSearchResults1: SearchResults1 = {
        artist: [
          {
            artist: 'test_artist',
            artiste: 'test_artiste',
            id_artiste: 'test_id_artiste',
            id_artiste_deezer: 'test_id_artiste_deezer',
          },
        ],
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
      };

      service.fullSearch1('test_query').subscribe(data => {
        expect(data).toEqual(mockSearchResults1);
      });

      const req = httpMock.expectOne(
        environment.URL_SERVER + 'fullsearch1/' + encodeURIComponent('test_query')
      );

      expect(req.request.method).toBe('GET');

      req.flush(mockSearchResults1);
    });

    it('should fetch search results 2', () => {
      const mockSearchResults2: SearchResults2 = {
        tab_video: [
          {
            id_video: 'test_id_video',
            artiste: 'test_artiste',
            artists: [{ id_artist: 'test_id_artiste', label: 'test_label' }],
            duree: '100',
            id_playlist: 'test_id_playlist',
            key: 'test_key',
            ordre: '1',
            titre: 'test_titre',
            titre_album: 'test_titre_album',
          },
        ],
      };

      service.fullSearch2('test_query').subscribe(data => {
        expect(data).toEqual(mockSearchResults2);
      });

      const req = httpMock.expectOne(
        environment.URL_SERVER + 'fullsearch2/' + encodeURIComponent('test_query')
      );

      expect(req.request.method).toBe('GET');

      req.flush(mockSearchResults2);
    });

    it('should fetch search results 3', () => {
      const mockSearchResults3: SearchResults3 = {
        tab_extra: [
          {
            key: 'test_key',
            title: 'test_title',
            duree: 100,
          },
        ],
      };

      service.fullSearch3('test_query').subscribe(data => {
        expect(data).toEqual(mockSearchResults3);
      });

      const req = httpMock.expectOne(
        environment.URL_SERVER + 'fullsearch3/' + encodeURIComponent('test_query')
      );

      expect(req.request.method).toBe('GET');

      req.flush(mockSearchResults3);
    });

    it('should fetch search bar results', () => {
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

      service.searchBar('test_query').subscribe(data => {
        expect(data).toEqual(mockSearchBarResponse);
      });

      const req = httpMock.expectOne(
        environment.URL_SERVER + 'recherche2?q=' + encodeURIComponent('test_query')
      );

      expect(req.request.method).toBe('GET');

      req.flush(mockSearchBarResponse);
    });

    it('should use stored data from transferState for fullSearch1 in browser context', () => {
      const storedSearchResults: SearchResults1 = {
        artist: [
          {
            artist: 'cached_artist',
            artiste: 'cached_artiste',
            id_artiste: 'cached_id_artiste',
            id_artiste_deezer: 'cached_id_artiste_deezer',
          },
        ],
        playlist: [
          {
            id_playlist: 'cached_id_playlist',
            artiste: 'cached_artiste',
            ordre: '3',
            titre: 'cached_titre',
            url_image: 'cached_url_image',
            year_release: 2023,
          },
        ],
      };

      const transferStateMock = jasmine.createSpyObj('TransferState', ['get', 'set', 'remove']);

      transferStateMock.get.and.returnValue(storedSearchResults);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).transferState = transferStateMock;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).isBrowser = true;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const httpSpy = spyOn((service as any).httpClient, 'get');

      let result: SearchResults1 | null = null;
      const testQuery = 'cached_query';

      service.fullSearch1(testQuery).subscribe(data => {
        result = data;
      });

      expect(transferStateMock.get).toHaveBeenCalled();
      expect(transferStateMock.get.calls.mostRecent().args[0]).toContain('search1-');
      expect(transferStateMock.get.calls.mostRecent().args[0]).toContain(testQuery);

      expect(result).toEqual(storedSearchResults);

      expect(transferStateMock.remove).toHaveBeenCalled();
      expect(transferStateMock.remove.calls.mostRecent().args[0]).toEqual(
        transferStateMock.get.calls.mostRecent().args[0]
      );

      expect(httpSpy).not.toHaveBeenCalled();

      httpMock.expectNone(environment.URL_SERVER + 'fullsearch1/' + encodeURIComponent(testQuery));

      expect(transferStateMock.set).not.toHaveBeenCalled();
    });
  });

  describe('Server context', () => {
    let service: SearchService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [],
        providers: [
          SearchService,
          { provide: PLATFORM_ID, useValue: 'server' },
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
        ],
      });

      service = TestBed.inject(SearchService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should fetch search results 1', () => {
      const mockSearchResults1: SearchResults1 = {
        artist: [
          {
            artist: 'test_artist',
            artiste: 'test_artiste',
            id_artiste: 'test_id_artiste',
            id_artiste_deezer: 'test_id_artiste_deezer',
          },
        ],
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
      };

      service.fullSearch1('test_query').subscribe(data => {
        expect(data).toEqual(mockSearchResults1);
      });

      const req = httpMock.expectOne(
        environment.URL_SERVER + 'fullsearch1/' + encodeURIComponent('test_query')
      );

      expect(req.request.method).toBe('GET');

      req.flush(mockSearchResults1);
    });

    it('should return empty results for fullSearch2 when in server context', () => {
      expect(TestBed.inject(PLATFORM_ID)).toBe('server');

      const expectedEmptyResult: SearchResults2 = {
        tab_video: [],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const httpSpy = spyOn((service as any).httpClient, 'get');

      let result: SearchResults2 | null = null;

      service.fullSearch2('test_query').subscribe(data => {
        result = data;
      });

      expect(result).toEqual(expectedEmptyResult);

      expect(httpSpy).not.toHaveBeenCalled();

      httpMock.expectNone(
        environment.URL_SERVER + 'fullsearch2/' + encodeURIComponent('test_query')
      );
    });

    it('should return empty results for fullSearch3 when in server context', () => {
      expect(TestBed.inject(PLATFORM_ID)).toBe('server');

      const expectedEmptyResult: SearchResults3 = {
        tab_extra: [],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const httpSpy = spyOn((service as any).httpClient, 'get');

      let result: SearchResults3 | null = null;

      service.fullSearch3('test_query').subscribe(data => {
        result = data;
      });

      expect(result).toEqual(expectedEmptyResult);

      expect(httpSpy).not.toHaveBeenCalled();

      httpMock.expectNone(
        environment.URL_SERVER + 'fullsearch3/' + encodeURIComponent('test_query')
      );
    });
  });
});
