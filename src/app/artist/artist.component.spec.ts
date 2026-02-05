import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { PLATFORM_ID } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ArtistComponent } from './artist.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ArtistService } from '../services/artist.service';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { environment } from '../../environments/environment';
import { ArtistData, RelatedArtist } from '../models/artist.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthStore } from '../store';

describe('ArtistComponent', () => {
  let component: ArtistComponent;
  let fixture: ComponentFixture<ArtistComponent>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let activatedRoute: ActivatedRoute;
  let titleService: Title;
  let metaService: Meta;
  let googleAnalyticsService: GoogleAnalyticsService;
  let translocoService: TranslocoService;
  let artistServiceMock: Partial<ArtistService>;
  let modalServiceMock: Partial<NgbModal>;

  const relatedArtists: RelatedArtist[] = [
    { id_artiste: 45, nom: 'Justice', id_artiste_deezer: 293 },
    { id_artiste: 78, nom: 'Kavinsky', id_artiste_deezer: 456 },
  ];

  const data: ArtistData = {
    nom: 'Test Artist',
    id_artiste_deezer: '123',
    id_artist: '1',
    list_albums: [],
    biography_fr: 'Biographie en français',
    biography_en: 'Biography in English',
    related_artists: relatedArtists,
  };

  describe('In browser environment', () => {
    beforeEach(async () => {
      artistServiceMock = {
        getArtist: vi.fn().mockReturnValue(of(data)),
      };

      modalServiceMock = {
        open: vi.fn(),
      };

      await TestBed.configureTestingModule({
        imports: [ArtistComponent, FontAwesomeTestingModule],
        providers: [
          getTranslocoTestingProviders(),
          { provide: ArtistService, useValue: artistServiceMock },
          { provide: NgbModal, useValue: modalServiceMock },
          { provide: PLATFORM_ID, useValue: 'browser' },
          {
            provide: ActivatedRoute,
            useValue: {
              params: of({ id_artist: '1' }),
              snapshot: {
                paramMap: {
                  get: () => '1',
                },
                url: ['artist', '1'],
              },
            },
          },
          {
            provide: Title,
            useValue: {
              setTitle: vi.fn(),
            },
          },
          {
            provide: Meta,
            useValue: {
              updateTag: vi.fn(),
            },
          },
          {
            provide: GoogleAnalyticsService,
            useValue: {
              pageView: vi.fn(),
            },
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).compileComponents();

      translocoService = TestBed.inject(TranslocoService);
      translocoService.setDefaultLang('en');

      fixture = TestBed.createComponent(ArtistComponent);
      component = fixture.componentInstance;
      activatedRoute = TestBed.inject(ActivatedRoute);
      titleService = TestBed.inject(Title);
      metaService = TestBed.inject(Meta);
      googleAnalyticsService = TestBed.inject(GoogleAnalyticsService);

      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should set title and track pageview on init', () => {
      component.initLoad();
      expect(titleService.setTitle).toHaveBeenCalledWith(
        translocoService.translate('title_artist', { artist: 'Test Artist' })
      );
      expect(googleAnalyticsService.pageView).toHaveBeenCalledWith('artist/1');
    });

    it('should set isAvailable to false when artist name is not provided', () => {
      const emptyData = {};

      artistServiceMock.getArtist = vi.fn().mockReturnValue(of(emptyData));

      component.initLoad();
      expect(component.isAvailable()).toBe(false);
    });

    it('should set isAvailable to true when artist name is provided', () => {
      component.initLoad();

      expect(component.isAvailable()).toBe(true);
    });

    it('should populate biography signals from API data', () => {
      component.initLoad();

      expect(component.biographyFr()).toBe('Biographie en français');
      expect(component.biographyEn()).toBe('Biography in English');
    });

    it('should populate related artists from API data', () => {
      component.initLoad();

      expect(component.relatedArtists()).toEqual(relatedArtists);
      expect(component.relatedArtists().length).toBe(2);
    });

    it('should return English biography when language is en', () => {
      const authStore = TestBed.inject(AuthStore);
      authStore.setLanguage('en');
      component.initLoad();

      expect(component.biography()).toBe('Biography in English');
    });

    it('should return French biography when language is fr', () => {
      const authStore = TestBed.inject(AuthStore);
      authStore.setLanguage('fr');
      component.initLoad();

      expect(component.biography()).toBe('Biographie en français');
    });

    it('should return empty string when biography is not available for selected language', () => {
      const dataWithoutBio: ArtistData = {
        ...data,
        biography_fr: '',
        biography_en: '',
      };
      artistServiceMock.getArtist = vi.fn().mockReturnValue(of(dataWithoutBio));

      component.initLoad();

      expect(component.biography()).toBe('');
    });

    it('should handle empty related_artists array', () => {
      const dataWithoutRelated: ArtistData = {
        ...data,
        related_artists: [],
      };
      artistServiceMock.getArtist = vi.fn().mockReturnValue(of(dataWithoutRelated));

      component.initLoad();

      expect(component.relatedArtists()).toEqual([]);
    });

    it('should open share modal when openShareModal is called', () => {
      const mockTemplate = {} as unknown;

      component.openShareModal(mockTemplate as never);

      expect(modalServiceMock.open).toHaveBeenCalledWith(mockTemplate, {
        centered: true,
        size: 'md',
      });
    });

    it('should truncate biography when longer than 120 characters', () => {
      const longBio = 'A'.repeat(200);
      const dataWithLongBio: ArtistData = {
        ...data,
        biography_en: longBio,
      };
      artistServiceMock.getArtist = vi.fn().mockReturnValue(of(dataWithLongBio));
      const authStore = TestBed.inject(AuthStore);
      authStore.setLanguage('en');

      component.initLoad();

      expect(component.biographyNeedsTruncation()).toBe(true);
      expect(component.biographyTruncated().length).toBeLessThan(longBio.length);
      expect(component.biographyTruncated().endsWith('…')).toBe(true);
    });

    it('should truncate at word boundary when biography contains spaces', () => {
      const longBio =
        'This is a long biography that contains multiple words and should be truncated at a word boundary to avoid cutting words in half';
      const dataWithLongBio: ArtistData = {
        ...data,
        biography_en: longBio,
      };
      artistServiceMock.getArtist = vi.fn().mockReturnValue(of(dataWithLongBio));
      const authStore = TestBed.inject(AuthStore);
      authStore.setLanguage('en');

      component.initLoad();

      expect(component.biographyNeedsTruncation()).toBe(true);
      const truncated = component.biographyTruncated();
      // Should end with ellipsis and not cut a word in half
      expect(truncated.endsWith('…')).toBe(true);
      // The character before ellipsis should be a letter (end of word), not a space
      const charBeforeEllipsis = truncated.charAt(truncated.length - 2);
      expect(charBeforeEllipsis).not.toBe(' ');
    });

    it('should truncate at 120 characters when biography has no spaces', () => {
      const longBioNoSpaces = 'A'.repeat(200);
      const dataWithLongBio: ArtistData = {
        ...data,
        biography_en: longBioNoSpaces,
      };
      artistServiceMock.getArtist = vi.fn().mockReturnValue(of(dataWithLongBio));
      const authStore = TestBed.inject(AuthStore);
      authStore.setLanguage('en');

      component.initLoad();

      expect(component.biographyNeedsTruncation()).toBe(true);
      // Should be 120 chars + ellipsis = 121
      expect(component.biographyTruncated().length).toBe(121);
      expect(component.biographyTruncated()).toBe('A'.repeat(120) + '…');
    });

    it('should not truncate biography when shorter than 120 characters', () => {
      const shortBio = 'Short biography';
      const dataWithShortBio: ArtistData = {
        ...data,
        biography_en: shortBio,
      };
      artistServiceMock.getArtist = vi.fn().mockReturnValue(of(dataWithShortBio));
      const authStore = TestBed.inject(AuthStore);
      authStore.setLanguage('en');

      component.initLoad();

      expect(component.biographyNeedsTruncation()).toBe(false);
      expect(component.biographyTruncated()).toBe(shortBio);
    });

    it('should toggle biography expanded state', () => {
      expect(component.biographyExpanded()).toBe(false);

      component.toggleBiography();
      expect(component.biographyExpanded()).toBe(true);

      component.toggleBiography();
      expect(component.biographyExpanded()).toBe(false);
    });

    it('should reset state and scroll to top when navigating to a different artist', () => {
      // First, load an artist and expand biography
      component.initLoad();
      component.toggleBiography();
      expect(component.biographyExpanded()).toBe(true);
      expect(component.name()).toBe('Test Artist');

      // Simulate navigation to a different artist
      const newArtistData: ArtistData = {
        nom: 'New Artist',
        id_artiste_deezer: '456',
        id_artist: '2',
        list_albums: [],
        biography_fr: 'Nouvelle bio',
        biography_en: 'New bio',
        related_artists: [],
      };
      artistServiceMock.getArtist = vi.fn().mockReturnValue(of(newArtistData));

      // Trigger params change (simulates navigation)
      component.ngOnInit();

      // State should be reset
      expect(component.biographyExpanded()).toBe(false);
      expect(component.name()).toBe('New Artist');
    });

    it('should handle API error and set loading/available states', () => {
      artistServiceMock.getArtist = vi
        .fn()
        .mockReturnValue(throwError(() => new Error('API Error')));

      component.initLoad();

      expect(component.isLoading()).toBe(false);
      expect(component.isAvailable()).toBe(false);
    });
  });

  describe('In server environment', () => {
    beforeEach(async () => {
      artistServiceMock = {
        getArtist: vi.fn().mockReturnValue(of(data)),
      };

      modalServiceMock = {
        open: vi.fn(),
      };

      await TestBed.configureTestingModule({
        imports: [ArtistComponent, FontAwesomeTestingModule],
        providers: [
          getTranslocoTestingProviders(),
          { provide: ArtistService, useValue: artistServiceMock },
          { provide: NgbModal, useValue: modalServiceMock },
          { provide: PLATFORM_ID, useValue: 'server' },
          {
            provide: ActivatedRoute,
            useValue: {
              params: of({ id_artist: '1' }),
              snapshot: {
                paramMap: {
                  get: () => '1',
                },
                url: ['artist', '1'],
              },
            },
          },
          {
            provide: Title,
            useValue: {
              setTitle: vi.fn(),
            },
          },
          {
            provide: Meta,
            useValue: {
              updateTag: vi.fn(),
            },
          },
          {
            provide: GoogleAnalyticsService,
            useValue: {
              pageView: vi.fn(),
            },
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).compileComponents();

      translocoService = TestBed.inject(TranslocoService);
      translocoService.setDefaultLang('en');

      fixture = TestBed.createComponent(ArtistComponent);
      component = fixture.componentInstance;
      activatedRoute = TestBed.inject(ActivatedRoute);
      titleService = TestBed.inject(Title);
      metaService = TestBed.inject(Meta);
      googleAnalyticsService = TestBed.inject(GoogleAnalyticsService);
      fixture.detectChanges();
    });

    it('should set og:url meta tag with environment.URL_BASE in server mode', () => {
      component.initLoad();
      expect(metaService.updateTag).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'og:url',
          content: `${environment.URL_BASE}artist/1`,
        })
      );
    });
  });
});
