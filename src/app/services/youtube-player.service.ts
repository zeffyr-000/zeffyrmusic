import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Subject } from 'rxjs';
import { PlayerStore } from '../store/player/player.store';
import { LoggingService } from './logging.service';

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
  private readonly loggingService = inject(LoggingService);

  private player: YT.Player | null = null;
  private readonly isBrowser: boolean;
  private apiReady = false;
  private pendingVideoKey: string | null = null;

  readonly playerReady$ = new BehaviorSubject<boolean>(false);
  readonly stateChange$ = new Subject<YT.PlayerState>();
  readonly error$ = new BehaviorSubject<string | null>(null);

  private progressInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      if ('requestIdleCallback' in globalThis) {
        globalThis.requestIdleCallback(() => this.loadApi());
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
        this.playerStore.setIdle();
        this.stopProgressTracking();
        break;
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

    this.reportYoutubeError(event.data, message);

    this.error$.next(message);
    this.playerStore.setError(message);
  }

  /**
   * Report YouTube player errors to Sentry with severity matching actionability:
   * - codes 101/150 (embedding disabled by the uploader): skipped — expected user-driven case
   * - code 5 (HTML5 player failure): warning — real client-side breakage worth investigating
   * - codes 2 / 100 (invalid id, video unavailable): info — useful stats, not actionable
   * - unknown codes: warning, with the raw code in the message so new YouTube failure modes
   *   surface as new issues instead of being absorbed into the generic "error_unknown" group
   * All events share a stable fingerprint per error code so issues group cleanly.
   */
  private reportYoutubeError(code: number, message: string): void {
    if (code === 101 || code === 150) {
      return;
    }

    const videoId = this.player?.getVideoData?.()?.video_id ?? this.pendingVideoKey;
    const context = {
      'youtube.error_code': code,
      'youtube.video_id': videoId,
    };
    const fingerprint = ['youtube-error', String(code)];
    const knownCode = code === 2 || code === 5 || code === 100;
    const fullMessage = knownCode
      ? `YouTube Player Error: ${message}`
      : `YouTube Player Error: code ${code}`;

    if (code === 5 || !knownCode) {
      this.loggingService.captureWarning(fullMessage, context, fingerprint);
    } else {
      this.loggingService.captureInfo(fullMessage, context, fingerprint);
    }
  }

  /** Check that the player object exists AND has its API methods loaded. */
  private isPlayerFunctional(): boolean {
    return this.player !== null && typeof this.player.getDuration === 'function';
  }

  private initVolume(): void {
    if (!this.isPlayerFunctional()) return;

    let volume = Number.parseInt(this.readStorage('volume') ?? '', 10);
    if (Number.isNaN(volume) || volume < 0 || volume > 100) {
      volume = this.player!.getVolume?.() ?? 100;
      this.writeStorage('volume', volume.toString());
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
    this.player?.playVideo?.();
  }

  pause(): void {
    this.player?.pauseVideo?.();
  }

  togglePlayPause(): boolean {
    if (!this.isPlayerFunctional()) return false;

    const state = this.player!.getPlayerState();
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
    if (!this.isPlayerFunctional()) return;

    const clampedVolume = Math.max(0, Math.min(100, volume));
    this.player!.setVolume(clampedVolume);
    this.writeStorage('volume', clampedVolume.toString());
    this.playerStore.setVolume(clampedVolume);
  }

  mute(): void {
    this.player?.mute?.();
  }

  unMute(): void {
    this.player?.unMute?.();
  }

  seekTo(seconds: number): void {
    this.player?.seekTo?.(seconds, true);
  }

  seekToPercent(percent: number): void {
    if (!this.isPlayerFunctional()) return;
    const duration = this.player!.getDuration() ?? 0;
    this.seekTo((percent / 100) * duration);
  }

  getPlayerState(): YT.PlayerState | null {
    return this.player?.getPlayerState?.() ?? null;
  }

  getCurrentTime(): number {
    return this.player?.getCurrentTime?.() ?? 0;
  }

  getDuration(): number {
    return this.player?.getDuration?.() ?? 0;
  }

  getLoadedFraction(): number {
    return this.player?.getVideoLoadedFraction?.() ?? 0;
  }

  clearError(): void {
    this.error$.next(null);
    this.playerStore.clearError();
  }

  private startProgressTracking(): void {
    if (this.progressInterval !== null) return;

    this.progressInterval = globalThis.setInterval(() => {
      if (!this.isPlayerFunctional()) return;

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
    this.player?.destroy?.();
    this.player = null;
  }

  private readStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage blocked on some WebViews
    }
  }
}
