import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { YoutubePlayerService } from './youtube-player.service';

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
