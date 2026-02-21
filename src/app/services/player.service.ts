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
 * All state is held in QueueStore and PlayerStore (single source of truth).
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
          this.youtubePlayer.cueVideo(currentKey);
        }
      });
    }
  }

  private handleStateChange(state: YT.PlayerState): void {
    switch (state) {
      case 0: // ENDED
        this.playerStore.setEnded();
        break;
      case 2: // PAUSED
        this.playerStore.pause();
        break;
      case -1: // UNSTARTED
        this.playerStore.setIdle();
        break;
      case 1: // PLAYING
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
    const items = this.queueStore.items();
    const tabIndex = this.queueStore.tabIndex();
    let actualItemIndex: number;
    let tabIndexPosition: number;

    if (indexInitial) {
      // indice = direct index into items[]
      actualItemIndex = indice;
      tabIndexPosition = tabIndex.indexOf(indice);
      if (tabIndexPosition === -1) tabIndexPosition = indice;
    } else {
      // indice = position in tabIndex[]
      tabIndexPosition = indice;
      actualItemIndex = tabIndex[indice];
    }

    const video = items[actualItemIndex];
    this.youtubePlayer.loadVideo(video.key);

    let fullTitle = video.titre;
    if (video.artiste && video.artiste !== '') {
      fullTitle += ' - ' + video.artiste;
    }

    this.titleService.setTitle(fullTitle + ' - Zeffyr Music');
    this.queueStore.goToIndex(tabIndexPosition);
  }

  before() {
    this.youtubePlayer.clearError();
    const items = this.queueStore.items();
    const tabIndex = this.queueStore.tabIndex();
    const currentIndex = this.queueStore.currentIndex();

    if (items[tabIndex[currentIndex - 1]] !== undefined) {
      this.lecture(currentIndex - 1);
    }
  }

  after() {
    this.youtubePlayer.clearError();
    const tabIndex = this.queueStore.tabIndex();
    const currentIndex = this.queueStore.currentIndex();

    if (tabIndex[currentIndex + 1] !== undefined) {
      this.lecture(currentIndex + 1);
    } else if (this.playerStore.isRepeat()) {
      this.lecture(0);
    }
  }

  onPlayPause() {
    this.youtubePlayer.togglePlayPause();
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

    const tabIndex = this.queueStore.tabIndex();
    const currentIndex = this.queueStore.currentIndex();
    const currentActualIndex = tabIndex[currentIndex];
    const isCurrentTrack = index === currentActualIndex;

    this.queueStore.removeFromQueue(index);

    if (isCurrentTrack) {
      this.youtubePlayer.pause();
    }
  }

  switchRepeat() {
    this.playerStore.toggleRepeat();
  }

  switchRandom() {
    this.queueStore.toggleShuffle();
  }

  /** Removes a video from the current playback queue by its id_video */
  removeVideoFromQueue(idVideo: string): void {
    const items = this.queueStore.items();
    for (let i = 0; i < items.length; i++) {
      if (items[i].id_video === idVideo) {
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
    if (this.queueStore.items().length === 0) {
      this.queueStore.setSource(playlist[0]?.id_playlist ?? null, idTopCharts);
    } else {
      this.queueStore.setSource(null, null);
    }
    this.queueStore.addToQueue(playlist);
  }

  addVideoAfterCurrentInList(video: Video) {
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

    const sourcePlaylistId = playlistId ?? playlist[0]?.id_playlist ?? null;
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
