import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { TranslocoService } from '@ngneat/transloco';
import { Title, Meta } from '@angular/platform-browser';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

    private listTopAlbums: any[];
    private listTopCharts: any[];
    private isLoading = false;
    private lang: string;

    constructor(private httpClient: HttpClient,
                private titleService: Title,
                private metaService: Meta,
                private translocoService: TranslocoService) { }

    ngOnInit() {

        this.isLoading = true;
        this.lang = this.translocoService.getActiveLang();

        this.titleService.setTitle(this.translocoService.translate('title'));
        this.metaService.updateTag({ name: 'description', content: this.translocoService.translate('meta_description') });

        this.httpClient.get(environment.URL_SERVER + 'home_init/' + this.translocoService.getActiveLang(),
                            environment.httpClientConfig)
            .subscribe((data: any) => {
                this.isLoading = false;

                this.listTopAlbums = data.top_albums;
                this.listTopCharts = data.top_charts;

            },
                (error) => {
                    console.log(error);
                    this.isLoading = false;
                });
    }

}
