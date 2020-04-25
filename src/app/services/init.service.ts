import { HttpClient } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { DOCUMENT } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class InitService {

    private isConnected = false;
    private pseudo: string;
    private idPerso: string;
    private mail: string;

    subjectConnectedChange: BehaviorSubject<{
        isConnected: boolean,
        pseudo: string,
        idPerso: string,
        mail: string
    }> = new BehaviorSubject<{
        isConnected: boolean,
        pseudo: string,
        idPerso: string,
        mail: string
    }>({
        isConnected: this.isConnected,
        pseudo: this.pseudo,
        idPerso: this.idPerso,
        mail: this.mail
    });

    subjectMessageUnlog: Subject<boolean> = new Subject<boolean>();
    subjectInitializePlaylist: Subject<{
        listPlaylist: any[],
        listFollow: any[],
        listVideo: any[],
        tabIndex: any[],
        listLikeVideo: any[]
    }> = new Subject<{
        listPlaylist: any[],
        listFollow: any[],
        listVideo: any[],
        tabIndex: any[],
        listLikeVideo: any[]
    }>();

    constructor(@Inject(DOCUMENT) private document: Document,
                private readonly httpClient: HttpClient,
                private readonly translocoService: TranslocoService) {
            this.document.querySelector('link[rel=icon]').setAttribute('href', `${environment.URL_ASSETS}assets/img/favicon.png`);
            this.translocoService.setActiveLang(environment.lang);
        }

    getPing() {
        return this.httpClient.get(environment.URL_SERVER + 'ping', environment.httpClientConfig)
            .subscribe((data: any) => {
                this.isConnected = data.est_connecte;
                let listPlaylist = [];
                let listFollow = [];
                let listLikeVideo =[];

                if (this.isConnected) {
                    this.pseudo = data.pseudo;
                    this.idPerso = data.id_perso;
                    this.mail = data.mail;

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
            mail: this.mail
        });
    }

    loginSuccess(pseudo, idPerso) {
        this.isConnected = true;
        this.idPerso = idPerso;
        this.pseudo = pseudo;

        this.onChangeIsConnected();
    }

    logOut() {
        this.isConnected = false;
        this.idPerso = '';
        this.pseudo = '';

        document.cookie = 'login= ; expires=Sun, 01 Jan 2000 00:00:00 UTC; path=/';

        this.onChangeIsConnected();
    }

    onMessageUnlog() {
        this.subjectMessageUnlog.next(true);

        this.isConnected = false;
        this.onChangeIsConnected();
    }

}
