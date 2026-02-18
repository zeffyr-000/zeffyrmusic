import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Subject } from 'rxjs';
import { PlayerStore } from '../store/player/player.store';

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

/**
 * YoutubePlayerService - YouTube IFrame Player API wrapper
 *
 * Encapsulates YouTube API interactions (init, loading, controls).
 */
@Injectable({
  providedIn: 'root',
})
export class YoutubePlayerService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly playerStore = inject(PlayerStore);

  private player: YT.Player | null = null;
  private readonly isBrowser: boolean;
  private apiReady = false;
  private pendingVideoKey: string | null = null;

  readonly playerReady$ = new BehaviorSubject<boolean>(false);
  readonly stateChange$ = new Subject<YT.PlayerState>();
  readonly error$ = new BehaviorSubject<string | null>(null);

  private progressInterval: number | null = null;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => this.loadApi());
      } else {
        setTimeout(() => this.loadApi(), 0);
      }
    }
  }

  private loadApi(): void {
    if (!this.isBrowser || this.apiReady) return;

    const tag = document.createElement('script');
    tag.src = '//www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }

  initPlayer(elementId: string): void {
    if (!this.isBrowser) return;

    window.onYouTubeIframeAPIReady = () => {
      this.apiReady = true;
      this.createPlayer(elementId);
    };
  }

  private createPlayer(elementId: string): void {
    this.player = new window.YT.Player(elementId, {
      playerVars: {
        controls: 0,
        origin: window.location.href,
        rel: 0,
      },
      events: {
        onStateChange: this.onStateChange.bind(this),
        onReady: this.onReady.bind(this),
        onError: this.onError.bind(this),
      },
    });
  }

  private onReady(): void {
    this.playerReady$.next(true);
    this.playerStore.setPlayerReady(true);
    this.initVolume();

    if (this.pendingVideoKey) {
      this.cueVideo(this.pendingVideoKey);
      this.pendingVideoKey = null;
    }
  }

  private onStateChange(event: YT.OnStateChangeEvent): void {
    this.stateChange$.next(event.data);

    switch (event.data) {
      case YT.PlayerState.UNSTARTED:
      case YT.PlayerState.ENDED:
      case YT.PlayerState.PAUSED:
        this.playerStore.pause();
        this.stopProgressTracking();
        break;
      case YT.PlayerState.PLAYING:
        this.playerStore.play();
        this.startProgressTracking();
        break;
      case YT.PlayerState.BUFFERING:
        this.playerStore.setLoading();
        break;
    }

    if (event.data === YT.PlayerState.ENDED) {
      this.playerStore.setEnded();
    }
  }

  private onError(event: YT.OnErrorEvent): void {
    this.stopProgressTracking();

    const errorMessages: Record<number, string> = {
      2: 'error_invalid_parameter',
      5: 'error_html_player',
      100: 'error_request_not_found',
      101: 'error_request_access_denied',
      150: 'error_request_access_denied',
    };

    const message = errorMessages[event.data] ?? 'error_unknown';
    this.error$.next(message);
    this.playerStore.setError(message);
  }

  private initVolume(): void {
    if (!this.player) return;

    let volume = parseInt(localStorage.getItem('volume') ?? '', 10);
    if (isNaN(volume) || volume < 0 || volume > 100) {
      volume = this.player.getVolume?.() ?? 100;
      localStorage.setItem('volume', volume.toString());
    }

    this.setVolume(volume);
  }

  cueVideo(videoKey: string): void {
    if (!this.player || !this.playerReady$.value) {
      this.pendingVideoKey = videoKey;
      return;
    }
    this.player.cueVideoById(videoKey);
  }

  loadVideo(videoKey: string): void {
    if (!this.player || !this.playerReady$.value) {
      this.pendingVideoKey = videoKey;
      return;
    }
    this.clearError();
    this.player.loadVideoById(videoKey, 0);
  }

  play(): void {
    this.player?.playVideo();
  }

  pause(): void {
    this.player?.pauseVideo();
  }

  togglePlayPause(): boolean {
    if (!this.player) return false;

    const state = this.player.getPlayerState();
    if (
      state === YT.PlayerState.PAUSED ||
      state === YT.PlayerState.UNSTARTED ||
      state === YT.PlayerState.CUED
    ) {
      this.play();
      return true;
    } else {
      this.pause();
      return false;
    }
  }

  setVolume(volume: number): void {
    if (!this.player) return;

    const clampedVolume = Math.max(0, Math.min(100, volume));
    this.player.setVolume(clampedVolume);
    localStorage.setItem('volume', clampedVolume.toString());
    this.playerStore.setVolume(clampedVolume);
  }

  seekTo(seconds: number): void {
    this.player?.seekTo(seconds, true);
  }

  seekToPercent(percent: number): void {
    if (!this.player) return;
    const duration = this.player.getDuration() ?? 0;
    this.seekTo((percent / 100) * duration);
  }

  getPlayerState(): YT.PlayerState | null {
    return this.player?.getPlayerState() ?? null;
  }

  getCurrentTime(): number {
    return this.player?.getCurrentTime() ?? 0;
  }

  getDuration(): number {
    return this.player?.getDuration() ?? 0;
  }

  getLoadedFraction(): number {
    return this.player?.getVideoLoadedFraction() ?? 0;
  }

  clearError(): void {
    this.error$.next(null);
    this.playerStore.clearError();
  }

  private startProgressTracking(): void {
    if (this.progressInterval !== null) return;

    this.progressInterval = window.setInterval(() => {
      if (!this.player) return;

      const currentTime = this.getCurrentTime();
      const duration = this.getDuration();
      const loadedFraction = this.getLoadedFraction();

      this.playerStore.updateProgress(currentTime, duration, loadedFraction);
    }, 200);
  }

  private stopProgressTracking(): void {
    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  destroy(): void {
    this.stopProgressTracking();
    this.player?.destroy();
    this.player = null;
  }
}
