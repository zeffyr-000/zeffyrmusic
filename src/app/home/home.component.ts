import { Component, makeStateKey, OnInit, PLATFORM_ID, TransferState, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { HomeAlbum } from '../models/album.model';
import { InitService } from '../services/init.service';
import { DefaultImageDirective } from '../directives/default-image.directive';
import { isPlatformServer } from '@angular/common';
import { SeoService } from '../services/seo.service';
import { environment } from 'src/environments/environment';

const RANDOM_TOP_KEY = makeStateKey<HomeAlbum[]>('randomTop');

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    imports: [RouterLink, DefaultImageDirective, TranslocoPipe]
})
export class HomeComponent implements OnInit {
    private platformId = inject(PLATFORM_ID);
    private readonly initService = inject(InitService);
    private readonly titleService = inject(Title);
    private readonly metaService = inject(Meta);
    private readonly seoService = inject(SeoService);
    private readonly route = inject(ActivatedRoute);
    private readonly translocoService = inject(TranslocoService);
    private transferState = inject(TransferState);
    private readonly googleAnalyticsService = inject(GoogleAnalyticsService);

    isLoading = false;

    private listTop: HomeAlbum[];
    private listTopDecade: HomeAlbum[];
    private listTopSliced: HomeAlbum[];
    private listTopAlbums: HomeAlbum[];
    private listTopAlbumsSliced: HomeAlbum[];
    private lang: string;
    protected page: string;

    ngOnInit() {
        this.isLoading = true;
        this.lang = this.translocoService.getActiveLang();

        const url = this.route.snapshot.url.join('/');
        switch (url) {
            case 'top':
                this.page = 'top';
                break;
            case 'albums':
                this.page = 'albums';
                break;
            default:
                this.page = 'home';
                break;
        }

        this.titleService.setTitle(this.translocoService.translate('title_' + this.page));
        this.metaService.updateTag({
            name: 'description',
            content: this.translocoService.translate('meta_description_' + this.page)
        });
        this.seoService.updateCanonicalUrl(`${environment.URL_BASE}${url}`);

        this.initService.getHomeInit()
            .subscribe({
                next: (data: { top: HomeAlbum[], top_albums: HomeAlbum[] }) => {
                    this.isLoading = false;

                    if (isPlatformServer(this.platformId)) {
                        const randomizedTop = data.top.sort(() => Math.random() - 0.5).slice(0, 5);
                        this.transferState.set(RANDOM_TOP_KEY, randomizedTop);
                        this.listTopSliced = randomizedTop;
                    } else {
                        const storedTop = this.transferState.get(RANDOM_TOP_KEY, null);
                        this.listTopSliced = storedTop || data.top.slice(0, 5);
                        this.transferState.remove(RANDOM_TOP_KEY);
                    }

                    this.listTop = data.top.filter((album: HomeAlbum) => !album.decade);
                    this.listTopDecade = data.top.filter((album: HomeAlbum) => album.decade).sort((a, b) => a.id.localeCompare(b.id));

                    this.listTopAlbumsSliced = data.top_albums.slice(0, 5);
                    this.listTopAlbums = data.top_albums

                    if (!isPlatformServer(this.platformId)) {
                        this.googleAnalyticsService.pageView('/');
                    }
                },
                error: () => {
                    this.isLoading = false;
                }
            });
    }
}