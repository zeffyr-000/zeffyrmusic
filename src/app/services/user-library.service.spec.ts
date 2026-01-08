import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserLibraryService } from './user-library.service';
import { environment } from 'src/environments/environment';

describe('UserLibraryService', () => {
  let service: UserLibraryService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        UserLibraryService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    service = TestBed.inject(UserLibraryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Playlist operations', () => {
    it('should add a new playlist', () => {
      service.addPlaylist('123', 'Test Playlist');
      // No HTTP call expected, store is updated directly
    });

    it('should update playlist title', () => {
      service.updatePlaylistTitle('123', 'New Title');
      // No HTTP call expected, store is updated directly
    });

    it('should toggle playlist visibility', () => {
      service.togglePlaylistVisibility('123', true).subscribe();

      const req = httpMock.expectOne(
        `${environment.URL_SERVER}switch_publique?id_playlist=123&statut=prive`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true });
    });

    it('should delete playlist', () => {
      service.deletePlaylist('123').subscribe();

      const req = httpMock.expectOne(`${environment.URL_SERVER}playlist-supprimer/123`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true });
    });
  });

  describe('Follow operations', () => {
    it('should toggle follow', () => {
      service.toggleFollow('123', 'Title', 'Artist', 'image.jpg').subscribe();

      const req = httpMock.expectOne(`${environment.URL_SERVER}switch_suivi/123`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, est_suivi: true });
    });

    it('should remove follow', () => {
      service.removeFollow('123').subscribe();

      const req = httpMock.expectOne(`${environment.URL_SERVER}switch_suivi/123`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, est_suivi: false });
    });
  });

  describe('Like operations', () => {
    it('should add like', () => {
      service.addLike('abc123').subscribe();

      const req = httpMock.expectOne(`${environment.URL_SERVER}add_like`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ key: 'abc123' });
      req.flush({ success: true, like: { key: 'abc123', titre: 'Test' } });
    });

    it('should remove like', () => {
      service.removeLike('abc123').subscribe();

      const req = httpMock.expectOne(`${environment.URL_SERVER}remove_like`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ key: 'abc123' });
      req.flush({ success: true });
    });
  });

  describe('Video operations', () => {
    it('should add video to playlist', () => {
      service.addVideoToPlaylist('p1', 'key1', 'Title', 'Artist', 180).subscribe();

      const req = httpMock.expectOne(`${environment.URL_SERVER}insert_video`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        id_playlist: 'p1',
        key: 'key1',
        titre: 'Title',
        artiste: 'Artist',
        duree: 180,
      });
      req.flush({ success: true });
    });

    it('should remove video from playlist', () => {
      service.removeVideoFromPlaylist('v123').subscribe();

      const req = httpMock.expectOne(`${environment.URL_SERVER}supprimer/v123`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true });
    });
  });
});
