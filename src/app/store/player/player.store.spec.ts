import { TestBed } from '@angular/core/testing';
import { PlayerStore } from './player.store';

describe('PlayerStore', () => {
  let store: InstanceType<typeof PlayerStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(PlayerStore);
    store.fullReset();
  });

  describe('Initial State', () => {
    it('should have idle status initially', () => {
      expect(store.status()).toBe('idle');
    });

    it('should not be playing initially', () => {
      expect(store.isPlaying()).toBe(false);
    });

    it('should have volume at 100', () => {
      expect(store.volume()).toBe(100);
    });

    it('should not have repeat enabled', () => {
      expect(store.isRepeat()).toBe(false);
    });

    it('should not be muted', () => {
      expect(store.isMuted()).toBe(false);
    });

    it('should have no error', () => {
      expect(store.errorMessage()).toBeNull();
    });
  });

  describe('Computed Properties', () => {
    it('should compute isPlaying correctly', () => {
      expect(store.isPlaying()).toBe(false);
      store.play();
      expect(store.isPlaying()).toBe(true);
    });

    it('should compute isPaused correctly', () => {
      expect(store.isPaused()).toBe(false);
      store.pause();
      expect(store.isPaused()).toBe(true);
    });

    it('should compute isLoading correctly', () => {
      expect(store.isLoading()).toBe(false);
      store.setLoading();
      expect(store.isLoading()).toBe(true);
    });

    it('should compute hasError correctly', () => {
      expect(store.hasError()).toBe(false);
      store.setError('test error');
      expect(store.hasError()).toBe(true);
    });

    it('should compute progress correctly', () => {
      store.updateProgress(30, 120);
      expect(store.progress()).toBe(25);
    });

    it('should handle zero duration for progress', () => {
      store.updateProgress(30, 0);
      expect(store.progress()).toBe(0);
    });

    it('should compute currentTimeFormatted correctly', () => {
      store.updateProgress(95);
      expect(store.currentTimeFormatted()).toBe('1:35');
    });

    it('should compute durationFormatted correctly', () => {
      store.setDuration(245);
      expect(store.durationFormatted()).toBe('4:05');
    });

    it('should compute remainingTime correctly', () => {
      store.updateProgress(30, 120);
      expect(store.remainingTime()).toBe(90);
    });

    it('should compute loadedProgress correctly', () => {
      store.updateProgress(0, 100, 0.75);
      expect(store.loadedProgress()).toBe(75);
    });

    it('should compute isSilent correctly', () => {
      expect(store.isSilent()).toBe(false);
      store.setVolume(0);
      expect(store.isSilent()).toBe(true);
      store.setVolume(50);
      store.setMuted(true);
      expect(store.isSilent()).toBe(true);
    });
  });

  describe('Play/Pause Controls', () => {
    it('should set playing status', () => {
      store.play();
      expect(store.status()).toBe('playing');
      expect(store.isPlaying()).toBe(true);
    });

    it('should set paused status', () => {
      store.play();
      store.pause();
      expect(store.status()).toBe('paused');
      expect(store.isPaused()).toBe(true);
    });

    it('should toggle play/pause', () => {
      const result1 = store.togglePlay();
      expect(result1).toBe(true);
      expect(store.isPlaying()).toBe(true);

      const result2 = store.togglePlay();
      expect(result2).toBe(false);
      expect(store.isPaused()).toBe(true);
    });

    it('should set loading status', () => {
      store.setLoading();
      expect(store.status()).toBe('loading');
    });

    it('should set ended status', () => {
      store.setEnded();
      expect(store.status()).toBe('ended');
    });

    it('should set idle status', () => {
      store.play();
      store.setIdle();
      expect(store.status()).toBe('idle');
    });
  });

  describe('Progress Controls', () => {
    it('should update progress with time only', () => {
      store.updateProgress(45);
      expect(store.currentTime()).toBe(45);
    });

    it('should update progress with time and duration', () => {
      store.updateProgress(45, 180);
      expect(store.currentTime()).toBe(45);
      expect(store.duration()).toBe(180);
    });

    it('should update progress with loaded fraction', () => {
      store.updateProgress(45, 180, 0.8);
      expect(store.loadedFraction()).toBe(0.8);
    });

    it('should set duration', () => {
      store.setDuration(300);
      expect(store.duration()).toBe(300);
    });

    it('should seek to specific time', () => {
      store.setDuration(200);
      store.seekTo(100);
      expect(store.currentTime()).toBe(100);
    });

    it('should clamp seek time to valid range', () => {
      store.setDuration(200);
      store.seekTo(-10);
      expect(store.currentTime()).toBe(0);
      store.seekTo(300);
      expect(store.currentTime()).toBe(200);
    });

    it('should seek to percentage', () => {
      store.setDuration(200);
      store.seekToPercent(50);
      expect(store.currentTime()).toBe(100);
    });
  });

  describe('Volume Controls', () => {
    it('should set volume and update previousVolume', () => {
      store.setVolume(75);
      expect(store.volume()).toBe(75);
      expect(store.previousVolume()).toBe(75);
    });

    it('should clamp volume to valid range', () => {
      store.setVolume(-10);
      expect(store.volume()).toBe(0);
      store.setVolume(150);
      expect(store.volume()).toBe(100);
    });

    it('should auto-mute when volume is 0 and not overwrite previousVolume', () => {
      store.setVolume(50); // Set initial previousVolume
      store.setVolume(0);
      expect(store.isMuted()).toBe(true);
      expect(store.volume()).toBe(0);
      expect(store.previousVolume()).toBe(50); // Should retain the last non-zero volume
    });

    it('should toggle mute and restore previous volume', () => {
      store.setVolume(30);

      // Mute
      const result1 = store.toggleMute();
      expect(result1).toBe(true);
      expect(store.isMuted()).toBe(true);
      expect(store.volume()).toBe(0);
      expect(store.previousVolume()).toBe(30);

      // Unmute
      const result2 = store.toggleMute();
      expect(result2).toBe(false);
      expect(store.isMuted()).toBe(false);
      expect(store.volume()).toBe(30);
      expect(store.previousVolume()).toBe(30);
    });

    it('should set muted state', () => {
      store.setMuted(true);
      expect(store.isMuted()).toBe(true);
    });
  });

  describe('Repeat Controls', () => {
    it('should toggle repeat', () => {
      const result1 = store.toggleRepeat();
      expect(result1).toBe(true);
      expect(store.isRepeat()).toBe(true);

      const result2 = store.toggleRepeat();
      expect(result2).toBe(false);
      expect(store.isRepeat()).toBe(false);
    });

    it('should set repeat state', () => {
      store.setRepeat(true);
      expect(store.isRepeat()).toBe(true);
    });
  });

  describe('Player Ready', () => {
    it('should set player ready state', () => {
      expect(store.isPlayerReady()).toBe(false);
      store.setPlayerReady(true);
      expect(store.isPlayerReady()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should set error with message', () => {
      store.setError('Video not found');
      expect(store.status()).toBe('error');
      expect(store.errorMessage()).toBe('Video not found');
    });

    it('should clear error', () => {
      store.setError('Some error');
      store.clearError();
      expect(store.errorMessage()).toBeNull();
      expect(store.status()).toBe('idle');
    });

    it('should preserve status when clearing error from non-error state', () => {
      store.play();
      store.clearError();
      expect(store.status()).toBe('playing');
    });
  });

  describe('Reset', () => {
    it('should reset but keep volume and repeat', () => {
      store.setVolume(50);
      store.setRepeat(true);
      store.play();
      store.updateProgress(100, 200);

      store.reset();

      expect(store.status()).toBe('idle');
      expect(store.currentTime()).toBe(0);
      expect(store.volume()).toBe(50); // Preserved
      expect(store.isRepeat()).toBe(true); // Preserved
    });

    it('should fully reset including preferences', () => {
      store.setVolume(50);
      store.setRepeat(true);

      store.fullReset();

      expect(store.volume()).toBe(100); // Reset to default
      expect(store.isRepeat()).toBe(false); // Reset to default
    });
  });
});
