import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { environment } from 'src/environments/environment';
import { ArtistResult } from '../models/artist.model';
import { PlaylistResult } from '../models/playlist.model';

export interface SearchResponse {
    playlist: PlaylistResult[];
    artist: ArtistResult[];
}

@Component({
    selector: 'app-search-bar',
    templateUrl: './search-bar.component.html',
    styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent {

    query: string;
    resultsArtist: ArtistResult[];
    resultsAlbum: PlaylistResult[];

    constructor(private readonly httpClient: HttpClient,
        private readonly ref: ChangeDetectorRef,
        private readonly router: Router,
        private readonly googleAnalyticsService: GoogleAnalyticsService) { }

    search() {
        this.httpClient.get(environment.URL_SERVER + 'recherche2?q=' + encodeURIComponent(this.query),
            environment.httpClientConfig)
            .subscribe((data: SearchResponse) => {
                this.resultsAlbum = data.playlist;
                this.resultsArtist = data.artist;
            });
    }

    reset(element: ArtistResult | PlaylistResult, redirect: boolean, url: string) {

        if (redirect) {
            let query = '';

            if ('artiste' in element && element.artiste !== undefined) {
                query += element.artiste;
            }

            if ('titre' in element && element.titre !== undefined) {
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
