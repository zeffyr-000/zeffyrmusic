import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { BehaviorSubject, Subject } from "rxjs";
import { PlayerRunning } from "src/app/models/player-running.model";
import { environment } from "../../environments/environment";
import { InitService } from "./init.service";

@Injectable({
    providedIn: "root"
})
export class PlayerService implements OnDestroy {
    YT: any;
    player: any;
    tabIndexInitial: any[];
    tabIndex: any[];
    isRandom: boolean;
    currentIndex = 0;
    isRepeat: boolean;
    listPlaylist: any[];
    listFollow: any[];
    listVideo: any[];
    isPlaying = false;
    refInterval = null;
    currentTitle: string;
    currentArtist: string;
    currentKey: string;
    listLikeVideo: any[];

    isAutoPlay: boolean;
    firstLaunched = false;
    showTapVideoYT: boolean;

    subjectCurrentPlaylistChange: Subject<any[]> = new Subject<any[]>();
    subjectRepeatChange: Subject<boolean> = new Subject<boolean>();
    subjectRandomChange: Subject<boolean> = new Subject<boolean>();
    subjectIsPlayingChange: BehaviorSubject<boolean> = new BehaviorSubject<
        boolean
    >(false);
    subjectVolumeChange: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    subjectPlayerRunningChange: BehaviorSubject<
        PlayerRunning
    > = new BehaviorSubject<PlayerRunning>(undefined);
    subjectMessageTap: Subject<boolean> = new Subject<boolean>();
    subjectListPlaylist: BehaviorSubject<any[]> = new BehaviorSubject<any[]>(
        this.listPlaylist
    );
    subjectListFollow: BehaviorSubject<any[]> = new BehaviorSubject<any[]>(
        this.listFollow
    );
    subjectAddVideo: Subject<any> = new Subject<any>();
    subjectCurrentKeyChange: BehaviorSubject<any> = new BehaviorSubject<any>({
        currentKey: this.currentKey,
        currentTitle: this.currentTitle,
        currentArtist: this.currentArtist
    });

    subscriptionInitializePlaylist: any;

    constructor(
        private readonly titleService: Title,
        private readonly httpClient: HttpClient,
        private readonly initService: InitService
    ) { 
        this.init();

        this.subscriptionInitializePlaylist = this.initService.subjectInitializePlaylist.subscribe(
            data => {
                this.listPlaylist = data.listPlaylist;
                this.listFollow = data.listFollow;
                this.listVideo = data.listVideo;
                this.tabIndex = data.tabIndex;
                this.listLikeVideo = data.listLikeVideo;

                this.tabIndexInitial = this.tabIndex.slice(0);

                if (this.isRandom) {
                    this.shuffle(this.tabIndex);
                }

                this.currentKey = this.listVideo[this.currentIndex].tab_element[0].key;
                this.currentTitle = this.listVideo[this.currentIndex].titre;
                if (
                    this.listVideo[this.currentIndex].artiste &&
                    this.listVideo[this.currentIndex].artiste !== ""
                ) {
                    this.currentArtist = this.listVideo[this.currentIndex].artiste;
                } else {
                    this.currentArtist = '';
                }

                this.subjectCurrentKeyChange.next({
                    currentKey: this.currentKey,
                    currentTitle: this.currentTitle,
                    currentArtist: this.currentArtist
                });

                this.onChangeCurrentPlaylist();

                this.onChangeListPlaylist();
                this.onChangeListFollow();
            }
        );
    }

    launchYTApi() {
        (window as any).onYouTubeIframeAPIReady = () => {
            this.YT = (window as any).YT;
            this.player = new this.YT.Player("player", {
                playerVars: {
                    controls: 0,
                    hd: 1,
                    showinfo: 0,
                    origin: window.location.href
                },
                events: {
                    onStateChange: (e: any) => this.finvideo(e),
                    onError: this.catch_error.bind(this),
                    onReady: () => {
                        if (this.tabIndex !== undefined && this.tabIndex[0] !== undefined) {
                            this.player.cueVideoById(this.listVideo[0].tab_element[0].key);
                        } else {
                            setTimeout(function () {
                                if (
                                    this.tab_index !== undefined &&
                                    this.tab_index[0] !== undefined
                                ) {
                                    this.player.cueVideoById(
                                        this.liste_video[0].tab_element[0].key
                                    );
                                }
                            }, 800);
                        }

                        if (
                            localStorage.volume === "undefined" ||
                            localStorage.volume === undefined ||
                            parseInt(localStorage.volume, 10) > 100 ||
                            parseInt(localStorage.volume, 10) < 0
                        ) {
                            if (typeof this.player.getVolume() === "number") {
                                localStorage.volume = this.player.getVolume();
                            } else {
                                localStorage.volume = "100";
                            }
                        }

                        this.updateVolume(parseInt(localStorage.volume, 10));
                    }
                }
            });
        };
    }

