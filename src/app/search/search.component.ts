import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { environment } from 'src/environments/environment';
import { InitService } from '../services/init.service';
import { PlayerService } from '../services/player.service';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { Album, Extra } from '../models/search.model';
import { Subscription } from 'rxjs';
import { ArtistResult } from '../models/artist.model';
import { PlaylistResult } from '../models/playlist.model';
import { Video } from '../models/video.model';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit, OnDestroy {

    isConnected: boolean;
    query: string;
    isLoading1: boolean;
    isLoading2: boolean;
    isLoading3: boolean;

    listArtists: ArtistResult[];
    limitArtist: number;

    listAlbums: Album[] = [];
    limitAlbum: number;

    listTracks: Video[] = [];
    limitTrack: number;

    listExtras: Extra[] = [];
    limitExtra: number;

    private subscriptionConnected: Subscription;

    constructor(private readonly httpClient: HttpClient,
        private readonly activatedRoute: ActivatedRoute,
        private readonly titleService: Title,
        private readonly translocoService: TranslocoService,
        private readonly initService: InitService,
        private readonly playerService: PlayerService,
        private readonly googleAnalyticsService: GoogleAnalyticsService) {
    }

    ngOnInit() {
        this.query = this.activatedRoute.snapshot.paramMap.get('query');
        this.isLoading1 = true;
        this.isLoading2 = true;
        this.isLoading3 = true;

        this.subscriptionConnected = this.initService.subjectConnectedChange.subscribe(data => {
            this.isConnected = data.isConnected;
        });

        this.httpClient.get(environment.URL_SERVER + 'fullsearch1/' + encodeURIComponent(this.query),
            environment.httpClientConfig)
            .subscribe((data: { artist: ArtistResult[], playlist: PlaylistResult[] }) => {
                this.isLoading1 = false;

                this.titleService.setTitle(this.translocoService.translate('resultats_recherche', { query: this.query }) +
                    ' - Zeffyr Music');

                this.listArtists = data.artist;
                this.limitArtist = 5;

                this.listAlbums = data.playlist;
                this.limitAlbum = 5;

            });

        this.httpClient.get(environment.URL_SERVER + 'fullsearch2/' + encodeURIComponent(this.query),
            environment.httpClientConfig)
            .subscribe((data: { tab_video: Video[] }) => {
                this.isLoading2 = false;

                this.listTracks = data.tab_video;
                this.limitTrack = 5;
            });

        this.httpClient.get(environment.URL_SERVER + 'fullsearch3/' + encodeURIComponent(this.query),
            environment.httpClientConfig)
            .subscribe((data: { tab_extra: Extra[] }) => {
                this.isLoading3 = false;

                this.listExtras = data.tab_extra;
                this.limitExtra = 5;
            });

        this.googleAnalyticsService.pageView(this.activatedRoute.snapshot.url.join('/'));
    }

    moreArtists() {
        this.limitArtist = this.listArtists.length;
    }

    moreAlbums() {
        this.limitAlbum = this.listAlbums.length;
    }

    runPlaylistTrack(index: number) {
        this.playerService.runPlaylist(this.listTracks, index);
    }

    addVideo(key: string, artist: string, title: string, duration: number) {
        this.playerService.addVideoInPlaylist(key, artist, title, duration);
    }

    moreTracks() {
        this.limitTrack = this.listTracks.length;
    }

    runPlaylistExtra(index: number) {

        const listTransformed = this.listExtras.map(e =>
        ({
            ...e,
            titre: e.title,
        })) as unknown as Video[];

        this.playerService.runPlaylist(listTransformed, index);
    }

    moreExtras() {
        this.limitExtra = this.listExtras.length;
    }

    ngOnDestroy() {
        this.subscriptionConnected.unsubscribe();
    }
}
