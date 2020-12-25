import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { environment } from 'src/environments/environment';
import { InitService } from '../services/init.service';
import { PlayerService } from '../services/player.service';
import { GoogleAnalyticsService } from 'ngx-google-analytics';

@Component({
    selector: 'app-playlist',
    templateUrl: './playlist.component.html',
    styleUrls: ['./playlist.component.scss']
})
export class PlaylistComponent implements OnInit, OnDestroy, AfterViewInit {

    isPrivate: boolean;
    idPlaylist: any;
    playlist: any[];
    imgBig: string;
    idTopCharts: any;
    idPersoOwner: string;
    title: string;
    titre: string;
    description: string;
    isFollower: boolean;
    artist: string | null;
    idArtist: any;
    isConnected = false;
    idPerso: string;
    currentKey: string;
    subscriptionConnected: any;
    subscriptionChangeKey: any;
    subscriptionChangeFollow: any;
    subscriptionInitializePlaylist: any;
    subscriptionListLikeVideo: any;

    constructor(private readonly httpClient: HttpClient,
                private readonly activatedRoute: ActivatedRoute,
                private readonly initService: InitService,
                private readonly playerService: PlayerService,
                private readonly titleService: Title,
                private readonly metaService: Meta,
                private readonly translocoService: TranslocoService,
                private readonly googleAnalyticsService: GoogleAnalyticsService,
                private readonly ngZone: NgZone) {

        activatedRoute.params.subscribe(() => {
            this.initLoad();
        });
    }

    ngOnInit() {

    }

    initLoad() {
        this.subscriptionConnected = this.initService.subjectConnectedChange.subscribe(data => {
            this.isConnected = data.isConnected;
            this.idPerso = data.idPerso;
        });

        this.subscriptionChangeKey = this.playerService.subjectCurrentKeyChange.subscribe(data => {
            this.ngZone.run( () => {
                this.currentKey = data.currentKey;
             });
        });

        this.subscriptionChangeFollow = this.playerService.subjectListFollow.subscribe(listFollow => {
            if (!listFollow) {
                return;
            }

            const listFiltered = listFollow.filter(e => e.id_playlist === this.idPlaylist);

            if (listFiltered.length > 0) {
                this.isFollower = true;
            } else {
                this.isFollower = false;
            }
        });

        
        if(this.activatedRoute.snapshot.url[0].path === 'like') {
            this.loadLike();
        } else {
            const idPlaylist = this.activatedRoute.snapshot.paramMap.get('id_playlist');
            const id = this.activatedRoute.snapshot.paramMap.get('id');

            let url: string;
            if (idPlaylist !== null) {
                url = environment.URL_SERVER + 'json/playlist/' + idPlaylist;
            } else {
                if(this.activatedRoute.snapshot.url[0].path === 'top') {
                    url = environment.URL_SERVER + 'json/top/' + id;
                } else {
                    url = '';
                }
            }

            this.loadPlaylist(url);
        } 
    }

    ngAfterViewInit() {
        if ((window as any).FB && (window as any).FB.XFBML) {
            (window as any).FB.XFBML.parse();
        }
    }

    loadPlaylist(url: string) {

        if (!url) {
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
                    this.idTopCharts = null;
                    this.title = data.title;
                    this.titre = data.titre || '';
                    this.description = data.description || '';
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

                this.googleAnalyticsService.pageView(this.activatedRoute.snapshot.url.join('/'));
            });
    }

    loadLike() {
        this.isPrivate = false;
        this.idPlaylist = '';
        this.playlist = [];
        this.imgBig = '';
        this.idTopCharts = null;
        this.title = '';
        this.titre = '' || '';
        this.description = '' || '';
        this.isFollower = false;
        this.artist = null;
        this.idArtist = null;
        this.idPersoOwner = null;

        this.subscriptionListLikeVideo = this.playerService.subjectListLikeVideo.subscribe(
            listLikeVideo => {
                if(!listLikeVideo) {
                    return;
                }

                listLikeVideo.forEach(element => {
                    element.artists=[{label:element.artiste}];
                    element.tab_element=[{
                        key:element.key,
                        duree:element.duree
                    }];
                    this.playlist.push(element);
                });
            }
        );

        this.titleService.setTitle(this.translocoService.translate('mes_likes') + ' - Zeffyr Music');
        this.metaService.updateTag({ name: 'og:title', content: '' });
        this.metaService.updateTag({ name: 'og:description', content: '' });
        this.metaService.updateTag({ name: 'og:image', content:'' });
        this.metaService.updateTag({ name: 'og:url', content: document.location.href });
    
        this.googleAnalyticsService.pageView(this.activatedRoute.snapshot.url.join('/'));
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

    addVideo(key, artist, title, duration) {
        this.playerService.addVideoInPlaylist(key, artist, title, duration);
    }

    removeVideo(idVideo) {
        this.playerService.removeVideo(idVideo, this.loadPlaylist.bind(this));
    }

    addVideoAfterCurrentInList(video) {
        this.playerService.addVideoAfterCurrentInList(video);
    }

    addVideoInEndCurrentList(video) {
        this.playerService.addInCurrentList(video);
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
