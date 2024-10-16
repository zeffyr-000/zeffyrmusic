import { Component, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { environment } from 'src/environments/environment';
import { InitService } from '../services/init.service';
import { PlayerService } from '../services/player.service';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { Video } from '../models/video.model';
import { Playlist } from '../models/playlist.model';
import { Subscription } from 'rxjs';
import { PlaylistService } from '../services/playlist.service';

@Component({
    selector: 'app-playlist',
    templateUrl: './playlist.component.html',
    styleUrls: ['./playlist.component.scss']
})
export class PlaylistComponent implements OnDestroy {

    isPrivate = false;
    idPlaylist: string | null = null;
    playlist: Video[] = [];
    imgBig = '';
    idTopCharts: string | null = null;
    idPersoOwner = '';
    title = '';
    titre = '';
    description = '';
    isFollower = false;
    artist: string | null = null;
    idArtist: string | null = null;
    isConnected = false;
    idPerso = '';
    currentKey = '';
    isPlaying = false;
    currentIdPlaylistPlaying = '';
    isLikePage = false;
    subscriptionConnected: Subscription;
    subscriptionChangeKey: Subscription;
    subscriptionChangeFollow: Subscription;
    subscriptionListLikeVideo: Subscription;
    subscriptionIsPlaying: Subscription;
    subscriptionCurrentPlaylist: Subscription;

    constructor(private readonly ref: ChangeDetectorRef,
        private readonly playlistService: PlaylistService,
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

    initLoad() {
        this.subscriptionConnected = this.initService.subjectConnectedChange.subscribe(data => {
            this.isConnected = data.isConnected;
            this.idPerso = data.idPerso;
        });

        this.subscriptionChangeKey = this.playerService.subjectCurrentKeyChange.subscribe(data => {
            this.ngZone.run(() => {
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

        this.subscriptionIsPlaying = this.playerService.subjectIsPlayingChange.subscribe(isPlaying => {
            this.isPlaying = isPlaying;
            setTimeout(() => {
                this.ref.detectChanges();
            });
        });

        this.subscriptionCurrentPlaylist = this.playerService.subjectCurrentPlaylistChange?.subscribe(list => {
            this.currentIdPlaylistPlaying = list[0]?.id_playlist || '';
        });

        if (this.activatedRoute.snapshot.url[0].path === 'like') {
            this.loadLike();
        } else {
            const idPlaylist = this.activatedRoute.snapshot.paramMap.get('id_playlist');
            const id = this.activatedRoute.snapshot.paramMap.get('id');

            let url: string;
            if (idPlaylist !== null) {
                url = environment.URL_SERVER + 'json/playlist/' + idPlaylist;
            } else {
                if (this.activatedRoute.snapshot.url[0].path === 'top') {
                    url = environment.URL_SERVER + 'json/top/' + id;
                } else {
                    url = '';
                }
            }

            this.currentIdPlaylistPlaying = this.playerService.currentIdPlaylist;
            this.loadPlaylist(url);
        }
    }

    getMetaDescription(data: Playlist) {
        let description = '';

        if (data.id_top !== undefined) {
            description = this.translocoService.translate('description_top',
                { title: data.title, count: data.tab_video?.length || 0, description: data.description });
        }
        else {
            if (data.artiste !== undefined && data.titre !== undefined) {
                description = this.translocoService.translate(data.artiste ? 'description_album_artist' : 'description_album',
                    { title: data.titre, artist: data.artiste, year: data.year, count: data.tab_video?.length || 0 });
            } else {
                description = this.translocoService.translate('description_playlist',
                    { title: data.title, count: data.tab_video?.length || 0 });
            }
        }
        return description;
    }

    getMetaTitle(data: Playlist) {
        let title = '';

        if (data.id_top !== undefined) {
            title = this.translocoService.translate('title_top_element', { title: data.title });
        }
        else {
            if (data.artiste !== undefined && data.titre !== undefined) {
                title = this.translocoService.translate(data.artiste ? 'title_album_artist' : 'title_album',
                    { title: data.titre, artist: data.artiste, year: data.year, count: data.tab_video?.length || 0 });
            } else {
                title = data.title;
            }
        }
        return title;
    }

    loadPlaylist(url: string) {
        this.playlistService.getPlaylist(url, this.idPlaylist)
            .subscribe((data: Playlist) => {
                if (data.est_prive === undefined) {
                    this.isPrivate = false;
                    this.idPlaylist = data.id_playlist;
                    this.playlist = data.tab_video;
                    this.imgBig = data.img_big || `${environment.URL_ASSETS}assets/img/default.jpg`;
                    this.idTopCharts = data.id_top || null;
                    this.title = data.title;
                    this.titre = data.titre || '';
                    this.description = data.description || '';
                    this.isFollower = data.est_suivi;
                    this.artist = data.artiste || '';
                    this.idArtist = data.id_artiste;
                    this.idPersoOwner = data.id_perso;

                    this.titleService.setTitle(this.getMetaTitle(data));
                    this.metaService.updateTag({ name: 'og:title', content: this.getMetaTitle(data) });
                    this.metaService.updateTag({
                        name: 'description',
                        content: this.getMetaDescription(data)
                    });

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
        this.imgBig = `${environment.URL_ASSETS}assets/img/default.jpg`;
        this.idTopCharts = null;
        this.title = '';
        this.titre = '';
        this.description = '';
        this.isFollower = false;
        this.artist = null;
        this.idArtist = null;
        this.idPersoOwner = null;
        this.isLikePage = true;

        this.subscriptionListLikeVideo = this.playerService.subjectListLikeVideo.subscribe(
            listLikeVideo => {
                if (!listLikeVideo) {
                    return;
                }

                listLikeVideo.forEach(element => {
                    const elementToPush = element as unknown as Video;
                    elementToPush.artists = [{ label: element.artiste, id_artist: '' }];
                    this.playlist.push(elementToPush);
                });
            }
        );

        this.titleService.setTitle(this.translocoService.translate('mes_likes') + ' - Zeffyr Music');
        this.metaService.updateTag({ name: 'og:title', content: '' });
        this.metaService.updateTag({ name: 'og:description', content: '' });
        this.metaService.updateTag({ name: 'og:image', content: '' });
        this.metaService.updateTag({ name: 'og:url', content: document.location.href });

        this.googleAnalyticsService.pageView(this.activatedRoute.snapshot.url.join('/'));
    }

    switchFollow() {
        this.playerService.switchFollow(this.idPlaylist, this.title);
    }

    runPlaylist(index = 0) {
        this.playerService.runPlaylist(this.playlist, index, this.idTopCharts);
    }

    pausePlaylist() {
        this.playerService.onPlayPause();
    }

    addInCurrentList() {
        this.playerService.addInCurrentList(this.playlist, this.idTopCharts);
    }

    addVideo(key: string, artist: string, title: string, duration: number) {
        this.playerService.addVideoInPlaylist(key, artist, title, duration);
    }

    removeVideo(idVideo: string) {
        this.playerService.removeVideo(idVideo, this.loadPlaylist.bind(this));
    }

    addVideoAfterCurrentInList(video: Video) {
        this.playerService.addVideoAfterCurrentInList(video);
    }

    addVideoInEndCurrentList(video: Video) {
        this.playerService.addInCurrentList([video], this.idTopCharts);
    }

    sumDurationPlaylist() {
        if (this.playlist !== undefined) {

            let charDuration = '';
            let sumDuration = 0;

            for (const element of this.playlist) {
                sumDuration += parseInt(element.duree, 10);
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
        this.subscriptionListLikeVideo?.unsubscribe();
        this.subscriptionIsPlaying.unsubscribe();
        this.subscriptionCurrentPlaylist.unsubscribe();
    }
}
