import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA, PLATFORM_ID, TemplateRef } from '@angular/core';
import { MergeArtistComponent } from './merge-artist.component';
import { ArtistAdminService } from '../../services/artist-admin.service';
import { ArtistData } from '../../models/artist.model';
import { AuthStore, UiStore } from '../../store';
import { getTranslocoTestingProviders } from '../../transloco-testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

describe('MergeArtistComponent', () => {
  let component: MergeArtistComponent;
  let fixture: ComponentFixture<MergeArtistComponent>;
  let artistAdminServiceMock: {
    getArtistDetails: ReturnType<typeof vi.fn>;
    mergeArtists: ReturnType<typeof vi.fn>;
  };
  let uiStore: InstanceType<typeof UiStore>;
  let authStore: InstanceType<typeof AuthStore>;

  const mockArtist1: ArtistData = {
    id_artist: '10',
    nom: 'Artist One',
    id_artiste_deezer: '111',
    list_albums: [
      {
        artist: 'Artist One',
        id_playlist: '1001',
        img_big: 'https://example.com/a1.jpg',
        title: 'Album A',
        titre: 'Album A',
        year_release: 2020,
      },
      {
        artist: 'Artist One',
        id_playlist: '1002',
        img_big: 'https://example.com/a2.jpg',
        title: 'Album B',
        titre: 'Album B',
        year_release: 2021,
      },
    ],
  };

  const mockArtist2: ArtistData = {
    id_artist: '20',
    nom: 'Artist Two',
    id_artiste_deezer: '222',
    list_albums: [
      {
        artist: 'Artist Two',
        id_playlist: '2001',
        img_big: 'https://example.com/b1.jpg',
        title: 'Album C',
        titre: 'Album C',
        year_release: 2022,
      },
    ],
  };

  beforeEach(async () => {
    artistAdminServiceMock = {
      getArtistDetails: vi.fn(),
      mergeArtists: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MergeArtistComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: ArtistAdminService, useValue: artistAdminServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'source' ? '10' : null),
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
      artistAdminServiceMock.getArtistDetails.mockReturnValue(of(mockArtist1));
      fixture = TestBed.createComponent(MergeArtistComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should load artist 1 from source query param', () => {
      artistAdminServiceMock.getArtistDetails.mockReturnValue(of(mockArtist1));
      fixture = TestBed.createComponent(MergeArtistComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(artistAdminServiceMock.getArtistDetails).toHaveBeenCalledWith('10');
      expect(component.artist1()).toEqual(mockArtist1);
      expect(component.hasSourceParam()).toBe(true);
      expect(component.isLoadingArtist1()).toBe(false);
    });

    it('should handle artist 1 load error', () => {
      artistAdminServiceMock.getArtistDetails.mockReturnValue(throwError(() => new Error('fail')));
      fixture = TestBed.createComponent(MergeArtistComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.artist1()).toBeNull();
      expect(component.artist1Error()).toBeTruthy();
    });

    it('should not set hasSourceParam when no source in URL', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [MergeArtistComponent],
        providers: [
          getTranslocoTestingProviders(),
          { provide: ArtistAdminService, useValue: artistAdminServiceMock },
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

      fixture = TestBed.createComponent(MergeArtistComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.hasSourceParam()).toBe(false);
      expect(component.artist1()).toBeNull();
      expect(artistAdminServiceMock.getArtistDetails).not.toHaveBeenCalled();
    });

    it('should set error when source query param is invalid', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [MergeArtistComponent],
        providers: [
          getTranslocoTestingProviders(),
          { provide: ArtistAdminService, useValue: artistAdminServiceMock },
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

      fixture = TestBed.createComponent(MergeArtistComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.hasSourceParam()).toBe(true);
      expect(component.artist1()).toBeNull();
      expect(component.artist1Error()).toBeTruthy();
      expect(artistAdminServiceMock.getArtistDetails).not.toHaveBeenCalled();
    });
  });

  describe('parseArtistId', () => {
    beforeEach(() => {
      artistAdminServiceMock.getArtistDetails.mockReturnValue(of(mockArtist1));
      fixture = TestBed.createComponent(MergeArtistComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should parse a numeric ID', () => {
      expect(component.parseArtistId('123')).toBe('123');
    });

    it('should parse /artist/123 URL', () => {
      expect(component.parseArtistId('/artist/456')).toBe('456');
    });

    it('should parse full URL with artist/123', () => {
      expect(component.parseArtistId('https://www.zeffyrmusic.com/artist/789')).toBe('789');
    });

    it('should return null for invalid input', () => {
      expect(component.parseArtistId('')).toBeNull();
      expect(component.parseArtistId('abc')).toBeNull();
      expect(component.parseArtistId('/playlist/123')).toBeNull();
    });
  });

  describe('merge selection', () => {
    beforeEach(() => {
      artistAdminServiceMock.getArtistDetails.mockReturnValue(of(mockArtist1));
      fixture = TestBed.createComponent(MergeArtistComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should default all selections to artist1', () => {
      expect(component.selectedKeepArtist()).toBe('artist1');
      expect(component.selectedNom()).toBe('artist1');
      expect(component.selectedDeezerId()).toBe('artist1');
    });

    it('should update selections', () => {
      component.onSelectKeepArtist('artist2');
      component.onSelectNom('artist2');
      component.onSelectDeezerId('artist2');

      expect(component.selectedKeepArtist()).toBe('artist2');
      expect(component.selectedNom()).toBe('artist2');
      expect(component.selectedDeezerId()).toBe('artist2');
    });

    it('should compute bothLoaded correctly', () => {
      expect(component.bothLoaded()).toBe(false);

      component.artist2.set(mockArtist2);
      expect(component.bothLoaded()).toBe(true);
    });
  });

  describe('confirmMerge', () => {
    beforeEach(() => {
      artistAdminServiceMock.getArtistDetails.mockReturnValue(of(mockArtist1));
      fixture = TestBed.createComponent(MergeArtistComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      component.artist2.set(mockArtist2);
    });

    it('should submit merge request and update state on success', async () => {
      artistAdminServiceMock.mergeArtists.mockReturnValue(of({ success: true }));

      await component.confirmMerge();

      expect(artistAdminServiceMock.mergeArtists).toHaveBeenCalledWith(
        expect.objectContaining({
          keep_artist_id: '10',
          delete_artist_id: '20',
          nom_from: '10',
          id_artiste_deezer_from: '10',
        })
      );
      expect(uiStore.showSuccess).toHaveBeenCalled();
      expect(component.mergeSuccess()).toBe(true);
      expect(component.deletedArtistChoice()).toBe('artist2');
    });

    it('should use artist2 values when selected', async () => {
      component.onSelectKeepArtist('artist2');
      component.onSelectNom('artist2');
      component.onSelectDeezerId('artist2');

      artistAdminServiceMock.mergeArtists.mockReturnValue(of({ success: true }));

      await component.confirmMerge();

      expect(artistAdminServiceMock.mergeArtists).toHaveBeenCalledWith(
        expect.objectContaining({
          keep_artist_id: '20',
          delete_artist_id: '10',
          nom_from: '20',
          id_artiste_deezer_from: '20',
        })
      );
      expect(component.mergeSuccess()).toBe(true);
      expect(component.deletedArtistChoice()).toBe('artist1');
    });

    it('should merge albums from both artists on success', async () => {
      artistAdminServiceMock.mergeArtists.mockReturnValue(of({ success: true }));

      await component.confirmMerge();

      const kept = component.artist1();
      expect(kept!.list_albums.length).toBe(3);
    });

    it('should show error on merge failure', async () => {
      artistAdminServiceMock.mergeArtists.mockReturnValue(
        of({ success: false, error: 'not_found' })
      );

      await component.confirmMerge();

      expect(uiStore.showError).toHaveBeenCalled();
      expect(component.mergeSuccess()).toBe(false);
      expect(component.deletedArtistChoice()).toBeNull();
    });

    it('should show error on network failure', async () => {
      artistAdminServiceMock.mergeArtists.mockReturnValue(throwError(() => new Error('network')));

      await component.confirmMerge();

      expect(uiStore.showError).toHaveBeenCalled();
      expect(component.isSubmitting()).toBe(false);
    });

    it('should not submit if artists are not loaded', async () => {
      component.artist2.set(null);

      await component.confirmMerge();

      expect(artistAdminServiceMock.mergeArtists).not.toHaveBeenCalled();
    });
  });

  describe('getArtistImageUrl', () => {
    beforeEach(() => {
      artistAdminServiceMock.getArtistDetails.mockReturnValue(of(mockArtist1));
      fixture = TestBed.createComponent(MergeArtistComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should return Deezer image URL', () => {
      expect(component.getArtistImageUrl(mockArtist1)).toBe(
        'https://api.deezer.com/artist/111/image?size=big'
      );
    });
  });

  describe('resetArtist1', () => {
    beforeEach(() => {
      artistAdminServiceMock.getArtistDetails.mockReturnValue(of(mockArtist1));
      fixture = TestBed.createComponent(MergeArtistComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should clear artist1 data', () => {
      expect(component.artist1()).toEqual(mockArtist1);

      component.resetArtist1();

      expect(component.artist1()).toBeNull();
      expect(component.artist1Error()).toBe('');
    });
  });

  describe('resetArtist2', () => {
    beforeEach(() => {
      artistAdminServiceMock.getArtistDetails.mockReturnValue(of(mockArtist1));
      fixture = TestBed.createComponent(MergeArtistComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      component.artist2.set(mockArtist2);
    });

    it('should clear artist2 data and reset merge state', () => {
      component.mergeSuccess.set(true);
      component.onSelectKeepArtist('artist2');

      component.resetArtist2();

      expect(component.artist2()).toBeNull();
      expect(component.artist2Error()).toBe('');
      expect(component.mergeSuccess()).toBe(false);
      expect(component.selectedKeepArtist()).toBe('artist1');
    });
  });

  describe('openConfirmModal', () => {
    beforeEach(() => {
      artistAdminServiceMock.getArtistDetails.mockReturnValue(of(mockArtist1));
      fixture = TestBed.createComponent(MergeArtistComponent);
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

  describe('submitArtist1', () => {
    beforeEach(() => {
      artistAdminServiceMock.getArtistDetails.mockReturnValue(of(mockArtist1));
      fixture = TestBed.createComponent(MergeArtistComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      component.artist1.set(null);
    });

    it('should load artist successfully', async () => {
      component.artist1Model.set({ artistInput: '10' });
      artistAdminServiceMock.getArtistDetails.mockReturnValue(of(mockArtist1));

      await component.submitArtist1();

      expect(component.artist1()).toEqual(mockArtist1);
      expect(component.isLoadingArtist1()).toBe(false);
      expect(component.artist1Error()).toBe('');
    });

    it('should set error for artist not found', async () => {
      component.artist1Model.set({ artistInput: '999' });
      artistAdminServiceMock.getArtistDetails.mockReturnValue(of({ ...mockArtist1, nom: '' }));

      await component.submitArtist1();

      expect(component.artist1()).toBeNull();
      expect(component.artist1Error()).toBeTruthy();
    });

    it('should set error on network failure', async () => {
      component.artist1Model.set({ artistInput: '10' });
      artistAdminServiceMock.getArtistDetails.mockReturnValue(throwError(() => new Error('fail')));

      await component.submitArtist1();

      expect(component.artist1()).toBeNull();
      expect(component.artist1Error()).toBeTruthy();
      expect(component.isLoadingArtist1()).toBe(false);
    });

    it('should do nothing if input is invalid', async () => {
      component.artist1Model.set({ artistInput: 'abc' });
      artistAdminServiceMock.getArtistDetails.mockClear();

      await component.submitArtist1();

      expect(artistAdminServiceMock.getArtistDetails).not.toHaveBeenCalled();
    });

    it('should reject same artist as artist2', async () => {
      component.artist2.set(mockArtist2);
      component.artist1Model.set({ artistInput: '20' });

      await component.submitArtist1();

      expect(component.artist1Error()).toBeTruthy();
      expect(component.artist1()).toBeNull();
    });
  });

  describe('submitArtist2', () => {
    beforeEach(() => {
      artistAdminServiceMock.getArtistDetails.mockReturnValue(of(mockArtist1));
      fixture = TestBed.createComponent(MergeArtistComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should load artist2 successfully', async () => {
      component.artist2Model.set({ artistInput: '20' });
      artistAdminServiceMock.getArtistDetails.mockReturnValue(of(mockArtist2));

      await component.submitArtist2();

      expect(component.artist2()).toEqual(mockArtist2);
      expect(component.isLoadingArtist2()).toBe(false);
    });

    it('should reject same artist as artist1', async () => {
      component.artist2Model.set({ artistInput: '10' });

      await component.submitArtist2();

      expect(component.artist2Error()).toBeTruthy();
      expect(component.artist2()).toBeNull();
    });

    it('should set error for artist not found', async () => {
      component.artist2Model.set({ artistInput: '999' });
      artistAdminServiceMock.getArtistDetails.mockReturnValue(of({ ...mockArtist2, nom: '' }));

      await component.submitArtist2();

      expect(component.artist2()).toBeNull();
      expect(component.artist2Error()).toBeTruthy();
    });

    it('should set error on network failure', async () => {
      component.artist2Model.set({ artistInput: '20' });
      artistAdminServiceMock.getArtistDetails.mockReturnValue(throwError(() => new Error('fail')));

      await component.submitArtist2();

      expect(component.artist2Error()).toBeTruthy();
      expect(component.isLoadingArtist2()).toBe(false);
    });
  });
});