    finvideo(etat) {
        etat = etat.data;

        switch (etat) {
            case -1:
            case 0:
            case 2:
                this.isPlaying = false;
                break;
 
            case 1:
                this.isPlaying = true;
                break;
        }

        this.subjectIsPlayingChange.next(this.isPlaying);

        if (etat === 0) {
            this.after();
        }

        if (etat === 1 || etat === -1 || etat === 3) {
            if (this.refInterval === null) {
                this.refInterval = setInterval(this.playerRunning.bind(this), 200);
            }
        }

        if (etat === 2) {
            clearInterval(this.refInterval);
            this.refInterval = null;
        }

        if (etat === 1 && !this.firstLaunched) {
            if (!this.isAutoPlay) {
                this.launchFullInit();
            } else {
                this.firstLaunched = false;

                this.testAutoPlay();
            }
        }

        if (etat === 1 && !this.isAutoPlay && this.showTapVideoYT) {
            this.disableFullInit();
        }
    }

    lecture(indice, indexInitial = false) {
        if (indexInitial) {
            this.currentIndex = indice;
        } else {
            this.currentIndex = this.tabIndex[indice];
        }

        this.player.loadVideoById(
            this.listVideo[this.currentIndex].tab_element[0].key,
            0,
            "large"
        );

        this.currentKey = this.listVideo[this.currentIndex].tab_element[0].key;
        this.currentTitle = this.listVideo[this.currentIndex].titre;
        let fullTitle = this.currentTitle;

        if (
            this.listVideo[this.currentIndex].artiste &&
            this.listVideo[this.currentIndex].artiste !== ""
        ) {
            this.currentArtist = this.listVideo[this.currentIndex].artiste;
            fullTitle += " - " + this.listVideo[this.currentIndex].artiste;
        } else {
            this.currentArtist = '';
        }

        this.titleService.setTitle(fullTitle + " - Zeffyr Music");

        this.subjectCurrentKeyChange.next({
            currentKey: this.currentKey,
            currentTitle: this.currentTitle,
            currentArtist: this.currentArtist
        });

        this.currentIndex = indice;

        this.firstLaunched = true;
    }

    before() {
        if (this.listVideo[this.tabIndex[this.currentIndex - 1]] !== undefined) {
            this.lecture(this.currentIndex - 1);
        }
    }

    after() {
        if (this.tabIndex[this.currentIndex + 1] !== undefined) {
            this.lecture(this.currentIndex + 1);
        } else if (this.isRepeat) {
            this.currentIndex = 0;
            this.lecture(this.currentIndex);
        }
    }

    catch_error(e) {
        if (this.listVideo[this.currentIndex].tab_element.length > 1) {
            this.listVideo[this.currentIndex].tab_element.shift();
            this.lecture(this.currentIndex);
        }
    }

    onPlayPause() {
        if (!this.firstLaunched) {
            this.lecture(this.currentIndex);
            return;
        }

        if (
            this.player.getPlayerState() === 2 ||
            this.player.getPlayerState() === -1 ||
            this.player.getPlayerState() === 5
        ) {
            this.player.playVideo();
            this.isPlaying = true;
        } else {
            this.player.pauseVideo();
            this.isPlaying = false;
        }

        this.subjectIsPlayingChange.next(this.isPlaying);
    }

    updateVolume(volume: number) {
        localStorage.volume = volume.toString();
        this.player.setVolume(volume);

        this.subjectVolumeChange.next(volume);
    }

