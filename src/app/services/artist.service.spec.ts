import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ArtistService } from './artist.service';
import { environment } from '../../environments/environment';
import { ArtistData } from '../models/artist.model';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { makeStateKey, PLATFORM_ID, StateKey, TransferState } from '@angular/core';

describe('ArtistService', () => {
  let service: ArtistService;
  let httpMock: HttpTestingController;

  const mockArtistData: ArtistData = {
    nom: 'Test Artist',
    id_artiste_deezer: '123',
    id_artist: '456',
    list_albums: []
  };

  describe('In browser environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [],
        providers: [
          ArtistService,
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });

      service = TestBed.inject(ArtistService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should fetch artist data from API in browser', () => {
      service.getArtist('123').subscribe(data => {
        expect(data).toEqual(mockArtistData);
      });

      const req = httpMock.expectOne(environment.URL_SERVER + 'json/artist/123');
      expect(req.request.method).toBe('GET');
      req.flush(mockArtistData);
    });

    it('should handle errors in browser', () => {
      service.getArtist('invalid').subscribe({
        next: () => fail('should have failed with a 404'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(environment.URL_SERVER + 'json/artist/invalid');
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should use cached data from TransferState if available', () => {
      const mockTransferState = TestBed.inject(TransferState);
      const key = makeStateKey<ArtistData>(`artist-123`);

      spyOn(mockTransferState, 'get').and.callFake(<T>(useKey: StateKey<T>, defaultValue: T) => {
        expect(useKey).toBe(key);
        expect(defaultValue).toBeDefined();
        return mockArtistData as unknown as T;
      });

      let result: ArtistData | undefined;
      service.getArtist('123').subscribe(data => {
        result = data;
      });

      expect(result).toEqual(mockArtistData);

      httpMock.expectNone(environment.URL_SERVER + 'json/artist/123');
    });

    it('should make HTTP request when no cached data exists', () => {
      const mockTransferState = TestBed.inject(TransferState);

      spyOn(mockTransferState, 'get').and.returnValue(null);

      service.getArtist('123').subscribe();

      const req = httpMock.expectOne(environment.URL_SERVER + 'json/artist/123');
      expect(req.request.method).toBe('GET');
      req.flush(mockArtistData);
    });
  });

  describe('In server environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [],
        providers: [
          ArtistService,
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });

      service = TestBed.inject(ArtistService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should fetch artist data from API in server', () => {
      service.getArtist('123').subscribe(data => {
        expect(data).toEqual(mockArtistData);
      });

      const req = httpMock.expectOne(environment.URL_SERVER + 'json/artist/123');
      expect(req.request.method).toBe('GET');
      req.flush(mockArtistData);
    });

    it('should handle server-side specific logic if applicable', () => {
      service.getArtist('123').subscribe(data => {
        expect(data).toEqual(mockArtistData);
      });

      const req = httpMock.expectOne(environment.URL_SERVER + 'json/artist/123');
      expect(req.request.method).toBe('GET');
      req.flush(mockArtistData);
    });

    it('should store artist data in TransferState when on server', () => {
      const mockTransferState = TestBed.inject(TransferState);
      const key = makeStateKey<ArtistData>(`artist-123`);

      spyOn(mockTransferState, 'set').and.callThrough();

      service.getArtist('123').subscribe();

      const req = httpMock.expectOne(environment.URL_SERVER + 'json/artist/123');
      req.flush(mockArtistData);

      expect(mockTransferState.set).toHaveBeenCalledWith(key, mockArtistData);
    });
  });

  describe('Platform-independent tests', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [],
        providers: [
          ArtistService,
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting()
        ]
      });

      service = TestBed.inject(ArtistService);
    });

  });
});