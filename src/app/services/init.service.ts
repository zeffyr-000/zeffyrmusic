import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Subject, BehaviorSubject } from 'rxjs';
import { TranslocoService } from '@ngneat/transloco';

@Injectable({
    providedIn: 'root'
})
export class InitService {

    private isConnected = false;
    private pseudo: string;
    private idPerso: string;
    private mail: string;

    public subjectConnectedChange: BehaviorSubject<{
        isConnected: boolean,
        pseudo: string,
        idPerso: string,
        mail: string
    }> = new BehaviorSubject<{
        isConnected: boolean,
        pseudo: string,
        idPerso: string,
        mail: string
    }>({isConnected: this.isConnected,
        pseudo: this.pseudo,
        idPerso: this.idPerso,
        mail: this.mail});

    public subjectMessageUnlog: Subject<boolean> = new Subject<boolean>();
    public subjectInitializePlaylist: Subject<{
        listPlaylist: any[],
        listFollow: any[],
        listVideo: any[],
        tabIndex: any[]
    }> = new Subject<{
        listPlaylist: any[],
        listFollow: any[],
        listVideo: any[],
        tabIndex: any[]
    }>();

    constructor(private httpClient: HttpClient,
                private translocoService: TranslocoService) {

        let lang = 'fr';

        if (localStorage.langue && localStorage.langue === 'en') {
            lang = 'en';
        }

        this.translocoService.setActiveLang(lang);
    }

    getPing() {
        this.httpClient.get(environment.URL_SERVER + 'ping/' + this.translocoService.getActiveLang(),
                            environment.httpClientConfig)
            .subscribe((data: any) => {
                this.isConnected = data.est_connecte;
                let listPlaylist = [];
                let listFollow = [];

                if (this.isConnected) {
                    this.pseudo = data.pseudo;
                    this.idPerso = data.id_perso;
                    this.mail = data.mail;

                    listPlaylist = data.liste_playlist;
                    listFollow = data.liste_suivi;
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
                    tabIndex: data.tab_index
                });
            },
                (error) => { console.log(error); });
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
