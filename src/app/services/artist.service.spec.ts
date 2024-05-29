import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ArtistService } from './artist.service';
import { environment } from '../../environments/environment';
import { ArtistData } from '../models/artist.model';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ArtistService', () => {
  let service: ArtistService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [ArtistService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});

    service = TestBed.inject(ArtistService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch artist data', () => {
    const mockArtistData: ArtistData = {
      nom: 'Test Artist',
      id_artiste_deezer: '123',
      id_artist: '456',
      list_albums: []
    };

    service.getArtist('123').subscribe(data => {
      expect(data).toEqual(mockArtistData);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'json/artist/123');

    expect(req.request.method).toBe('GET');

    req.flush(mockArtistData);
  });
});