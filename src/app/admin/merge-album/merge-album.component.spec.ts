import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA, PLATFORM_ID, TemplateRef } from '@angular/core';
import { MergeAlbumComponent } from './merge-album.component';
import { AlbumAdminService } from '../../services/album-admin.service';
import { Playlist } from '../../models/playlist.model';
import { AuthStore, UiStore } from '../../store';
import { getTranslocoTestingProviders } from '../../transloco-testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

describe('MergeAlbumComponent', () => {
  let component: MergeAlbumComponent;
  let fixture: ComponentFixture<MergeAlbumComponent>;
  let albumAdminServiceMock: {
    getAlbumDetails: ReturnType<typeof vi.fn>;
    mergeAlbums: ReturnType<typeof vi.fn>;
  };
  let uiStore: InstanceType<typeof UiStore>;
  let authStore: InstanceType<typeof AuthStore>;

  const mockAlbum1: Playlist = {
    id_playlist: '100',
    id_perso: '',
    title: 'Album One',
    description: '',
    est_suivi: false,
    img_big: 'https://example.com/img1.jpg',
    og_image: '',
    liste_video: [],
    str_index: [],
    tab_video: [
      {
        id_video: 'v1',
        key: 'k1',
        titre: 'Track 1',
        artiste: 'Artist',
        duree: '180',
        artists: [],
        id_playlist: '100',
        ordre: '1',
        titre_album: 'Album One',
      },
      {
        id_video: 'v2',
        key: 'k2',
        titre: 'Track 2',
        artiste: 'Artist',
        duree: '200',
        artists: [],
        id_playlist: '100',
        ordre: '2',
        titre_album: 'Album One',
      },
    ],
    titre: 'Album One',
    artiste: 'Test Artist',
    year: 2020,
  };

  const mockAlbum2: Playlist = {
    id_playlist: '200',
    id_perso: '',
    title: 'Album Two',
    description: '',
    est_suivi: false,
    img_big: 'https://example.com/img2.jpg',
    og_image: '',
    liste_video: [],
    str_index: [],
    tab_video: [
      {
        id_video: 'v3',
        key: 'k3',
        titre: 'Track 3',
        artiste: 'Artist',
        duree: '210',
        artists: [],
        id_playlist: '200',
        ordre: '1',
        titre_album: 'Album Two',
      },
    ],
    titre: 'Album Two',
    artiste: 'Test Artist',
    year: 2021,
  };

  beforeEach(async () => {
    albumAdminServiceMock = {
      getAlbumDetails: vi.fn(),
      mergeAlbums: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MergeAlbumComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: AlbumAdminService, useValue: albumAdminServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'source' ? '100' : null),
              },
            },
          },
        },
        {
          provide: NgbModal,
          useValue: {
            open: vi.fn(),
            dismissAll: vi.fn(),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    authStore = TestBed.inject(AuthStore);
    authStore.login(
      { pseudo: 'admin', idPerso: '1', mail: 'admin@test.com', isAdmin: true },
      { darkModeEnabled: false, language: 'fr' }
    );

    uiStore = TestBed.inject(UiStore);
    vi.spyOn(uiStore, 'showSuccess').mockReturnValue('mock-id');
    vi.spyOn(uiStore, 'showError').mockReturnValue('mock-id');
  });

  describe('initialization', () => {
    it('should create', () => {
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(of(mockAlbum1));
      fixture = TestBed.createComponent(MergeAlbumComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should load album 1 from source query param', () => {
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(of(mockAlbum1));
      fixture = TestBed.createComponent(MergeAlbumComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(albumAdminServiceMock.getAlbumDetails).toHaveBeenCalledWith('100');
      expect(component.album1()).toEqual(mockAlbum1);
      expect(component.hasSourceParam()).toBe(true);
      expect(component.isLoadingAlbum1()).toBe(false);
    });

    it('should handle album 1 load error', () => {
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(throwError(() => new Error('fail')));
      fixture = TestBed.createComponent(MergeAlbumComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.album1()).toBeNull();
      expect(component.album1Error()).toBeTruthy();
    });

    it('should not set hasSourceParam when no source in URL', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [MergeAlbumComponent],
        providers: [
          getTranslocoTestingProviders(),
          { provide: AlbumAdminService, useValue: albumAdminServiceMock },
          { provide: PLATFORM_ID, useValue: 'browser' },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                queryParamMap: {
                  get: () => null,
                },
              },
            },
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).compileComponents();

      fixture = TestBed.createComponent(MergeAlbumComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.hasSourceParam()).toBe(false);
      expect(component.album1()).toBeNull();
      expect(albumAdminServiceMock.getAlbumDetails).not.toHaveBeenCalled();
    });

    it('should not flag albums with id_perso "0" as user playlists', () => {
      const albumWithZeroPerso = { ...mockAlbum1, id_perso: '0' };
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(of(albumWithZeroPerso));
      fixture = TestBed.createComponent(MergeAlbumComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.album1()).toEqual(albumWithZeroPerso);
      expect(component.album1Error()).toBe('');
    });

    it('should flag albums with real id_perso as user playlists', () => {
      const userAlbum = { ...mockAlbum1, id_perso: '456' };
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(of(userAlbum));
      fixture = TestBed.createComponent(MergeAlbumComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.album1()).toBeNull();
      expect(component.album1Error()).toBeTruthy();
    });

    it('should set error when source query param is invalid', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [MergeAlbumComponent],
        providers: [
          getTranslocoTestingProviders(),
          { provide: AlbumAdminService, useValue: albumAdminServiceMock },
          { provide: PLATFORM_ID, useValue: 'browser' },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                queryParamMap: {
                  get: (key: string) => (key === 'source' ? 'invalid-text' : null),
                },
              },
            },
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).compileComponents();

      fixture = TestBed.createComponent(MergeAlbumComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.hasSourceParam()).toBe(true);
      expect(component.album1()).toBeNull();
      expect(component.album1Error()).toBeTruthy();
      expect(albumAdminServiceMock.getAlbumDetails).not.toHaveBeenCalled();
    });
  });

  describe('parseAlbumId', () => {
    beforeEach(() => {
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(of(mockAlbum1));
      fixture = TestBed.createComponent(MergeAlbumComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should parse a numeric ID', () => {
      expect(component.parseAlbumId('123')).toBe('123');
    });

    it('should parse /playlist/123 URL', () => {
      expect(component.parseAlbumId('/playlist/456')).toBe('456');
    });

    it('should parse full URL with playlist/123', () => {
      expect(component.parseAlbumId('https://www.zeffyrmusic.com/playlist/789')).toBe('789');
    });

    it('should return null for invalid input', () => {
      expect(component.parseAlbumId('')).toBeNull();
      expect(component.parseAlbumId('abc')).toBeNull();
      expect(component.parseAlbumId('/artist/123')).toBeNull();
    });
  });

  describe('merge selection', () => {
    beforeEach(() => {
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(of(mockAlbum1));
      fixture = TestBed.createComponent(MergeAlbumComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should default all selections to album1', () => {
      expect(component.selectedKeepAlbum()).toBe('album1');
      expect(component.selectedTitre()).toBe('album1');
      expect(component.selectedArtiste()).toBe('album1');
      expect(component.selectedImage()).toBe('album1');
      expect(component.selectedVideos()).toBe('album1');
      expect(component.selectedYear()).toBe('album1');
    });

    it('should update selections', () => {
      component.onSelectKeepAlbum('album2');
      component.onSelectTitre('album2');
      component.onSelectArtiste('album2');
      component.onSelectImage('album2');
      component.onSelectVideos('album2');
      component.onSelectYear('album2');

      expect(component.selectedKeepAlbum()).toBe('album2');
      expect(component.selectedTitre()).toBe('album2');
      expect(component.selectedArtiste()).toBe('album2');
      expect(component.selectedImage()).toBe('album2');
      expect(component.selectedVideos()).toBe('album2');
      expect(component.selectedYear()).toBe('album2');
    });

    it('should compute bothLoaded correctly', () => {
      expect(component.bothLoaded()).toBe(false);

      component.album2.set(mockAlbum2);
      expect(component.bothLoaded()).toBe(true);
    });
  });

  describe('confirmMerge', () => {
    beforeEach(() => {
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(of(mockAlbum1));
      fixture = TestBed.createComponent(MergeAlbumComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      component.album2.set(mockAlbum2);
    });

    it('should submit merge request and update state on success', async () => {
      albumAdminServiceMock.mergeAlbums.mockReturnValue(of({ success: true }));

      await component.confirmMerge();

      expect(albumAdminServiceMock.mergeAlbums).toHaveBeenCalledWith(
        expect.objectContaining({
          keep_album_id: '100',
          delete_album_id: '200',
          titre_from: '100',
          artiste_from: '100',
          img_from: '100',
          videos_from: '100',
          year_from: '100',
        })
      );
      expect(uiStore.showSuccess).toHaveBeenCalled();
      expect(component.mergeSuccess()).toBe(true);
      expect(component.deletedAlbumChoice()).toBe('album2');
    });

    it('should use album2 values when selected', async () => {
      component.onSelectKeepAlbum('album2');
      component.onSelectTitre('album2');
      component.onSelectArtiste('album2');
      component.onSelectImage('album2');
      component.onSelectYear('album2');

      albumAdminServiceMock.mergeAlbums.mockReturnValue(of({ success: true }));

      await component.confirmMerge();

      expect(albumAdminServiceMock.mergeAlbums).toHaveBeenCalledWith(
        expect.objectContaining({
          keep_album_id: '200',
          delete_album_id: '100',
          titre_from: '200',
          artiste_from: '200',
          img_from: '200',
          year_from: '200',
        })
      );
      expect(component.mergeSuccess()).toBe(true);
      expect(component.deletedAlbumChoice()).toBe('album1');
    });

    it('should show error on merge failure', async () => {
      albumAdminServiceMock.mergeAlbums.mockReturnValue(of({ success: false, error: 'not_found' }));

      await component.confirmMerge();

      expect(uiStore.showError).toHaveBeenCalled();
      expect(component.mergeSuccess()).toBe(false);
      expect(component.deletedAlbumChoice()).toBeNull();
    });

    it('should show error on network failure', async () => {
      albumAdminServiceMock.mergeAlbums.mockReturnValue(throwError(() => new Error('network')));

      await component.confirmMerge();

      expect(uiStore.showError).toHaveBeenCalled();
      expect(component.isSubmitting()).toBe(false);
    });

    it('should not submit if albums are not loaded', async () => {
      component.album2.set(null);

      await component.confirmMerge();

      expect(albumAdminServiceMock.mergeAlbums).not.toHaveBeenCalled();
    });
  });

  describe('getAlbumDisplayTitle', () => {
    beforeEach(() => {
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(of(mockAlbum1));
      fixture = TestBed.createComponent(MergeAlbumComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should return titre when available', () => {
      expect(component.getAlbumDisplayTitle(mockAlbum1)).toBe('Album One');
    });

    it('should fall back to title when titre is empty', () => {
      const album = { ...mockAlbum1, titre: '', title: 'Fallback Title' };
      expect(component.getAlbumDisplayTitle(album)).toBe('Fallback Title');
    });
  });

  describe('resetAlbum1', () => {
    beforeEach(() => {
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(of(mockAlbum1));
      fixture = TestBed.createComponent(MergeAlbumComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should clear album1 data', () => {
      expect(component.album1()).toEqual(mockAlbum1);

      component.resetAlbum1();

      expect(component.album1()).toBeNull();
      expect(component.album1Error()).toBe('');
    });
  });

  describe('resetAlbum2', () => {
    beforeEach(() => {
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(of(mockAlbum1));
      fixture = TestBed.createComponent(MergeAlbumComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      component.album2.set(mockAlbum2);
    });

    it('should clear album2 data and reset merge state', () => {
      component.mergeSuccess.set(true);
      component.onSelectKeepAlbum('album2');

      component.resetAlbum2();

      expect(component.album2()).toBeNull();
      expect(component.album2Error()).toBe('');
      expect(component.mergeSuccess()).toBe(false);
      expect(component.selectedKeepAlbum()).toBe('album1');
    });
  });

  describe('openConfirmModal', () => {
    beforeEach(() => {
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(of(mockAlbum1));
      fixture = TestBed.createComponent(MergeAlbumComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should open the modal with the template', () => {
      const modalService = TestBed.inject(NgbModal);
      const mockRef = { result: Promise.resolve() };
      const openSpy = vi.spyOn(modalService, 'open').mockReturnValue(mockRef as never);
      const fakeTemplate = {} as TemplateRef<unknown>;

      component.openConfirmModal(fakeTemplate);

      expect(openSpy).toHaveBeenCalledWith(fakeTemplate, { centered: true, size: 'md' });
    });
  });

  describe('submitAlbum1', () => {
    beforeEach(() => {
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(of(mockAlbum1));
      fixture = TestBed.createComponent(MergeAlbumComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      // Reset album1 to test submitAlbum1 independently
      component.album1.set(null);
    });

    it('should load album successfully', async () => {
      component.album1Model.set({ albumInput: '100' });
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(of(mockAlbum1));

      await component.submitAlbum1();

      expect(component.album1()).toEqual(mockAlbum1);
      expect(component.isLoadingAlbum1()).toBe(false);
      expect(component.album1Error()).toBe('');
    });

    it('should set error for user playlist', async () => {
      component.album1Model.set({ albumInput: '100' });
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(of({ ...mockAlbum1, id_perso: '456' }));

      await component.submitAlbum1();

      expect(component.album1()).toBeNull();
      expect(component.album1Error()).toBeTruthy();
    });

    it('should set error for album not found', async () => {
      component.album1Model.set({ albumInput: '999' });
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(
        of({ ...mockAlbum1, titre: '', title: '' })
      );

      await component.submitAlbum1();

      expect(component.album1()).toBeNull();
      expect(component.album1Error()).toBeTruthy();
    });

    it('should set error on network failure', async () => {
      component.album1Model.set({ albumInput: '100' });
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(throwError(() => new Error('fail')));

      await component.submitAlbum1();

      expect(component.album1()).toBeNull();
      expect(component.album1Error()).toBeTruthy();
      expect(component.isLoadingAlbum1()).toBe(false);
    });

    it('should do nothing if input is invalid', async () => {
      component.album1Model.set({ albumInput: 'abc' });
      albumAdminServiceMock.getAlbumDetails.mockClear();

      await component.submitAlbum1();

      expect(albumAdminServiceMock.getAlbumDetails).not.toHaveBeenCalled();
    });
  });

  describe('submitAlbum2', () => {
    beforeEach(() => {
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(of(mockAlbum1));
      fixture = TestBed.createComponent(MergeAlbumComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should load album2 successfully', async () => {
      component.album2Model.set({ albumInput: '200' });
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(of(mockAlbum2));

      await component.submitAlbum2();

      expect(component.album2()).toEqual(mockAlbum2);
      expect(component.isLoadingAlbum2()).toBe(false);
    });

    it('should reject same album as album1', async () => {
      component.album2Model.set({ albumInput: '100' });

      await component.submitAlbum2();

      expect(component.album2Error()).toBeTruthy();
      expect(component.album2()).toBeNull();
    });

    it('should set error for album not found', async () => {
      component.album2Model.set({ albumInput: '999' });
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(
        of({ ...mockAlbum2, titre: '', title: '' })
      );

      await component.submitAlbum2();

      expect(component.album2()).toBeNull();
      expect(component.album2Error()).toBeTruthy();
    });

    it('should set error for user playlist', async () => {
      component.album2Model.set({ albumInput: '200' });
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(of({ ...mockAlbum2, id_perso: '789' }));

      await component.submitAlbum2();

      expect(component.album2()).toBeNull();
      expect(component.album2Error()).toBeTruthy();
    });

    it('should set error on network failure', async () => {
      component.album2Model.set({ albumInput: '200' });
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(throwError(() => new Error('fail')));

      await component.submitAlbum2();

      expect(component.album2Error()).toBeTruthy();
      expect(component.isLoadingAlbum2()).toBe(false);
    });

    it('should do nothing if input is invalid', async () => {
      component.album2Model.set({ albumInput: '' });
      albumAdminServiceMock.getAlbumDetails.mockClear();

      await component.submitAlbum2();

      expect(albumAdminServiceMock.getAlbumDetails).not.toHaveBeenCalled();
    });
  });

  describe('loadAlbum1 not found', () => {
    it('should set error when album data has no title', () => {
      albumAdminServiceMock.getAlbumDetails.mockReturnValue(
        of({ ...mockAlbum1, titre: '', title: '' })
      );
      fixture = TestBed.createComponent(MergeAlbumComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.album1()).toBeNull();
      expect(component.album1Error()).toBeTruthy();
    });
  });
});
