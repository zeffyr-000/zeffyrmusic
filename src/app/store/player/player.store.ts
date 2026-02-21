import { computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { PlayerState, PlayerStatus, initialPlayerState } from './player.models';
import { formatTime } from '../../utils';
import { withSsrSafety } from '../features/with-ssr-safety';

/**
 * PlayerStore - Playback state management
 *
 * Manages playback status, progress, volume and repeat mode.
 */
export const PlayerStore = signalStore(
  { providedIn: 'root' },

  withState(initialPlayerState),
  withSsrSafety(),

  withComputed(state => ({
    isPlaying: computed(() => state.status() === 'playing'),
    isPaused: computed(() => state.status() === 'paused'),
    isLoading: computed(() => state.status() === 'loading'),
    hasError: computed(() => state.status() === 'error'),

    progress: computed(() => {
      const duration = state.duration();
      if (duration === 0) return 0;
      return (state.currentTime() / duration) * 100;
    }),

    currentTimeFormatted: computed(() => formatTime(state.currentTime())),
    durationFormatted: computed(() => formatTime(state.duration())),
    remainingTime: computed(() => Math.max(0, state.duration() - state.currentTime())),
    remainingTimeFormatted: computed(() => formatTime(state.duration() - state.currentTime())),
    loadedProgress: computed(() => state.loadedFraction() * 100),
    volumePercent: computed(() => state.volume()),
    isSilent: computed(() => state.isMuted() || state.volume() === 0),
  })),

  withMethods(store => ({
    setStatus(status: PlayerStatus): void {
      patchState(store, { status });
    },

    play(): void {
      patchState(store, { status: 'playing' });
    },

    pause(): void {
      patchState(store, { status: 'paused' });
    },

    togglePlay(): boolean {
      const isPlaying = store.status() === 'playing';
      patchState(store, { status: isPlaying ? 'paused' : 'playing' });
      return !isPlaying;
    },

    setLoading(): void {
      patchState(store, { status: 'loading' });
    },

    setEnded(): void {
      patchState(store, { status: 'ended' });
    },

    setIdle(): void {
      patchState(store, { status: 'idle' });
    },

    updateProgress(currentTime: number, duration?: number, loadedFraction?: number): void {
      const updates: Partial<PlayerState> = { currentTime };
      if (duration !== undefined) {
        updates.duration = duration;
      }
      if (loadedFraction !== undefined) {
        updates.loadedFraction = loadedFraction;
      }
      patchState(store, updates);
    },

    setDuration(duration: number): void {
      patchState(store, { duration });
    },

    seekTo(time: number): void {
      const duration = store.duration();
      const clampedTime = Math.max(0, Math.min(time, duration));
      patchState(store, { currentTime: clampedTime });
    },

    seekToPercent(percent: number): void {
      const duration = store.duration();
      const time = (percent / 100) * duration;
      this.seekTo(time);
    },

    setVolume(volume: number): void {
      const clampedVolume = Math.max(0, Math.min(100, volume));
      patchState(store, {
        volume: clampedVolume,
        previousVolume: clampedVolume > 0 ? clampedVolume : store.previousVolume(),
        isMuted: clampedVolume === 0,
      });
    },

    toggleMute(): boolean {
      const isMuted = !store.isMuted();
      if (isMuted) {
        patchState(store, { isMuted, volume: 0 });
      } else {
        patchState(store, { isMuted, volume: store.previousVolume() || 100 });
      }
      return isMuted;
    },

    setMuted(isMuted: boolean): void {
      patchState(store, { isMuted });
    },

    toggleRepeat(): boolean {
      const isRepeat = !store.isRepeat();
      patchState(store, { isRepeat });
      return isRepeat;
    },

    setRepeat(isRepeat: boolean): void {
      patchState(store, { isRepeat });
    },

    setPlayerReady(isReady: boolean): void {
      patchState(store, { isPlayerReady: isReady });
    },

    setError(errorMessage: string): void {
      patchState(store, {
        status: 'error',
        errorMessage,
      });
    },

    clearError(): void {
      patchState(store, {
        errorMessage: null,
        status: store.status() === 'error' ? 'idle' : store.status(),
      });
    },

    reset(): void {
      patchState(store, {
        ...initialPlayerState,
        volume: store.volume(),
        isRepeat: store.isRepeat(),
      });
    },

    fullReset(): void {
      patchState(store, initialPlayerState);
    },
  }))
);
