import { HttpClient } from '@angular/common/http';
import { effect, Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Subject, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { InitService } from './init.service';
import { UserVideo, Video } from '../models/video.model';
import { isPlatformBrowser } from '@angular/common';
import { UserDataStore } from '../store/user-data/user-data.store';
import { PlayerStore } from '../store/player/player.store';
import { QueueStore } from '../store/queue/queue.store';
import { UiStore } from '../store/ui/ui.store';
import { YoutubePlayerService } from './youtube-player.service';
import { FollowItem } from '../models/follow.model';
import { UserPlaylist } from '../models/playlist.model';

/**
 * PlayerService - Playback orchestration and playlist management
 *
 * Coordinates YouTube player, stores and playlist CRUD operations.
 */
@Injectable({
  providedIn: 'root',
})
export class PlayerService implements OnDestroy {
  private readonly titleService = inject(Title);
  private readonly httpClient = inject(HttpClient);
  private readonly initService = inject(InitService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly userDataStore = inject(UserDataStore);
  private readonly playerStore = inject(PlayerStore);
  private readonly queueStore = inject(QueueStore);
  private readonly uiStore = inject(UiStore);
  private readonly youtubePlayer = inject(YoutubePlayerService);

  tabIndexInitial: number[] = [];
  tabIndex: number[] = [];
  currentIndex = 0;
  listVideo: Video[] = [];
  isPlaying = false;
  refInterval: number | null = null;
  currentTitle = '';
  currentArtist = '';
  currentKey = '';

  private stateChangeSubscription: Subscription;
  private queueInitialized = false;

  private errorMessageSubject = new Subject<string | null>();
  errorMessage$ = this.errorMessageSubject.asObservable();

  private isBrowser: boolean;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.youtubePlayer.initPlayer('player');

      this.stateChangeSubscription = this.youtubePlayer.stateChange$.subscribe(state => {
        this.handleStateChange(state);
      });

      this.youtubePlayer.error$.subscribe(error => {
        if (error) {
          this.errorMessageSubject.next(error);
        }
      });

      effect(() => {
        const items = this.queueStore.items();
        const currentKey = this.queueStore.currentKey();

        if (items.length > 0 && currentKey && !this.queueInitialized) {
          this.queueInitialized = true;

          this.listVideo = items;
          this.tabIndex = this.queueStore.tabIndex();
          this.tabIndexInitial = this.queueStore.tabIndexOriginal();
          this.currentKey = currentKey;
          this.currentTitle = this.queueStore.currentTitle();
          this.currentArtist = this.queueStore.currentArtist();

          this.youtubePlayer.cueVideo(currentKey);
        }
      });
    }
  }

  private handleStateChange(state: YT.PlayerState): void {
    switch (state) {
      case 0: // ENDED
        this.isPlaying = false;
        this.playerStore.setEnded();
        break;
      case 2: // PAUSED
        this.isPlaying = false;
        this.playerStore.pause();
        break;
      case -1: // UNSTARTED
        this.isPlaying = false;
        this.playerStore.setIdle();
        break;
      case 1: // PLAYING
        this.isPlaying = true;
        this.playerStore.play();
        break;
      case 3: // BUFFERING
        this.playerStore.setLoading();
        break;
    }

    if (state === 0) {
      this.after();
    }

    if (state === 1 || state === -1 || state === 3) {
      if (this.refInterval === null) {
        this.refInterval = window.setInterval(this.playerRunning.bind(this), 200);
      }
    }

    if (state === 2) {
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

    this.youtubePlayer.loadVideo(this.listVideo[this.currentIndex].key);

    this.currentKey = this.listVideo[this.currentIndex].key;
    this.currentTitle = this.listVideo[this.currentIndex].titre;
    let fullTitle = this.currentTitle;

    if (
      this.listVideo[this.currentIndex].artiste &&
      this.listVideo[this.currentIndex].artiste !== ''
    ) {
      this.currentArtist = this.listVideo[this.currentIndex].artiste;
      fullTitle += ' - ' + this.listVideo[this.currentIndex].artiste;
    } else {
      this.currentArtist = '';
    }

    this.titleService.setTitle(fullTitle + ' - Zeffyr Music');

    this.queueStore.goToIndex(indice);

    this.currentIndex = indice;
  }

  before() {
    this.youtubePlayer.clearError();
    if (this.listVideo[this.tabIndex[this.currentIndex - 1]] !== undefined) {
      this.lecture(this.currentIndex - 1);
    }
  }

  after() {
    this.youtubePlayer.clearError();
    if (this.tabIndex[this.currentIndex + 1] !== undefined) {
      this.lecture(this.currentIndex + 1);
    } else if (this.playerStore.isRepeat()) {
      this.currentIndex = 0;
      this.lecture(this.currentIndex);
    }
  }

  onPlayPause() {
    const isNowPlaying = this.youtubePlayer.togglePlayPause();
    this.isPlaying = isNowPlaying;
    // PlayerStore est mis à jour via handleStateChange quand YouTube émet l'état
  }

  updateVolume(volume: number) {
    this.youtubePlayer.setVolume(volume);
    this.playerStore.setVolume(volume);
  }

  updatePositionSlider(position: number) {
    this.youtubePlayer.seekToPercent(position * 100);
  }

  removeToPlaylist(index: number) {
    this.queueStore.setSource(null, null);
    this.listVideo.splice(index, 1);
    this.tabIndexInitial.pop();
    this.tabIndex = this.tabIndexInitial.slice(0);

    if (this.queueStore.isShuffled()) {
      this.shuffle(this.tabIndex);
    }

    if (index === this.currentIndex) {
      this.youtubePlayer.pause();
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
      j = Number.parseInt((Math.random() * i).toString(), 10), x = v[--i], v[i] = v[j], v[j] = x
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      null;
    }
  }

  switchRepeat() {
    this.playerStore.toggleRepeat();
  }

  switchRandom() {
    const isShuffled = this.queueStore.toggleShuffle();

    if (isShuffled) {
      this.shuffle(this.tabIndex);
    } else {
      this.tabIndex = this.tabIndexInitial.slice(0);
    }
  }

  playerRunning() {
    const currentTime = this.youtubePlayer.getCurrentTime();
    const totalTime = this.youtubePlayer.getDuration();
    const loadVideo = 100 * this.youtubePlayer.getLoadedFraction();

    this.playerStore.updateProgress(currentTime, totalTime, loadVideo / 100);
  }

  removeVideo(idVideo: string, callbackSuccess: () => void) {
    this.httpClient.get(environment.URL_SERVER + 'supprimer/' + idVideo).subscribe({
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
      },
    });
  }

  onLoadListLogin(listPlaylist: UserPlaylist[], listFollow: FollowItem[], listLike: UserVideo[]) {
    this.userDataStore.setPlaylists(listPlaylist);
    this.userDataStore.setFollows(listFollow);
    this.userDataStore.setLikedVideos(listLike);
  }

  addNewPlaylist(idPlaylist: string, title: string) {
    const playlist: UserPlaylist = {
      id_playlist: idPlaylist,
      titre: title,
      prive: false,
    };
    this.userDataStore.addPlaylist(playlist);
  }

  editPlaylistTitle(idPlaylist: string, title: string) {
    this.userDataStore.updatePlaylistTitle(idPlaylist, title);
  }

  switchVisibilityPlaylist(idPlaylist: string, isPrivate: boolean) {
    let status: string;

    if (isPrivate) {
      status = 'prive';
    } else {
      status = 'public';
    }

    this.httpClient
      .get(
        environment.URL_SERVER + 'switch_publique?id_playlist=' + idPlaylist + '&statut=' + status
      )
      .subscribe({
        next: (data: { success: boolean }) => {
          if (data.success !== undefined && data.success) {
            this.userDataStore.togglePlaylistVisibility(idPlaylist, isPrivate);
          }
        },
        error: () => {
          this.initService.onMessageUnlog();
        },
      });
  }

  deletePlaylist(idPlaylist: string) {
    this.httpClient.get(environment.URL_SERVER + 'playlist-supprimer/' + idPlaylist).subscribe({
      next: (data: { success: boolean }) => {
        if (data.success !== undefined && data.success) {
          this.userDataStore.removePlaylist(idPlaylist);
        }
      },
      error: () => {
        this.initService.onMessageUnlog();
      },
    });
  }

  deleteFollow(idPlaylist: string) {
    this.switchFollow(idPlaylist);
  }

  switchFollow(idPlaylist: string, title = '', artist = '', urlImage = '') {
    this.httpClient.get(environment.URL_SERVER + 'switch_suivi/' + idPlaylist).subscribe({
      next: (data: { success: boolean; est_suivi: boolean }) => {
        if (data.success !== undefined && data.success) {
          if (data.est_suivi) {
            this.userDataStore.addFollow({
              id_playlist: idPlaylist,
              titre: title,
              artiste: artist,
              url_image: urlImage,
            });
          } else {
            this.userDataStore.removeFollow(idPlaylist);
          }
        }
      },
      error: () => {
        this.initService.onMessageUnlog();
      },
    });
  }

  addVideoInPlaylist(key: string, artist: string, title: string, duration: number) {
    this.uiStore.openAddVideoModal({ key, artist, title, duration });
  }

  addVideoInPlaylistRequest(
    idPlaylist: string,
    addKey: string,
    addTitle: string,
    addArtist: string,
    addDuration: number
  ) {
    this.httpClient
      .post(environment.URL_SERVER + 'insert_video', {
        id_playlist: idPlaylist,
        key: addKey,
        titre: addTitle,
        artiste: addArtist,
        duree: addDuration,
      })
      .subscribe({
        error: () => {
          this.initService.onMessageUnlog();
        },
      });
  }

  addInCurrentList(playlist: Video[], idTopCharts: string | null = '') {
    if (this.listVideo.length === 0) {
      // Source sera définie via queueStore.setQueue dans runPlaylist
      // ou directement ici si appelé directement
      this.queueStore.setSource(playlist[0]?.id_playlist ?? null, idTopCharts);
    } else {
      // Si on ajoute à une liste existante, on ne peut plus identifier une source unique
      this.queueStore.setSource(null, null);
    }
    this.listVideo = this.listVideo.concat(playlist);

    const index = this.tabIndexInitial.length;
    const iMax = this.listVideo.length;

    for (let i = 0; i < iMax; i++) {
      this.tabIndexInitial.push(i + index);
      this.tabIndex.push(i + index);
    }

    if (this.queueStore.isShuffled()) {
      this.shuffle(this.tabIndex);
    }

    this.queueStore.addToQueue(playlist);
  }

  addVideoAfterCurrentInList(video: Video) {
    this.listVideo.splice(this.currentIndex + 1, 0, video);

    const index = this.tabIndexInitial.length;
    const iMax = this.listVideo.length;

    this.tabIndexInitial.push(index + 1);
    this.tabIndex.push(iMax + 1);

    if (this.queueStore.isShuffled()) {
      this.shuffle(this.tabIndex);
    }

    this.queueStore.addAfterCurrent(video);
  }

  runPlaylist(playlist: Video[], index: number, idTopCharts: string | null = '') {
    this.listVideo = [];
    this.tabIndexInitial = [];
    this.tabIndex = [];
    this.addInCurrentList(playlist, idTopCharts);
    this.queueStore.setQueue(playlist, playlist[0]?.id_playlist ?? null, idTopCharts);

    this.lecture(index, true);
  }

  clearErrorMessage() {
    this.youtubePlayer.clearError();
    this.errorMessageSubject.next(null);
  }

  ngOnDestroy() {
    this.stateChangeSubscription?.unsubscribe();
    this.youtubePlayer.destroy();
  }
}