    updatePositionSlider(position: number) {
        this.player.seekTo(
            parseInt((position * this.player.getDuration()).toString(), 10)
        );
    }

    removeToPlaylist(index: number) {
        this.listVideo.splice(index, 1);
        this.tabIndexInitial.pop();
        this.tabIndex = this.tabIndexInitial.slice(0);

        if (this.isRandom) {
            this.shuffle(this.tabIndex);
        }

        if (index === this.currentIndex) {
            this.player.pauseVideo();
        } else {
            if (index < this.currentIndex) {
                this.currentIndex--;
            }
        }
    }

    shuffle(v: string[]) {
        for (
            let j: number, x: string, i = v.length;
            i;
            j = parseInt((Math.random() * i).toString(), 10),
            x = v[--i],
            v[i] = v[j],
            v[j] = x
        ) { }
    }

    switchRepeat() {
        this.isRepeat = !this.isRepeat;

        this.subjectRepeatChange.next(this.isRepeat);
    }

    switchRandom() {
        this.isRandom = !this.isRandom;

        this.subjectRandomChange.next(this.isRandom);
    }

    playerRunning() {
        const currentTime = this.player.getCurrentTime() || 0;

        const currentTimeStr =
            Math.floor(currentTime / 60) +
            ":" +
            (Math.round(currentTime % 60) < 10 ? "0" : "") +
            Math.round(currentTime % 60);

        const totalTime = this.player.getDuration() || 0;

        const totalTimeStr =
            Math.floor(totalTime / 60) +
            ":" +
            (Math.round(totalTime % 60) < 10 ? "0" : "") +
            Math.round(totalTime % 60);

        const slideLength = (100 * currentTime) / totalTime;

        const loadVideo = 100 * this.player.getVideoLoadedFraction();

        this.subjectPlayerRunningChange.next(
            new PlayerRunning(currentTimeStr, totalTimeStr, slideLength, loadVideo)
        );
    }

    removeVideo(idVideo, callbackSuccess) {
        this.httpClient
            .get(
                environment.URL_SERVER + "supprimer/" + idVideo,
                environment.httpClientConfig
            )
            .subscribe(
                (data: any) => {
                    if (data.success !== undefined) {
                        for (let i = 0; i < this.listVideo.length; i++) {
                            if (this.listVideo[i].id_video === idVideo) {
                                this.listVideo.splice(i, 1);
                            }
                        }

                        callbackSuccess();
                    }
                },
                () => {
                    this.initService.onMessageUnlog();
                }
            );
    }

