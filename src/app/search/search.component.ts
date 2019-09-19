import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Title } from '@angular/platform-browser';
import { TranslocoService } from '@ngneat/transloco';
import { InitService } from '../services/init.service';
import { PlayerService } from '../services/player.service';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit, OnDestroy {

    private isConnected: boolean;
    private query: string;
    private isLoading1: boolean;
    private isLoading2: boolean;
    private isLoading3: boolean;

    private listArtists: any[];
    private limitArtist: number;

    private listAlbums: any[] = [];
    private limitAlbum: number;

    private listTracks: any[] = [];
    private limitTrack: number;

    private listExtras: any[] = [];
    private limitExtra: number;

    private subscriptionConnected: any;

    constructor(private httpClient: HttpClient,
                private activatedRoute: ActivatedRoute,
                private titleService: Title,
                private translocoService: TranslocoService,
                private initService: InitService,
                private playerService: PlayerService) {
                }

    ngOnInit() {
        this.query = this.activatedRoute.snapshot.paramMap.get('query');
        this.isLoading1 = true;
        this.isLoading2 = true;
        this.isLoading3 = true;

        this.subscriptionConnected = this.initService.subjectConnectedChange.subscribe((data) => {
            this.isConnected = data.isConnected;
        });

        this.httpClient.get(environment.URL_SERVER + 'fullsearch1/' + encodeURIComponent(this.query),
            environment.httpClientConfig)
            .subscribe((data: any) => {

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
            .subscribe((data: any) => {

                this.isLoading2 = false;

                this.listTracks = data.tab_video;
                this.limitTrack = 5;
            });

        this.httpClient.get(environment.URL_SERVER + 'fullsearch3/' + encodeURIComponent(this.query),
            environment.httpClientConfig)
            .subscribe((data: any) => {

                this.isLoading3 = false;

                this.listExtras = data.tab_extra;
                this.limitExtra = 5;
            });
    }

    moreArtists() {
        this.limitArtist = this.listArtists.length;
    }

    moreAlbums() {
        this.limitAlbum = this.listAlbums.length;
    }

    runPlaylistTrack(index) {
        this.playerService.runPlaylist(this.listTracks, index);
    }

    addVideo(key, artist, title) {
        this.playerService.addVideoInPlaylist(key, artist, title);
    }

    moreTracks() {
        this.limitTrack = this.listTracks.length;
    }

    runPlaylistExtra(index) {

        const listTransformed = this.listExtras.map((e) => {
            return {
                titre : e.title,
                tab_element: [{
                    key : e.key,
                    duree : e.duree
                }]
            };
        });

        this.playerService.runPlaylist(listTransformed, index);
    }

    moreExtras() {
        this.limitExtra = this.listExtras.length;
    }

    ngOnDestroy() {
        this.subscriptionConnected.unsubscribe();
    }
}
