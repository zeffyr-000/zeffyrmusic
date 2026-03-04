import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { LyricsService } from './lyrics.service';
import { environment } from '../../environments/environment';
import { LyricsResponse } from '../models/lyrics.model';

describe('LyricsService', () => {
  let service: LyricsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LyricsService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(LyricsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch synced lyrics', () => {
    const mockResponse: LyricsResponse = {
      success: true,
      synced: true,
      lines: [
        { time: 12.5, text: 'I feel your breath upon my neck' },
        { time: 15.3, text: "The clock won't stop" },
      ],
      plainLyrics: "I feel your breath upon my neck\nThe clock won't stop",
      trackName: 'I Want to Live',
      artistName: 'Borislav Slavov',
    };

    service.getLyrics('12345').subscribe(data => {
      expect(data).toEqual(mockResponse);
      expect(data.synced).toBe(true);
      expect(data.lines).toHaveLength(2);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'lyrics/12345');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch plain-only lyrics when synced is false', () => {
    const mockResponse: LyricsResponse = {
      success: true,
      synced: false,
      lines: null,
      plainLyrics: 'Some plain lyrics text\nLine two',
      trackName: 'Some Track',
      artistName: 'Some Artist',
    };

    service.getLyrics('67890').subscribe(data => {
      expect(data.synced).toBe(false);
      expect(data.lines).toBeNull();
      expect(data.plainLyrics).toBeTruthy();
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'lyrics/67890');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should propagate HTTP errors to the subscriber', () => {
    service.getLyrics('99999').subscribe({
      error: (error: { status: number }) => {
        expect(error.status).toBe(404);
      },
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'lyrics/99999');
    req.flush({ error: 'lyrics_not_found' }, { status: 404, statusText: 'Not Found' });
  });

  it('should encode the video ID in the URL', () => {
    service.getLyrics('123 456').subscribe();

    const req = httpMock.expectOne(environment.URL_SERVER + 'lyrics/123%20456');
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      synced: false,
      lines: null,
      plainLyrics: null,
      trackName: null,
      artistName: null,
    });
  });

  it('should return cached response on subsequent calls for the same video', () => {
    const mockResponse: LyricsResponse = {
      success: true,
      synced: true,
      lines: [{ time: 0, text: 'Hello' }],
      plainLyrics: 'Hello',
      trackName: 'Cached Track',
      artistName: 'Cached Artist',
    };

    // First call — hits HTTP
    service.getLyrics('cached-id').subscribe(data => {
      expect(data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'lyrics/cached-id');
    req.flush(mockResponse);

    // Second call — should use cache, no HTTP request
    service.getLyrics('cached-id').subscribe(data => {
      expect(data).toEqual(mockResponse);
    });

    httpMock.expectNone(environment.URL_SERVER + 'lyrics/cached-id');
  });

  it('should not cache HTTP errors', () => {
    // First call — fails
    service.getLyrics('error-id').subscribe({
      error: () => {
        // expected
      },
    });

    const req1 = httpMock.expectOne(environment.URL_SERVER + 'lyrics/error-id');
    req1.flush({ error: 'lyrics_not_found' }, { status: 404, statusText: 'Not Found' });

    // Second call — should hit HTTP again (not cached)
    service.getLyrics('error-id').subscribe();

    httpMock.expectOne(environment.URL_SERVER + 'lyrics/error-id');
  });

  it('should clear the cache', () => {
    const mockResponse: LyricsResponse = {
      success: true,
      synced: false,
      lines: null,
      plainLyrics: 'test',
      trackName: 'T',
      artistName: 'A',
    };

    // Populate cache
    service.getLyrics('clear-id').subscribe();
    const req = httpMock.expectOne(environment.URL_SERVER + 'lyrics/clear-id');
    req.flush(mockResponse);

    // Clear cache
    service.clearCache();

    // Should hit HTTP again
    service.getLyrics('clear-id').subscribe();
    httpMock.expectOne(environment.URL_SERVER + 'lyrics/clear-id');
  });
});
