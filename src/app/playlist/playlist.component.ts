import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { InitService } from '../services/init.service';
import { PlayerService } from '../services/player.service';
import { Title, Meta } from '@angular/platform-browser';
import { TranslocoService } from '@ngneat/transloco';

@Component({
    selector: 'app-playlist',
    templateUrl: './playlist.component.html',
    styleUrls: ['./playlist.component.css']
})
export class PlaylistComponent implements OnInit, OnDestroy, AfterViewInit {

    isPrivate: boolean;
    idPlaylist: any;
    playlist: any[];
    imgBig: string;
    idTopCharts: any;
    idPersoOwner: string;
    title: string;
    isFollower: boolean;
    artist: string | null;
    idArtist: any;
    isConnected = false;
    idPerso: string;
    currentKey: string;
    subscriptionConnected: any;
    subscriptionChangeKey: any;
    subscriptionChangeFollow: any;

    constructor(private httpClient: HttpClient,
                private activatedRoute: ActivatedRoute,
                private initService: InitService,
                private playerService: PlayerService,
                private titleService: Title,
                private metaService: Meta,
                private translocoService: TranslocoService) {

        activatedRoute.params.subscribe(() => {
            this.initLoad();
        });
    }

    ngOnInit() {

    }

    initLoad() {
        this.subscriptionConnected = this.initService.subjectConnectedChange.subscribe((data) => {
            this.isConnected = data.isConnected;
            this.idPerso = data.idPerso;
        });

        this.subscriptionChangeKey = this.playerService.subjectCurrentKeyChange.subscribe((data) => {
            this.currentKey = data.currentKey;
        });

        this.subscriptionChangeFollow = this.playerService.subjectListFollow.subscribe((listFollow) => {
            if (!listFollow) {
                return;
            }

            const listFiltered = listFollow.filter((e) => e.id_playlist === this.idPlaylist);

            if (listFiltered.length > 0) {
                this.isFollower = true;
            } else {
                this.isFollower = false;
            }
        });

        const idPlaylist = this.activatedRoute.snapshot.paramMap.get('id_playlist');
        const id = this.activatedRoute.snapshot.paramMap.get('id');

        let url: string;
        if (idPlaylist !== null) {
            url = environment.URL_SERVER + 'json/playlist/' + idPlaylist;
        } else {
            url = environment.URL_SERVER + 'json/top_charts/' + id;
        }

        this.loadPlaylist(url);
    }

    ngAfterViewInit() {
        if ((window as any).FB && false) {
            (window as any).FB.XFBML.parse();
        }
    }

    loadPlaylist(url: string) {

        if ( !url ) {
            url = environment.URL_SERVER + 'json/playlist/' + this.idPlaylist;
        }

        this.httpClient.get(url,
            environment.httpClientConfig)
            .subscribe((data: any) => {

                if (data.est_prive === undefined) {
                    this.isPrivate = false;
                    this.idPlaylist = data.id_playlist;
                    this.playlist = data.tab_video;
                    this.imgBig = data.img_big;
                    this.idTopCharts = data.id_top_charts || null;
                    this.title = data.title;
                    this.isFollower = data.est_suivi;
                    this.artist = data.artiste;
                    this.idArtist = data.id_artiste;
                    this.idPersoOwner = data.id_perso;

                    this.titleService.setTitle(data.title + ' - Zeffyr Music');

                    this.metaService.updateTag({ name: 'og:title', content: data.title + ' - Zeffyr Music' });

                    if (data.artiste !== undefined && data.titre !== undefined) {
                        this.metaService.updateTag({
                            name: 'og:description',
                            content: this.translocoService.translate('description_partage',
                                { artiste: data.artiste, album: data.titre })
                        });
                    } else {
                        this.metaService.updateTag({
                            name: 'og:description',
                            content: this.translocoService.translate('description_partage_playlist', { playlist: data.title })
                        });
                    }

                    if (data.img_big !== undefined) {
                        this.metaService.updateTag({ name: 'og:image', content: data.img_big });
                    }

                    this.metaService.updateTag({ name: 'og:url', content: document.location.href });
                } else {
                    this.isPrivate = true;
                }

            },
                (error) => {
                    console.log(error);
                });
    }

    switchFollow() {
        this.playerService.switchFollow(this.idPlaylist, this.title);
    }

    runPlaylist(index = 0) {
        this.playerService.runPlaylist(this.playlist, index);
    }

    addInCurrentList() {
        this.playerService.addInCurrentList(this.playlist);
    }

    addVideo(key, artist, title) {
        this.playerService.addVideoInPlaylist(key, artist, title);
    }

    removeVideo(idVideo) {
        this.playerService.removeVideo(idVideo, this.loadPlaylist.bind(this));
    }

    sumDurationPlaylist() {
        if (this.playlist !== undefined) {

            let charDuration = '';
            let sumDuration = 0;

            for (const element of this.playlist) {
                sumDuration += parseInt(element.tab_element[0].duree, 10);
            }

            const hour = Math.floor(sumDuration / 3600);
            if (hour > 0) {
                charDuration += hour + ' h ';
                sumDuration -= (3600 * hour);
            }

            const minut = Math.floor(sumDuration / 60);
            if (minut > 0) {
                charDuration += minut + ' min';
            }

            return charDuration;
        } else {
            return '';
        }
    }

    ngOnDestroy() {
        this.subscriptionConnected.unsubscribe();
        this.subscriptionChangeKey.unsubscribe();
        this.subscriptionChangeFollow.unsubscribe();
    }
}
