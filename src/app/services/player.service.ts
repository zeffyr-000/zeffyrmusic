import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { BehaviorSubject, Subject, Subscription } from "rxjs";
import { PlayerRunning } from "src/app/models/player-running.model";
import { environment } from "../../environments/environment";
import { InitService } from "./init.service";
import { UserVideo, Video, VideoItem } from "../models/video.model";
import { UserPlaylist } from "../models/playlist.model";
import { FollowItem } from "../models/follow.model";

interface CurrentKey {
    currentKey: string;
    currentTitle: string;
    currentArtist: string;
}

@Injectable({
    providedIn: "root"
})
export class PlayerService implements OnDestroy {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    player: any;
    tabIndexInitial: number[];
    tabIndex: number[];
    isRandom: boolean;
    currentIndex = 0;
    isRepeat: boolean;
    listPlaylist: UserPlaylist[] = [];
    listFollow: FollowItem[] = [];
    listVideo: Video[] = [];
    isPlaying = false;
    refInterval: number | null = null;
    currentTitle = '';
    currentArtist = '';
    currentKey = '';
    currentIdPlaylist = '';
    currentIdTopCharts = '';
    listLikeVideo: UserVideo[] = [];

    subjectCurrentPlaylistChange: BehaviorSubject<Video[]> = new BehaviorSubject<Video[]>([]);
    subjectRepeatChange: Subject<boolean> = new Subject<boolean>();
    subjectRandomChange: Subject<boolean> = new Subject<boolean>();
    subjectIsPlayingChange: BehaviorSubject<boolean> = new BehaviorSubject<
        boolean
    >(false);
    subjectVolumeChange: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    subjectPlayerRunningChange: BehaviorSubject<
        PlayerRunning
    > = new BehaviorSubject<PlayerRunning>(undefined);
    subjectListPlaylist: BehaviorSubject<UserPlaylist[]> = new BehaviorSubject<UserPlaylist[]>(
        this.listPlaylist
    );
    subjectListFollow: BehaviorSubject<FollowItem[]> = new BehaviorSubject<FollowItem[]>(
        this.listFollow
    );
    subjectListLikeVideo: BehaviorSubject<UserVideo[]> = new BehaviorSubject<UserVideo[]>(
        this.listLikeVideo
    );
    subjectAddVideo: Subject<VideoItem> = new Subject<VideoItem>();
    subjectCurrentKeyChange: BehaviorSubject<CurrentKey> = new BehaviorSubject<CurrentKey>({
        currentKey: this.currentKey,
        currentTitle: this.currentTitle,
        currentArtist: this.currentArtist
    });

    subscriptionInitializePlaylist: Subscription;