    testAutoPlay() {
        // tslint:disable-next-line: max-line-length
        const mp3 =
            "data:audio/mpeg;base64,/+MYxAAAAANIAUAAAASEEB/jwOFM/0MM/90b/+RhST//w4NFwOjf///PZu////9lns5GFDv//l9GlUIEEIAAAgIg8Ir/JGq3/+MYxDsLIj5QMYcoAP0dv9HIjUcH//yYSg+CIbkGP//8w0bLVjUP///3Z0x5QCAv/yLjwtGKTEFNRTMuOTeqqqqqqqqqqqqq/+MYxEkNmdJkUYc4AKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";
        // tslint:disable-next-line: max-line-length
        const ogg =
            "data:audio/ogg;base64,T2dnUwACAAAAAAAAAADqnjMlAAAAAOyyzPIBHgF2b3JiaXMAAAAAAUAfAABAHwAAQB8AAEAfAACZAU9nZ1MAAAAAAAAAAAAA6p4zJQEAAAANJGeqCj3//////////5ADdm9yYmlzLQAAAFhpcGguT3JnIGxpYlZvcmJpcyBJIDIwMTAxMTAxIChTY2hhdWZlbnVnZ2V0KQAAAAABBXZvcmJpcw9CQ1YBAAABAAxSFCElGVNKYwiVUlIpBR1jUFtHHWPUOUYhZBBTiEkZpXtPKpVYSsgRUlgpRR1TTFNJlVKWKUUdYxRTSCFT1jFloXMUS4ZJCSVsTa50FkvomWOWMUYdY85aSp1j1jFFHWNSUkmhcxg6ZiVkFDpGxehifDA6laJCKL7H3lLpLYWKW4q91xpT6y2EGEtpwQhhc+211dxKasUYY4wxxsXiUyiC0JBVAAABAABABAFCQ1YBAAoAAMJQDEVRgNCQVQBABgCAABRFcRTHcRxHkiTLAkJDVgEAQAAAAgAAKI7hKJIjSZJkWZZlWZameZaouaov+64u667t6roOhIasBACAAAAYRqF1TCqDEEPKQ4QUY9AzoxBDDEzGHGNONKQMMogzxZAyiFssLqgQBKEhKwKAKAAAwBjEGGIMOeekZFIi55iUTkoDnaPUUcoolRRLjBmlEluJMYLOUeooZZRCjKXFjFKJscRUAABAgAMAQICFUGjIigAgCgCAMAYphZRCjCnmFHOIMeUcgwwxxiBkzinoGJNOSuWck85JiRhjzjEHlXNOSuekctBJyaQTAAAQ4AAAEGAhFBqyIgCIEwAwSJKmWZomipamiaJniqrqiaKqWp5nmp5pqqpnmqpqqqrrmqrqypbnmaZnmqrqmaaqiqbquqaquq6nqrZsuqoum65q267s+rZru77uqapsm6or66bqyrrqyrbuurbtS56nqqKquq5nqq6ruq5uq65r25pqyq6purJtuq4tu7Js664s67pmqq5suqotm64s667s2rYqy7ovuq5uq7Ks+6os+75s67ru2rrwi65r66os674qy74x27bwy7ouHJMnqqqnqq7rmarrqq5r26rr2rqmmq5suq4tm6or26os67Yry7aumaosm64r26bryrIqy77vyrJui67r66Ys67oqy8Lu6roxzLat+6Lr6roqy7qvyrKuu7ru+7JuC7umqrpuyrKvm7Ks+7auC8us27oxuq7vq7It/KosC7+u+8Iy6z5jdF1fV21ZGFbZ9n3d95Vj1nVhWW1b+V1bZ7y+bgy7bvzKrQvLstq2scy6rSyvrxvDLux8W/iVmqratum6um7Ksq/Lui60dd1XRtf1fdW2fV+VZd+3hV9pG8OwjK6r+6os68Jry8ov67qw7MIvLKttK7+r68ow27qw3L6wLL/uC8uq277v6rrStXVluX2fsSu38QsAABhwAAAIMKEMFBqyIgCIEwBAEHIOKQahYgpCCKGkEEIqFWNSMuakZM5JKaWUFEpJrWJMSuaclMwxKaGUlkopqYRSWiqlxBRKaS2l1mJKqcVQSmulpNZKSa2llGJMrcUYMSYlc05K5pyUklJrJZXWMucoZQ5K6iCklEoqraTUYuacpA46Kx2E1EoqMZWUYgupxFZKaq2kFGMrMdXUWo4hpRhLSrGVlFptMdXWWqs1YkxK5pyUzDkqJaXWSiqtZc5J6iC01DkoqaTUYiopxco5SR2ElDLIqJSUWiupxBJSia20FGMpqcXUYq4pxRZDSS2WlFosqcTWYoy1tVRTJ6XFklKMJZUYW6y5ttZqDKXEVkqLsaSUW2sx1xZjjqGkFksrsZWUWmy15dhayzW1VGNKrdYWY40x5ZRrrT2n1mJNMdXaWqy51ZZbzLXnTkprpZQWS0oxttZijTHmHEppraQUWykpxtZara3FXEMpsZXSWiypxNhirLXFVmNqrcYWW62ltVprrb3GVlsurdXcYqw9tZRrrLXmWFNtBQAADDgAAASYUAYKDVkJAEQBAADGMMYYhEYpx5yT0ijlnHNSKucghJBS5hyEEFLKnINQSkuZcxBKSSmUklJqrYVSUmqttQIAAAocAAACbNCUWByg0JCVAEAqAIDBcTRNFFXVdX1fsSxRVFXXlW3jVyxNFFVVdm1b+DVRVFXXtW3bFn5NFFVVdmXZtoWiqrqybduybgvDqKqua9uybeuorqvbuq3bui9UXVmWbVu3dR3XtnXd9nVd+Bmzbeu2buu+8CMMR9/4IeTj+3RCCAAAT3AAACqwYXWEk6KxwEJDVgIAGQAAgDFKGYUYM0gxphhjTDHGmAAAgAEHAIAAE8pAoSErAoAoAADAOeecc84555xzzjnnnHPOOeecc44xxhhjjDHGGGOMMcYYY4wxxhhjjDHGGGOMMcYYY0wAwE6EA8BOhIVQaMhKACAcAABACCEpKaWUUkoRU85BSSmllFKqFIOMSkoppZRSpBR1lFJKKaWUIqWgpJJSSimllElJKaWUUkoppYw6SimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaVUSimllFJKKaWUUkoppRQAYPLgAACVYOMMK0lnhaPBhYasBAByAwAAhRiDEEJpraRUUkolVc5BKCWUlEpKKZWUUqqYgxBKKqmlklJKKbXSQSihlFBKKSWUUkooJYQQSgmhlFRCK6mEUkoHoYQSQimhhFRKKSWUzkEoIYUOQkmllNRCSB10VFIpIZVSSiklpZQ6CKGUklJLLZVSWkqpdBJSKamV1FJqqbWSUgmhpFZKSSWl0lpJJbUSSkklpZRSSymFVFJJJYSSUioltZZaSqm11lJIqZWUUkqppdRSSiWlkEpKqZSSUmollZRSaiGVlEpJKaTUSimlpFRCSamlUlpKLbWUSkmptFRSSaWUlEpJKaVSSksppRJKSqmllFpJKYWSUkoplZJSSyW1VEoKJaWUUkmptJRSSymVklIBAEAHDgAAAUZUWoidZlx5BI4oZJiAAgAAQABAgAkgMEBQMApBgDACAQAAAADAAAAfAABHARAR0ZzBAUKCwgJDg8MDAAAAAAAAAAAAAACAT2dnUwAEAAAAAAAAAADqnjMlAgAAADzQPmcBAQA=";

        const audio = new Audio();
        const src = audio.canPlayType("audio/ogg") ? ogg : mp3;
        audio.autoplay = true;
        audio.volume = 0;

        audio.addEventListener(
            "play",
            () => {
                this.isAutoPlay = true;
            },
            false
        );

        audio.src = src;
    }

