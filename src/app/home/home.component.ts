import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { HomeAlbum } from '../models/album.model';
import { InitService } from '../services/init.service';
import { switchMap, take } from 'rxjs';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
    isLoading = false;

    private listTop: HomeAlbum[];
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

        this.translocoService.langChanges$
            .pipe(
                take(1),
                switchMap(() => this.translocoService.selectTranslate('title'))
            )
            .subscribe(title => {
                this.titleService.setTitle(title);
            });

        this.translocoService.langChanges$
            .pipe(
                take(1),
                switchMap(() => this.translocoService.selectTranslate('meta_description'))
            )
            .subscribe(description => {
                this.metaService.updateTag({ name: 'description', content: description });
            });

        this.initService.getHomeInit()
            .subscribe({
                next: (data: { top: HomeAlbum[], top_albums: HomeAlbum[] }) => {
                    this.isLoading = false;

                    this.listTopSliced = data.top.sort(() => Math.random() - 0.5).slice(0, 5);
                    this.listTop = data.top;

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
