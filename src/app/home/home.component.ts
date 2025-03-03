import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { HomeAlbum } from '../models/album.model';
import { InitService } from '../services/init.service';
import { DefaultImageDirective } from '../directives/default-image.directive';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    imports: [RouterLink, DefaultImageDirective, TranslocoPipe]
})
export class HomeComponent implements OnInit {
    isLoading = false;

    private listTop: HomeAlbum[];
    private listTopDecade: HomeAlbum[];
    private listTopSliced: HomeAlbum[];
    private listTopAlbums: HomeAlbum[];
    private listTopAlbumsSliced: HomeAlbum[];
    private lang: string;
    protected page: string;

    constructor(private readonly initService: InitService,
        private readonly titleService: Title,
        private readonly metaService: Meta,
        private readonly route: ActivatedRoute,
        private readonly translocoService: TranslocoService,
        private readonly googleAnalyticsService: GoogleAnalyticsService) { }

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

        this.initService.getHomeInit()
            .subscribe({
                next: (data: { top: HomeAlbum[], top_albums: HomeAlbum[] }) => {
                    this.isLoading = false;

                    this.listTopSliced = data.top.sort(() => Math.random() - 0.5).slice(0, 5);
                    this.listTop = data.top.filter((album: HomeAlbum) => !album.decade);
                    this.listTopDecade = data.top.filter((album: HomeAlbum) => album.decade).sort((a, b) => a.id.localeCompare(b.id));

                    this.listTopAlbumsSliced = data.top_albums.slice(0, 5);
                    this.listTopAlbums = data.top_albums

                    this.googleAnalyticsService.pageView('/');
                },
                error: () => {
                    this.isLoading = false;
                }
            });
    }
}