    launchFullInit() {
        this.showTapVideoYT = true;
        this.subjectMessageTap.next(this.showTapVideoYT);
    }

    disableFullInit() {
        this.isAutoPlay = true;
        this.showTapVideoYT = false;

        this.subjectMessageTap.next(this.showTapVideoYT);
    }

    onChangeCurrentPlaylist() {
        this.subjectCurrentPlaylistChange.next(this.listVideo);
    }

    onChangeListPlaylist() {
        this.subjectListPlaylist.next(this.listPlaylist);
    }

    onChangeListFollow() {
        this.subjectListFollow.next(this.listFollow);
    }

    onLoadListLogin(listPlaylist, listFollow) {
        this.listPlaylist = listPlaylist;
        this.listFollow = listFollow;

        this.onChangeListPlaylist();
        this.onChangeListFollow();
    }

    addNewPlaylist(idPlaylist, title) {
        this.listPlaylist.unshift({
            id_playlist: idPlaylist,
            titre: title
        });

        this.onChangeListPlaylist();
    }

    editPlaylistTitle(idPlaylist, title) {
        this.listPlaylist
            .filter(a => a.id_playlist === idPlaylist)
            .map(a => {
                a.titre = title;
            });

        this.onChangeListPlaylist();
    }

    switchVisibilityPlaylist(idPlaylist, isPrivate) {
        let status: string;

        if (isPrivate) {
            status = "prive";
        } else {
            status = "public";
        }

        this.httpClient
            .get(
                environment.URL_SERVER +
                "switch_publique?id_playlist=" +
                idPlaylist +
                "&statut=" +
                status,
                environment.httpClientConfig
            )
            .subscribe(
                (data: any) => {
                    if (data.success !== undefined) {
                        this.listPlaylist
                            .filter(a => a.id_playlist === idPlaylist)
                            .map(a => {
                                a.prive = isPrivate;
                            });
                        this.onChangeListPlaylist();
                    }
                },
                () => {
                    this.initService.onMessageUnlog();
                }
            );
    }

