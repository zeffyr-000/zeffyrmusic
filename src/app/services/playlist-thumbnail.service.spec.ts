import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { PlaylistThumbnailService } from './playlist-thumbnail.service';
import { environment } from 'src/environments/environment';

describe('PlaylistThumbnailService', () => {
  let service: PlaylistThumbnailService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PlaylistThumbnailService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(PlaylistThumbnailService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('uploadThumbnail', () => {
    it('should POST to the correct endpoint with FormData', () => {
      const mockBlob = new Blob(['data'], { type: 'image/jpeg' });
      const mockResult = { img_big: 'https://cdn.example.com/custom.jpg' };

      service.uploadThumbnail('playlist-123', mockBlob, 'image/jpeg').subscribe(result => {
        expect(result).toEqual(mockResult);
      });

      const req = httpMock.expectOne(`${environment.URL_SERVER}playlist-image/playlist-123`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      req.flush(mockResult);
    });

    it('should set the correct filename extension for jpeg', () => {
      const mockBlob = new Blob(['data'], { type: 'image/jpeg' });

      service.uploadThumbnail('abc', mockBlob, 'image/jpeg').subscribe();

      const req = httpMock.expectOne(`${environment.URL_SERVER}playlist-image/abc`);
      const formData: FormData = req.request.body;
      const file = formData.get('image') as File;
      expect(file.name).toBe('thumbnail.jpeg');
      req.flush({ img_big: '' });
    });

    it('should set the correct filename extension for png', () => {
      const mockBlob = new Blob(['data'], { type: 'image/png' });

      service.uploadThumbnail('abc', mockBlob, 'image/png').subscribe();

      const req = httpMock.expectOne(`${environment.URL_SERVER}playlist-image/abc`);
      const formData: FormData = req.request.body;
      const file = formData.get('image') as File;
      expect(file.name).toBe('thumbnail.png');
      req.flush({ img_big: '' });
    });

    it('should set the correct filename extension for gif', () => {
      const mockBlob = new Blob(['data'], { type: 'image/gif' });

      service.uploadThumbnail('abc', mockBlob, 'image/gif').subscribe();

      const req = httpMock.expectOne(`${environment.URL_SERVER}playlist-image/abc`);
      const formData: FormData = req.request.body;
      const file = formData.get('image') as File;
      expect(file.name).toBe('thumbnail.gif');
      req.flush({ img_big: '' });
    });
  });

  describe('resetThumbnail', () => {
    it('should POST to the correct delete endpoint', () => {
      const mockResult = { img_big: '' };

      service.resetThumbnail('playlist-123').subscribe(result => {
        expect(result).toEqual(mockResult);
      });

      const req = httpMock.expectOne(`${environment.URL_SERVER}playlist-image-delete/playlist-123`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResult);
    });

    it('should propagate HTTP errors', () => {
      let errorThrown = false;

      service.resetThumbnail('playlist-123').subscribe({
        error: () => {
          errorThrown = true;
        },
      });

      const req = httpMock.expectOne(`${environment.URL_SERVER}playlist-image-delete/playlist-123`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorThrown).toBe(true);
    });
  });
});
