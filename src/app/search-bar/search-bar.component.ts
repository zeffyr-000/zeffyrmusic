import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-search-bar',
    templateUrl: './search-bar.component.html',
    styleUrls: ['./search-bar.component.css']
})
export class SearchBarComponent implements OnInit {

    query: string;
    resultsArtist: any[];
    resultsAlbum: any[];

    constructor(private readonly httpClient: HttpClient,
                private readonly ref: ChangeDetectorRef,
                private readonly router: Router,
                private readonly googleAnalyticsService: GoogleAnalyticsService) { }

    ngOnInit() {
    }

    search() {

        this.httpClient.get(environment.URL_SERVER + 'recherche2?q=' + encodeURIComponent(this.query),
            environment.httpClientConfig)
            .subscribe((data: any) => {
                this.resultsAlbum = data.playlist;
                this.resultsArtist = data.artist;
            });
    }

    reset(element: any, redirect: boolean, url: string) {

        if (redirect) {
            let query = '';

            if (element.artiste !== undefined) {
                query += element.artiste;
            }

            if (element.titre !== undefined) {
                if (query.length > 0) {
                    query += ' ';
                }

                query += element.titre;
            }

            if (query.length > 0) {
                this.googleAnalyticsService.pageView('/recherche?q=' + this.query);
            }
        }

        this.query = '';
        this.resultsAlbum = [];
        this.resultsArtist = [];
        this.ref.detectChanges();

        this.router.navigate([url]);
    }

    getQuerystr() {
        return encodeURIComponent(this.query);
    }
}