    deletePlaylist(idPlaylist) {
        this.httpClient
            .get(
                environment.URL_SERVER + "playlist-supprimer/" + idPlaylist,
                environment.httpClientConfig
            )
            .subscribe(
                (data: any) => {
                    if (data.success !== undefined) {
                        for (let i = 0; i < this.listPlaylist.length; i++) {
                            if (this.listPlaylist[i].id_playlist === idPlaylist) {
                                this.listPlaylist.splice(i, 1);
                            }
                        }
                        this.onChangeListPlaylist();
                    }
                },
                () => {
                    this.initService.onMessageUnlog();
                }
            );
    }

    deleteFollow(idPlaylist) {
        this.switchFollow(idPlaylist);
    }

    switchFollow(idPlaylist, title = "") {
        this.httpClient
            .get(
                environment.URL_SERVER + "switch_suivi/" + idPlaylist,
                environment.httpClientConfig
            )
            .subscribe(
                (data: any) => {
                    if (data.success !== undefined) {
                        if (data.est_suivi) {
                            this.listFollow.unshift({
                                id_playlist: idPlaylist,
                                titre: title
                            });
                        } else {
                            for (let i = 0; i < this.listFollow.length; i++) {
                                if (this.listFollow[i].id_playlist === idPlaylist) {
                                    this.listFollow.splice(i, 1);
                                }
                            }
                        }

                        this.onChangeListFollow();
                    }
                },
                () => {
                    this.initService.onMessageUnlog();
                }
            );
    }

    addVideoInPlaylist(key, artist, title) {
        this.subjectAddVideo.next({ key, artist, title });
    }

    addVideoInPlaylistRequest(idPlaylist, addKey, addTitle, addArtist) {
        this.httpClient
            .post(
                environment.URL_SERVER + "insert_video",
                {
                    id_playlist: idPlaylist,
                    key: addKey,
                    titre: addTitle,
                    artiste: addArtist
                },
                environment.httpClientConfig
            )
            .subscribe(
                (data: any) => {
                    if (data.success !== undefined) {
                        this.onChangeListPlaylist();
                    }
                },
                () => {
                    this.initService.onMessageUnlog();
                }
            );
    }

    addInCurrentList(playlist) {
        this.listVideo = this.listVideo.concat(playlist);

        const index = this.tabIndexInitial.length;
        const iMax = this.listVideo.length;

        for (let i = 0; i < iMax; i++) {
            this.tabIndexInitial.push(i + index);
            this.tabIndex.push(i + index);
        }
        
        if (this.isRandom) {
            this.shuffle(this.tabIndex);
        }

        this.onChangeCurrentPlaylist();
    }

    runPlaylist(playlist, index) {
        this.listVideo = [];
        this.tabIndexInitial = [];
        this.tabIndex = [];
        this.addInCurrentList(playlist);

        this.lecture(index, true);
    }

    isLiked(key: string) {
        const found = this.listLikeVideo.find(e => e.key===key);
        return (found !== undefined);
    }

    addLike(key: string) {
        this.httpClient
            .post(
                environment.URL_SERVER + "add_like",
                {
                    key
                },
                environment.httpClientConfig
            )
            .subscribe(
                (data: any) => {
                    if (data.success !== undefined) {
                       this.listLikeVideo.unshift(data.like);
                    }
                },
                () => {
                    this.initService.onMessageUnlog();
                }
            );
    }

    removeLike(key: string) {
        this.httpClient
            .post(
                environment.URL_SERVER + "remove_like",
                {
                    key
                },
                environment.httpClientConfig
            )
            .subscribe(
                (data: any) => {
                    if (data.success !== undefined) {
                       const index = this.listLikeVideo.findIndex(e => e.key === key);

                       if(index>0){
                           this.listLikeVideo.splice(index, 1);
                       }
                    }
                },
                () => {
                    this.initService.onMessageUnlog();
                }
            );
    }

    ngOnDestroy() {
        this.subscriptionInitializePlaylist.unsubscribe();
    }

    private init() {
        const tag = document.createElement("script");
        tag.src = "//www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
}
