import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService } from '@ngneat/transloco';
import { environment } from '../../environments/environment';
import { GoogleAnalyticsService } from 'ngx-google-analytics';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
    isLoading = false;

    private listTopAlbums: any[];
    private listTopCharts: any[];
    private listTop: any[];
    private lang: string;

    constructor(private readonly httpClient: HttpClient,
                private readonly titleService: Title,
                private readonly metaService: Meta,
                private readonly translocoService: TranslocoService,
                private readonly googleAnalyticsService: GoogleAnalyticsService) { }

    ngOnInit() {

        this.isLoading = true;
        this.lang = this.translocoService.getActiveLang();

        this.titleService.setTitle(this.translocoService.translate('title'));
        this.metaService.updateTag({ name: 'description', content: this.translocoService.translate('meta_description') });

        this.httpClient.get(environment.URL_SERVER + 'home_init', environment.httpClientConfig)
            .subscribe((data: any) => {
                this.isLoading = false;

                this.listTopAlbums = data.top_albums;
                this.listTopCharts = data.top_charts;
                this.listTop = data.top;

                this.googleAnalyticsService.pageView('/');
            }, error => { 
                    this.isLoading = false;
                });
    }

}
