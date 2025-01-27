import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { ArtistResult } from '../models/artist.model';
import { PlaylistResult } from '../models/playlist.model';
import { Subject } from 'rxjs';
import { debounceTime, switchMap, filter, distinctUntilChanged, tap } from 'rxjs/operators';
import { SearchService } from '../services/search.service';
import { SearchBarResponse } from '../models/search.model';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { DefaultImageDirective } from '../directives/default-image.directive';

@Component({
    selector: 'app-search-bar',
    templateUrl: './search-bar.component.html',
    styleUrls: ['./search-bar.component.scss'],
    imports: [FormsModule, NgIf, NgFor, TranslocoPipe, DefaultImageDirective]
})
export class SearchBarComponent implements OnInit {

    query: string;
    resultsArtist: ArtistResult[];
    resultsAlbum: PlaylistResult[];
    private searchSubject = new Subject<string>();

    constructor(private readonly searchService: SearchService,
        private readonly ref: ChangeDetectorRef,
        private readonly router: Router,
        private readonly googleAnalyticsService: GoogleAnalyticsService) { }

    ngOnInit() {
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            tap(query => {
                if (query.length === 0) {
                    this.resultsAlbum = [];
                    this.resultsArtist = [];
                }
            }),
            filter(query => query.length >= 3),
            switchMap(query => this.searchService.searchBar(query))
        ).subscribe((data: SearchBarResponse) => {
            this.resultsAlbum = data.playlist;
            this.resultsArtist = data.artist;
        });
    }

    search() {
        this.searchSubject.next(this.query);
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
