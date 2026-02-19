import { effect, Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { Video } from '../models/video.model';
import { isPlatformBrowser } from '@angular/common';
import { PlayerStore } from '../store/player/player.store';
import { QueueStore } from '../store/queue/queue.store';
import { UiStore } from '../store/ui/ui.store';
import { YoutubePlayerService } from './youtube-player.service';

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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly playerStore = inject(PlayerStore);
  private readonly queueStore = inject(QueueStore);
  private readonly uiStore = inject(UiStore);
  private readonly youtubePlayer = inject(YoutubePlayerService);

  tabIndexInitial: number[] = [];
  tabIndex: number[] = [];
  currentIndex = 0;
  listVideo: Video[] = [];
  isPlaying = false;
  currentTitle = '';
  currentArtist = '';
  currentKey = '';

  private stateChangeSubscription!: Subscription;
  private errorSubscription!: Subscription;
  private queueInitialized = false;

  private isBrowser: boolean;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.youtubePlayer.initPlayer('player');

      this.stateChangeSubscription = this.youtubePlayer.stateChange$.subscribe(state => {
        this.handleStateChange(state);
      });

      this.errorSubscription = this.youtubePlayer.error$.subscribe(error => {
        if (error) {
          this.playerStore.setError(error);
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
    // PlayerStore is updated via handleStateChange when YouTube emits the state
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

  /** Removes a video from the current playback queue by its id_video */
  removeVideoFromQueue(idVideo: string): void {
    for (let i = 0; i < this.listVideo.length; i++) {
      if (this.listVideo[i].id_video === idVideo) {
        // Use removeToPlaylist logic to properly update indices
        this.removeToPlaylist(i);
        break;
      }
    }
  }

  addVideoInPlaylist(key: string, artist: string, title: string, duration: string | number) {
    const durationNum = typeof duration === 'string' ? parseInt(duration, 10) : duration;
    this.uiStore.openAddVideoModal({ key, artist, title, duration: durationNum });
  }

  addInCurrentList(playlist: Video[], idTopCharts: string | null = '') {
    if (this.listVideo.length === 0) {
      // Source will be set via queueStore.setQueue in runPlaylist
      // or directly here if called directly
      this.queueStore.setSource(playlist[0]?.id_playlist ?? null, idTopCharts);
    } else {
      // If adding to an existing list, we can no longer identify a single source
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

  runPlaylist(
    playlist: Video[],
    index: number,
    idTopCharts: string | null = '',
    playlistId: string | null = null
  ) {
    if (playlist.length === 0) {
      return;
    }

    this.listVideo = [];
    this.tabIndexInitial = [];
    this.tabIndex = [];
    const sourcePlaylistId = playlistId ?? playlist[0]?.id_playlist ?? null;
    this.addInCurrentList(playlist, idTopCharts);
    this.queueStore.setQueue(playlist, sourcePlaylistId, idTopCharts);

    this.lecture(index, true);
  }

  clearErrorMessage() {
    this.youtubePlayer.clearError();
    this.playerStore.clearError();
  }

  ngOnDestroy() {
    this.stateChangeSubscription?.unsubscribe();
    this.errorSubscription?.unsubscribe();
    this.youtubePlayer.destroy();
  }
}
