import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, TransferState, makeStateKey, DOCUMENT, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, map, Observable, of, Subject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
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
    language: string;
    liste_playlist: UserPlaylist[];
    liste_suivi: FollowItem[];
    like_video: UserVideo[];
    liste_video: Video[];
    tab_index: number[];
    tab_video: string[];
}

const HOME_KEY = makeStateKey<{ top: HomeAlbum[], top_albums: HomeAlbum[] }>('homeData');
const PING_KEY = makeStateKey<PingResponse>('pingData');

@Injectable({
    providedIn: 'root'
})
export class InitService {
    private document = inject<Document>(DOCUMENT);
    private platformId = inject(PLATFORM_ID);
    private readonly httpClient = inject(HttpClient);
    private transferState = inject(TransferState);
    private readonly translocoService = inject(TranslocoService);


    private isConnected = false;
    private pseudo = '';
    private idPerso = '';
    private mail = '';
    private darkModeEnabled = false;
    private language = 'fr';
    private changeIsConnectedCalled = false;
    private isBrowser: boolean;

    subjectConnectedChange: BehaviorSubject<{
        isConnected: boolean,
        pseudo: string,
        idPerso: string,
        mail: string,
        darkModeEnabled: boolean,
        language: string
    }> = new BehaviorSubject<{
        isConnected: boolean,
        pseudo: string,
        idPerso: string,
        mail: string,
        darkModeEnabled: boolean,
        language: string
    }>({
        isConnected: this.isConnected,
        pseudo: this.pseudo,
        idPerso: this.idPerso,
        mail: this.mail,
        darkModeEnabled: this.darkModeEnabled,
        language: this.language
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

    constructor() {
        this.isBrowser = isPlatformBrowser(this.platformId);
        if (this.isBrowser) {
            this.document.querySelector('link[rel=icon]')?.setAttribute('href', `${environment.URL_ASSETS}assets/img/favicon.png`);
        }
        this.translocoService.setActiveLang(environment.lang);
    }

    public getPing(): void {
        const storedValue = this.transferState.get<PingResponse>(PING_KEY, null);
        if (storedValue && this.isBrowser) {
            this.transferState.remove(PING_KEY);
            this.handlePingResponse(storedValue);
        }

        this.httpClient.get<PingResponse>(environment.URL_SERVER + 'ping')
            .subscribe(data => {
                this.handlePingResponse(data);
            });
    }

    private handlePingResponse(data: PingResponse): void {
        this.isConnected = data.est_connecte;
        let listPlaylist: UserPlaylist[] = [];
        let listFollow: FollowItem[] = [];
        let listLikeVideo: UserVideo[] = [];

        if (this.isConnected) {
            this.pseudo = data.pseudo;
            this.idPerso = data.id_perso;
            this.mail = data.mail;
            this.darkModeEnabled = data.dark_mode_enabled;
            this.language = data.language;

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
    }

    onChangeIsConnected() {
        this.changeIsConnectedCalled = true;

        this.subjectConnectedChange.next({
            isConnected: this.isConnected,
            pseudo: this.pseudo,
            idPerso: this.idPerso,
            mail: this.mail,
            darkModeEnabled: this.darkModeEnabled,
            language: this.language
        });
    }

    loginSuccess(pseudo: string, idPerso: string, mail: string, darkModeEnabled: boolean, language: string) {
        this.isConnected = true;
        this.idPerso = idPerso;
        this.pseudo = pseudo;
        this.mail = mail;
        this.darkModeEnabled = darkModeEnabled;
        this.language = language;

        this.onChangeIsConnected();
    }

    logOut() {
        this.isConnected = false;
        this.idPerso = '';
        this.pseudo = '';
        this.mail = '';
        this.darkModeEnabled = false;
        this.language = 'fr';

        if (this.isBrowser) {
            document.cookie = 'login= ; expires=Sun, 01 Jan 2000 00:00:00 UTC; path=/';
        }

        this.onChangeIsConnected();
    }

    onMessageUnlog() {
        this.subjectMessageUnlog.next(true);

        this.isConnected = false;
        this.onChangeIsConnected();
    }

    getHomeInit(): Observable<{ top: HomeAlbum[], top_albums: HomeAlbum[] }> {
        const storedValue = this.transferState.get(HOME_KEY, null);
        if (storedValue && this.isBrowser) {
            this.transferState.remove(HOME_KEY);
            return of(storedValue);
        }

        return this.httpClient
            .get<{ top: HomeAlbum[], top_albums: HomeAlbum[] }>(
                environment.URL_SERVER + 'home_init'
            ).pipe(
                tap(response => {
                    if (!this.isBrowser) {
                        this.transferState.set(HOME_KEY, response);
                    }
                })
            );
    }

    getIsConnected(): boolean | Observable<boolean> {
        if (this.changeIsConnectedCalled) {
            return this.isConnected;
        }
        else {
            return this.subjectConnectedChange.asObservable().pipe(
                map(data => {
                    return data.isConnected;
                })
            );
        }
    }
}
