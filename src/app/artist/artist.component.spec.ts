import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslocoTestingModule, TranslocoConfig, TRANSLOCO_CONFIG, TranslocoService } from '@ngneat/transloco';
import { ShareModule } from 'ngx-sharebuttons';

import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { of } from 'rxjs';
import { Album } from '../models/album.model';
import { ArtistComponent } from './artist.component';

describe('ArtistComponent', () => {
    let component: ArtistComponent;
    let fixture: ComponentFixture<ArtistComponent>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let activatedRoute: ActivatedRoute;
    let titleService: Title;
    let googleAnalyticsService: GoogleAnalyticsService;
    let translocoService: TranslocoService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                TranslocoTestingModule.forRoot({
                    langs: {
                        en: { artist: 'Test Artist', albums: 'albums', description_partage_artist: 'description_partage_artist' },
                        fr: { artist: 'Artiste de test', albums: 'albums', description_partage_artist: 'description_partage_artist' }
                    }
                }),
                ShareModule
            ],
            declarations: [ArtistComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: {
                                get: () => '1',
                            },
                            url: ['artist', '1'],
                        },
                        params: of({ id_artist: '1' }),
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
                {
                    provide: TRANSLOCO_CONFIG, useValue: {
                        reRenderOnLangChange: true,
                        availableLangs: ['en', 'fr'],
                        defaultLang: 'en',
                        prodMode: false,
                    } as TranslocoConfig
                }
            ],
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
        const data: { nom: string; id_artiste_deezer: string; id_artist: string; list_albums: Album[] } = {
            nom: 'Test Artist',
            id_artiste_deezer: '123',
            id_artist: '1',
            list_albums: [],
        };
        spyOn(component['httpClient'], 'get').and.returnValue(of(data));
        spyOn(titleService, 'setTitle');
        spyOn(googleAnalyticsService, 'pageView');
        component.initLoad();
        expect(titleService.setTitle).toHaveBeenCalledWith('Test Artist - Zeffyr Music');
        /*
        expect(component['metaService'].tags).toEqual([
            { name: 'og:title', content: 'Test Artist - Zeffyr Music' },
            { name: 'og:description', content: 'description_partage_artist' },
            { name: 'og:image', content: 'https://api.deezer.com/artist/123/image?size=big' },
            { name: 'og:url', content: document.location.href },
        ]);
        */
        expect(googleAnalyticsService.pageView).toHaveBeenCalledWith('artist/1');
    });
});