    constructor(
        private readonly titleService: Title,
        private readonly httpClient: HttpClient,
        private readonly initService: InitService
    ) {
        if ('requestIdleCallback' in window) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).requestIdleCallback(() => this.init());
        } else {
            setTimeout(() => this.init(), 0);
        }

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

                this.currentKey = this.listVideo[this.currentIndex].key;
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
                this.onChangeListLikeVideo();
            }
        );
    }

    onStateChangeYT(event: { data: number }) {
        this.finvideo(event);
    }

    onReadyYT() {
        if (this.tabIndex !== undefined && this.tabIndex[0] !== undefined) {
            this.player.cueVideoById(this.listVideo[0].key);
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

    launchYTApi() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).onYouTubeIframeAPIReady = () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.YT = (window as any).YT;
            this.player = new this.YT.Player("player", {
                playerVars: {
                    controls: 0,
                    hd: 1,
                    showinfo: 0,
                    origin: window.location.href
                },
                events: {
                    onStateChange: this.onStateChangeYT.bind(this),
                    onReady: this.onReadyYT.bind(this)
                }
            });
        };
    }

    finvideo(state: { data: number }) {
        switch (state.data) {
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

        if (state.data === 0) {
            this.after();
        }

        if (state.data === 1 || state.data === -1 || state.data === 3) {
            if (this.refInterval === null) {
                this.refInterval = window.setInterval(this.playerRunning.bind(this), 200);
            }
        }

        if (state.data === 2) {
            clearInterval(this.refInterval);
            this.refInterval = null;
        }
    }

    lecture(indice: number, indexInitial = false) {
        if (indexInitial) {
            this.currentIndex = indice;
        } else {
            this.currentIndex = this.tabIndex[indice];
        }

        this.player.loadVideoById(
            this.listVideo[this.currentIndex].key,
            0,
            "large"
        );

        this.currentKey = this.listVideo[this.currentIndex].key;
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

    onPlayPause() {
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
        this.currentIdTopCharts = '';
        this.currentIdPlaylist = '';
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

    shuffle(v: number[]) {
        for (
            let j: number, x: number, i = v.length;
            i;
            j = parseInt((Math.random() * i).toString(), 10),
            x = v[--i],
            v[i] = v[j],
            v[j] = x
        ) {
            null;
        }
    }

    switchRepeat() {
        this.isRepeat = !this.isRepeat;

        this.subjectRepeatChange.next(this.isRepeat);
    }

    switchRandom() {
        this.isRandom = !this.isRandom;

        if (this.isRandom) {
            this.shuffle(this.tabIndex);
        } else {
            this.tabIndex = this.tabIndexInitial.slice(0);
        }

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

    removeVideo(idVideo: string, callbackSuccess: () => void) {
        this.httpClient
            .get(
                environment.URL_SERVER + "supprimer/" + idVideo,
                environment.httpClientConfig
            )
            .subscribe({
                next: (data: { success: boolean }) => {
                    if (data.success !== undefined && data.success) {
                        for (let i = 0; i < this.listVideo.length; i++) {
                            if (this.listVideo[i].id_video === idVideo) {
                                this.listVideo.splice(i, 1);
                            }
                        }

                        callbackSuccess();
                    }
                },
                error: () => {
                    this.initService.onMessageUnlog();
                }
            });
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

    onChangeListLikeVideo() {
        this.subjectListLikeVideo.next(this.listLikeVideo);
    }

    onLoadListLogin(listPlaylist: UserPlaylist[], listFollow: FollowItem[], listLike: UserVideo[]) {
        this.listPlaylist = listPlaylist;
        this.listFollow = listFollow;
        this.listLikeVideo = listLike;

        this.onChangeListPlaylist();
        this.onChangeListFollow();
        this.onChangeListLikeVideo();
    }

    addNewPlaylist(idPlaylist: string, title: string) {
        this.listPlaylist.unshift({
            id_playlist: idPlaylist,
            titre: title,
            prive: false
        });

        this.onChangeListPlaylist();
    }

    editPlaylistTitle(idPlaylist: string, title: string) {
        this.listPlaylist
            .filter(a => a.id_playlist === idPlaylist)
            .map(a => {
                a.titre = title;
            });

        this.onChangeListPlaylist();
    }

    switchVisibilityPlaylist(idPlaylist: string, isPrivate: boolean) {
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
            .subscribe({
                next: (data: { success: boolean }) => {
                    if (data.success !== undefined && data.success) {
                        this.listPlaylist
                            .filter(a => a.id_playlist === idPlaylist)
                            .map(a => {
                                a.prive = isPrivate;
                            });
                        this.onChangeListPlaylist();
                    }
                },
                error: () => {
                    this.initService.onMessageUnlog();
                }
            });
    }

    deletePlaylist(idPlaylist: string) {
        this.httpClient
            .get(
                environment.URL_SERVER + "playlist-supprimer/" + idPlaylist,
                environment.httpClientConfig
            )
            .subscribe({
                next: (data: { success: boolean }) => {
                    if (data.success !== undefined && data.success) {
                        for (let i = 0; i < this.listPlaylist.length; i++) {
                            if (this.listPlaylist[i].id_playlist === idPlaylist) {
                                this.listPlaylist.splice(i, 1);
                            }
                        }
                        this.onChangeListPlaylist();
                    }
                },
                error: () => {
                    this.initService.onMessageUnlog();
                }
            });
    }

    deleteFollow(idPlaylist: string) {
        this.switchFollow(idPlaylist);
    }

    switchFollow(idPlaylist: string, title = "") {
        this.httpClient
            .get(
                environment.URL_SERVER + "switch_suivi/" + idPlaylist,
                environment.httpClientConfig
            )
            .subscribe({
                next: (data: { success: boolean, est_suivi: boolean }) => {
                    if (data.success !== undefined && data.success) {
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
                error: () => {
                    this.initService.onMessageUnlog();
                }
            });
    }

    addVideoInPlaylist(key: string, artist: string, title: string, duration: number) {
        this.subjectAddVideo.next({ key, artist, title, duration });
    }

    addVideoInPlaylistRequest(idPlaylist: string, addKey: string, addTitle: string, addArtist: string, addDuration: number) {
        this.httpClient
            .post(
                environment.URL_SERVER + "insert_video",
                {
                    id_playlist: idPlaylist,
                    key: addKey,
                    titre: addTitle,
                    artiste: addArtist,
                    duree: addDuration
                },
                environment.httpClientConfig
            )
            .subscribe({
                next: (data: { success: boolean }) => {
                    if (data.success !== undefined && data.success) {
                        this.onChangeListPlaylist();
                    }
                },
                error: () => {
                    this.initService.onMessageUnlog();
                }
            });
    }

    addInCurrentList(playlist: Video[], idTopCharts: string | null = '') {
        if (this.listVideo.length === 0) {
            this.currentIdPlaylist = playlist[0].id_playlist;
            this.currentIdTopCharts = idTopCharts;
        }
        else {
            this.currentIdPlaylist = '';
            this.currentIdTopCharts = '';
        }
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

    addVideoAfterCurrentInList(video: Video) {
        this.listVideo.splice(this.currentIndex + 1, 0, video);

        const index = this.tabIndexInitial.length;
        const iMax = this.listVideo.length;

        this.tabIndexInitial.push(index + 1);
        this.tabIndex.push(iMax + 1);

        if (this.isRandom) {
            this.shuffle(this.tabIndex);
        }

        this.onChangeCurrentPlaylist();
    }

    runPlaylist(playlist: Video[], index: number, idTopCharts: string | null = '') {
        this.listVideo = [];
        this.tabIndexInitial = [];
        this.tabIndex = [];
        this.addInCurrentList(playlist, idTopCharts);

        this.lecture(index, true);
    }

    isLiked(key: string) {
        let found;

        if (this.listLikeVideo) {
            found = this.listLikeVideo.find(e => e.key === key);
        }
        return (found && found !== undefined);
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
                (data: { success: boolean, like: UserVideo }) => {
                    if (data.success !== undefined && data.success) {
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
            .subscribe({
                next: (data: { success: boolean }) => {
                    if (data.success !== undefined && data.success) {
                        this.listLikeVideo = this.listLikeVideo.filter(e => e.key !== key);
                    }
                },
                error: () => {
                    this.initService.onMessageUnlog();
                }
            });
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
