import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { PLATFORM_ID } from '@angular/core';
import { of } from 'rxjs';
import { Album } from '../models/album.model';
import { ArtistComponent } from './artist.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ArtistService } from '../services/artist.service';
import { getTranslocoModule } from '../transloco-testing.module';
import { environment } from '../../environments/environment';

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

  const data: { nom: string; id_artiste_deezer: string; id_artist: string; list_albums: Album[] } =
    {
      nom: 'Test Artist',
      id_artiste_deezer: '123',
      id_artist: '1',
      list_albums: [],
    };

  describe('In browser environment', () => {
    beforeEach(async () => {
      artistServiceMock = {
        getArtist: vi.fn().mockReturnValue(of(data)),
      };

      await TestBed.configureTestingModule({
        imports: [getTranslocoModule(), ArtistComponent, FontAwesomeTestingModule],
        providers: [
          { provide: ArtistService, useValue: artistServiceMock },
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
      expect(titleService.setTitle).toHaveBeenCalledWith('Test Artist - Zeffyr Music');
      expect(googleAnalyticsService.pageView).toHaveBeenCalledWith('artist/1');
    });

    it('should set isAvailable to false when artist name is not provided', () => {
      const emptyData = {};

      artistServiceMock.getArtist = vi.fn().mockReturnValue(of(emptyData));

      component.initLoad();
      expect(component.isAvailable).toBe(false);
    });

    it('should set isAvailable to true when artist name is provided', () => {
      component.initLoad();

      expect(component.isAvailable).toBe(true);
    });
  });

  describe('In server environment', () => {
    beforeEach(async () => {
      artistServiceMock = {
        getArtist: vi.fn().mockReturnValue(of(data)),
      };

      await TestBed.configureTestingModule({
        imports: [getTranslocoModule(), ArtistComponent, FontAwesomeTestingModule],
        providers: [
          { provide: ArtistService, useValue: artistServiceMock },
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
