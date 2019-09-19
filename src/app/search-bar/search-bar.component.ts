import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Router, ActivatedRoute } from '@angular/router';
import { GoogleAnalyticsService } from 'ngx-google-analytics';

@Component({
    selector: 'app-search-bar',
    templateUrl: './search-bar.component.html',
    styleUrls: ['./search-bar.component.css']
})
export class SearchBarComponent implements OnInit {

    query: string;
    resultsArtist: any[];
    resultsAlbum: any[];

    constructor(private httpClient: HttpClient,
                private ref: ChangeDetectorRef,
                private router: Router,
                private googleAnalyticsService: GoogleAnalyticsService) { }

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
