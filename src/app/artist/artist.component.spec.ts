import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { of } from 'rxjs';
import { Album } from '../models/album.model';
import { ArtistComponent } from './artist.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ArtistService } from '../services/artist.service';
import { getTranslocoModule } from '../transloco-testing.module';

describe('ArtistComponent', () => {
    let component: ArtistComponent;
    let fixture: ComponentFixture<ArtistComponent>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let activatedRoute: ActivatedRoute;
    let titleService: Title;
    let googleAnalyticsService: GoogleAnalyticsService;
    let translocoService: TranslocoService;
    let artistServiceMock: Partial<ArtistService>;

    const data: { nom: string; id_artiste_deezer: string; id_artist: string; list_albums: Album[] } = {
        nom: 'Test Artist',
        id_artiste_deezer: '123',
        id_artist: '1',
        list_albums: [],
    };

    beforeEach(async () => {
        artistServiceMock = {
            getArtist: jasmine.createSpy('getArtist').and.returnValue(of(data)),
        };

        await TestBed.configureTestingModule({
            imports: [
                getTranslocoModule(),
                ArtistComponent,
                FontAwesomeTestingModule
            ],
            providers: [
                { provide: ArtistService, useValue: artistServiceMock },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        useValue: {
                            params: of({ id_artist: '123' })
                        },
                        params: of({ id_artist: '1' }),
                        snapshot: {
                            paramMap: {
                                get: () => '1',
                            },
                            url: [
                                'artist',
                                '1'
                            ]
                        }
                    },
                },
                {
                    provide: Title,
                    useValue: {
                        setTitle: () => { },
                    },
                },
                {
                    provide: GoogleAnalyticsService,
                    useValue: {
                        pageView: () => { },
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();

        translocoService = TestBed.inject(TranslocoService);
        translocoService.setDefaultLang('en');
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ArtistComponent);
        component = fixture.componentInstance;
        activatedRoute = TestBed.inject(ActivatedRoute);
        titleService = TestBed.inject(Title);
        googleAnalyticsService = TestBed.inject(GoogleAnalyticsService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set title and meta tags on init', () => {
        spyOn(titleService, 'setTitle');
        spyOn(googleAnalyticsService, 'pageView');
        component.initLoad();
        expect(titleService.setTitle).toHaveBeenCalledWith('Test Artist - Zeffyr Music');
        expect(googleAnalyticsService.pageView).toHaveBeenCalledWith('artist/1');
    });

    it('should set isAvaible to false if no data is returned', () => {
        artistServiceMock.getArtist = jasmine.createSpy('getArtist').and.returnValue(of({}));
        component.initLoad();
        expect(component.isAvailable).toBeFalse();
    });
});