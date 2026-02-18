import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { YoutubePlayerService } from './youtube-player.service';
import { PlayerStore } from '../store/player/player.store';

describe('YoutubePlayerService', () => {
  describe('Browser context', () => {
    let service: YoutubePlayerService;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        providers: [YoutubePlayerService, { provide: PLATFORM_ID, useValue: 'browser' }],
      }).compileComponents();

      service = TestBed.inject(YoutubePlayerService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with playerReady$ as false', () => {
      expect(service.playerReady$.value).toBe(false);
    });

    it('should start with no error', () => {
      expect(service.error$.value).toBeNull();
    });

    it('should queue video key when player is not ready', () => {
      service.cueVideo('test-key');
      expect(service.playerReady$.value).toBe(false);
    });

    it('should get current time as 0 when player is not initialized', () => {
      expect(service.getCurrentTime()).toBe(0);
    });

    it('should get duration as 0 when player is not initialized', () => {
      expect(service.getDuration()).toBe(0);
    });

    it('should get loaded fraction as 0 when player is not initialized', () => {
      expect(service.getLoadedFraction()).toBe(0);
    });

    it('should return null for player state when not initialized', () => {
      expect(service.getPlayerState()).toBeNull();
    });

    it('should clear error', () => {
      service.error$.next('some_error');
      service.clearError();
      expect(service.error$.value).toBeNull();
    });

    it('should stop progress tracking on error', () => {
      // Start a progress interval manually
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = service as any;
      svc.progressInterval = window.setInterval(vi.fn(), 200);
      expect(svc.progressInterval).not.toBeNull();

      // Trigger onError
      svc.onError({ data: 100 } as unknown as YT.OnErrorEvent);

      expect(svc.progressInterval).toBeNull();
      expect(service.error$.value).toBe('error_request_not_found');
    });

    it('should stop progress tracking and set error on unknown error code', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = service as any;
      svc.progressInterval = window.setInterval(vi.fn(), 200);

      svc.onError({ data: 999 } as unknown as YT.OnErrorEvent);

      expect(svc.progressInterval).toBeNull();
      expect(service.error$.value).toBe('error_unknown');
    });

    it('should not call updateProgress after error stops tracking', () => {
      vi.useFakeTimers();
      const playerStore = TestBed.inject(PlayerStore);
      const spy = vi.spyOn(playerStore, 'updateProgress');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = service as any;

      // Simulate an active player with progress tracking
      svc.player = {
        getCurrentTime: () => 10,
        getDuration: () => 100,
        getVideoLoadedFraction: () => 0.5,
      };
      svc.startProgressTracking();

      // Verify tracking fires
      vi.advanceTimersByTime(200);
      expect(spy).toHaveBeenCalledTimes(1);

      // Trigger error — should stop tracking
      svc.onError({ data: 2 } as unknown as YT.OnErrorEvent);
      spy.mockClear();

      // No further updates after error
      vi.advanceTimersByTime(600);
      expect(spy).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('Server context', () => {
    let service: YoutubePlayerService;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        providers: [YoutubePlayerService, { provide: PLATFORM_ID, useValue: 'server' }],
      }).compileComponents();

      service = TestBed.inject(YoutubePlayerService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should not load API on server', () => {
      expect(service.playerReady$.value).toBe(false);
    });
  });
});
