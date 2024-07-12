import { HttpClient } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { DOCUMENT } from '@angular/common';
import { UserPlaylist } from '../models/playlist.model';
import { UserVideo, Video } from '../models/video.model';
import { FollowItem } from '../models/follow.model';
import { HomeAlbum } from '../models/album.model';

export interface PingResponse {
    est_connecte: boolean;
    pseudo: string;
    id_perso: string;
    mail: string;
    dark_mode_enabled: boolean;
    liste_playlist: UserPlaylist[];
    liste_suivi: FollowItem[];
    like_video: UserVideo[];
    liste_video: Video[];
    tab_index: number[];
    tab_video: string[];
}

@Injectable({
    providedIn: 'root'
})
export class InitService {

    private isConnected = false;
    private pseudo = '';
    private idPerso = '';
    private mail = '';
    private darkModeEnabled = false;

    subjectConnectedChange: BehaviorSubject<{
        isConnected: boolean,
        pseudo: string,
        idPerso: string,
        mail: string
        darkModeEnabled: boolean
    }> = new BehaviorSubject<{
        isConnected: boolean,
        pseudo: string,
        idPerso: string,
        mail: string,
        darkModeEnabled: boolean
    }>({
        isConnected: this.isConnected,
        pseudo: this.pseudo,
        idPerso: this.idPerso,
        mail: this.mail,
        darkModeEnabled: this.darkModeEnabled
    });

    subjectMessageUnlog: Subject<boolean> = new Subject<boolean>();
    subjectInitializePlaylist: Subject<{
        listPlaylist: UserPlaylist[],
        listFollow: FollowItem[],
        listVideo: Video[],
        tabIndex: number[],
        listLikeVideo: UserVideo[]
    }> = new Subject<{
        listPlaylist: UserPlaylist[],
        listFollow: FollowItem[],
        listVideo: Video[],
        tabIndex: number[],
        listLikeVideo: UserVideo[]
    }>();

    constructor(@Inject(DOCUMENT) private document: Document,
        private readonly httpClient: HttpClient,
        private readonly translocoService: TranslocoService) {
        this.document.querySelector('link[rel=icon]')?.setAttribute('href', `${environment.URL_ASSETS}assets/img/favicon.png`);
        this.translocoService.setActiveLang(environment.lang);
    }

    getPing() {
        return this.httpClient.get(environment.URL_SERVER + 'ping', environment.httpClientConfig)
            .subscribe((data: PingResponse) => {
                this.isConnected = data.est_connecte;
                let listPlaylist: UserPlaylist[] = [];
                let listFollow: FollowItem[] = [];
                let listLikeVideo: UserVideo[] = [];

                if (this.isConnected) {
                    this.pseudo = data.pseudo;
                    this.idPerso = data.id_perso;
                    this.mail = data.mail;
                    this.darkModeEnabled = data.dark_mode_enabled;

                    listPlaylist = data.liste_playlist;
                    listFollow = data.liste_suivi;
                    listLikeVideo = data.like_video;
                } else {
                    this.pseudo = '';
                    this.idPerso = '';
                    this.mail = '';
                }

                this.onChangeIsConnected();

                this.subjectInitializePlaylist.next({
                    listPlaylist,
                    listFollow,
                    listVideo: data.liste_video,
                    tabIndex: data.tab_index,
                    listLikeVideo
                });
            });
    }

    onChangeIsConnected() {
        this.subjectConnectedChange.next({
            isConnected: this.isConnected,
            pseudo: this.pseudo,
            idPerso: this.idPerso,
            mail: this.mail,
            darkModeEnabled: this.darkModeEnabled
        });
    }

    loginSuccess(pseudo: string, idPerso: string, mail: string, darkModeEnabled: boolean) {
        this.isConnected = true;
        this.idPerso = idPerso;
        this.pseudo = pseudo;
        this.mail = mail;
        this.darkModeEnabled = darkModeEnabled

        this.onChangeIsConnected();
    }

    logOut() {
        this.isConnected = false;
        this.idPerso = '';
        this.pseudo = '';
        this.mail = '';
        this.darkModeEnabled = false;

        document.cookie = 'login= ; expires=Sun, 01 Jan 2000 00:00:00 UTC; path=/';

        this.onChangeIsConnected();
    }

    onMessageUnlog() {
        this.subjectMessageUnlog.next(true);

        this.isConnected = false;
        this.onChangeIsConnected();
    }

    getHomeInit(): Observable<{ top: HomeAlbum[], top_albums: HomeAlbum[] }> {
        return this.httpClient.get<{ top: HomeAlbum[], top_albums: HomeAlbum[] }>(environment.URL_SERVER + 'home_init', environment.httpClientConfig);
    }

    getIsConnected(): boolean {
        return this.isConnected;
    }
}
