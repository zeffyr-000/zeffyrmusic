/**
 * Player Store Models
 * État de lecture : play/pause, temps, volume, erreurs
 */

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export interface PlayerState {
  status: PlayerStatus;
  wasPlaying: boolean;
  currentTime: number;
  duration: number;
  loadedFraction: number;
  volume: number;
  previousVolume: number;
  isRepeat: boolean;
  isMuted: boolean;
  isPlayerReady: boolean;
  errorMessage: string | null;
}

export const initialPlayerState: PlayerState = {
  status: 'idle',
  wasPlaying: false,
  currentTime: 0,
  duration: 0,
  loadedFraction: 0,
  volume: 100,
  previousVolume: 100,
  isRepeat: false,
  isMuted: false,
  isPlayerReady: false,
  errorMessage: null,
};
