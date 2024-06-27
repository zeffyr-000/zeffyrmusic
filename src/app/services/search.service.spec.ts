import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SearchService } from './search.service';
import { environment } from '../../environments/environment';
import { SearchBarResponse, SearchResults1, SearchResults2, SearchResults3 } from '../models/search.model';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('SearchService', () => {
  let service: SearchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [SearchService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    });

    service = TestBed.inject(SearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch search results 1', () => {
    const mockSearchResults1: SearchResults1 = {
      artist: [{
        artist: 'test_artist',
        artiste: 'test_artiste',
        id_artiste: 'test_id_artiste',
        id_artiste_deezer: 'test_id_artiste_deezer',
      }],
      playlist: [{
        id_playlist: 'test_id_playlist',
        artiste: 'test_artiste',
        ordre: '1',
        titre: 'test_titre',
        url_image: 'test_url_image',
        year_release: 2021,
      }],
    };

    service.fullSearch1('test_query').subscribe(data => {
      expect(data).toEqual(mockSearchResults1);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'fullsearch1/' + encodeURIComponent('test_query'));

    expect(req.request.method).toBe('GET');

    req.flush(mockSearchResults1);
  });

  it('should fetch search results 2', () => {
    const mockSearchResults2: SearchResults2 = {
      tab_video: [{
        id_video: 'test_id_video',
        artiste: 'test_artiste',
        artists: [{ id_artist: 'test_id_artiste', label: 'test_label' }],
        duree: '100',
        id_playlist: 'test_id_playlist',
        key: 'test_key',
        ordre: '1',
        titre: 'test_titre',
        titre_album: 'test_titre_album',
      }],
    };

    service.fullSearch2('test_query').subscribe(data => {
      expect(data).toEqual(mockSearchResults2);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'fullsearch2/' + encodeURIComponent('test_query'));

    expect(req.request.method).toBe('GET');

    req.flush(mockSearchResults2);
  });

  it('should fetch search results 3', () => {
    const mockSearchResults3: SearchResults3 = {
      tab_extra: [{
        key: 'test_key',
        title: 'test_title',
        duree: 100,
      }],
    };

    service.fullSearch3('test_query').subscribe(data => {
      expect(data).toEqual(mockSearchResults3);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'fullsearch3/' + encodeURIComponent('test_query'));

    expect(req.request.method).toBe('GET');

    req.flush(mockSearchResults3);
  });

  it('should fetch search bar results', () => {
    const mockSearchBarResponse: SearchBarResponse = {
      playlist: [{
        id_playlist: 'test_id_playlist',
        artiste: 'test_artiste',
        ordre: '1',
        titre: 'test_titre',
        url_image: 'test_url_image',
        year_release: 2021,
      }],
      artist: [{
        artist: 'test_artist',
        artiste: 'test_artiste',
        id_artiste: 'test_id_artiste',
        id_artiste_deezer: 'test_id_artiste_deezer',
      }],
    };

    service.searchBar('test_query').subscribe(data => {
      expect(data).toEqual(mockSearchBarResponse);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'recherche2?q=' + encodeURIComponent('test_query'));

    expect(req.request.method).toBe('GET');

    req.flush(mockSearchBarResponse);
  });
});
