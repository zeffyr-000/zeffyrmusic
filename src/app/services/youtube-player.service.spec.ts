import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { YoutubePlayerService } from './youtube-player.service';
import { PlayerStore } from '../store/player/player.store';
import { LoggingService } from './logging.service';

/** Typed accessor for private members used in tests. */
interface PrivateApi {
  player: Partial<YT.Player> | null;
  /** Typed as `unknown` to avoid DOM vs Node `setInterval` return-type conflict. */
  progressInterval: unknown;
  onError(event: YT.OnErrorEvent): void;
  startProgressTracking(): void;
}

describe('YoutubePlayerService', () => {
  describe('Browser context', () => {
    let service: YoutubePlayerService;
    let loggingServiceMock: {
      captureWarning: ReturnType<typeof vi.fn>;
      captureInfo: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
      loggingServiceMock = { captureWarning: vi.fn(), captureInfo: vi.fn() };

      await TestBed.configureTestingModule({
        providers: [
          YoutubePlayerService,
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: LoggingService, useValue: loggingServiceMock },
        ],
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
      const svc = service as unknown as PrivateApi;
      svc.progressInterval = globalThis.setInterval(vi.fn(), 200);
      expect(svc.progressInterval).not.toBeNull();

      // Trigger onError
      svc.onError({ data: 100 } as unknown as YT.OnErrorEvent);

      expect(svc.progressInterval).toBeNull();
      expect(service.error$.value).toBe('error_request_not_found');
    });

    it('should stop progress tracking and set error on unknown error code', () => {
      const svc = service as unknown as PrivateApi;
      svc.progressInterval = globalThis.setInterval(vi.fn(), 200);

      svc.onError({ data: 999 } as unknown as YT.OnErrorEvent);

      expect(svc.progressInterval).toBeNull();
      expect(service.error$.value).toBe('error_unknown');
    });

    it('should not call updateProgress after error stops tracking', () => {
      vi.useFakeTimers();
      const playerStore = TestBed.inject(PlayerStore);
      const spy = vi.spyOn(playerStore, 'updateProgress');

      const svc = service as unknown as PrivateApi;

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

    it('should report code 2 (invalid parameter) as info — not actionable', () => {
      const svc = service as unknown as PrivateApi;
      svc.onError({ data: 2 } as unknown as YT.OnErrorEvent);

      expect(loggingServiceMock.captureInfo).toHaveBeenCalledWith(
        'YouTube Player Error: error_invalid_parameter',
        expect.objectContaining({ 'youtube.error_code': 2 }),
        ['youtube-error', '2']
      );
      expect(loggingServiceMock.captureWarning).not.toHaveBeenCalled();
      expect(service.error$.value).toBe('error_invalid_parameter');
    });

    it('should report code 5 (HTML5 player failure) as warning — real breakage', () => {
      const svc = service as unknown as PrivateApi;
      svc.onError({ data: 5 } as unknown as YT.OnErrorEvent);

      expect(loggingServiceMock.captureWarning).toHaveBeenCalledWith(
        'YouTube Player Error: error_html_player',
        expect.objectContaining({ 'youtube.error_code': 5 }),
        ['youtube-error', '5']
      );
      expect(loggingServiceMock.captureInfo).not.toHaveBeenCalled();
      expect(service.error$.value).toBe('error_html_player');
    });

    it('should report code 100 (video not found) as info — not actionable', () => {
      const svc = service as unknown as PrivateApi;
      svc.onError({ data: 100 } as unknown as YT.OnErrorEvent);

      expect(loggingServiceMock.captureInfo).toHaveBeenCalledWith(
        'YouTube Player Error: error_request_not_found',
        expect.objectContaining({ 'youtube.error_code': 100 }),
        ['youtube-error', '100']
      );
      expect(loggingServiceMock.captureWarning).not.toHaveBeenCalled();
      expect(service.error$.value).toBe('error_request_not_found');
    });

    it('should report unknown codes as warning with raw code in message', () => {
      const svc = service as unknown as PrivateApi;
      svc.onError({ data: 999 } as unknown as YT.OnErrorEvent);

      expect(loggingServiceMock.captureWarning).toHaveBeenCalledWith(
        'YouTube Player Error: code 999',
        expect.objectContaining({ 'youtube.error_code': 999 }),
        ['youtube-error', '999']
      );
      expect(service.error$.value).toBe('error_unknown');
    });

    it('should not report to Sentry for error code 101', () => {
      const svc = service as unknown as PrivateApi;
      svc.onError({ data: 101 } as unknown as YT.OnErrorEvent);

      expect(loggingServiceMock.captureWarning).not.toHaveBeenCalled();
      expect(loggingServiceMock.captureInfo).not.toHaveBeenCalled();
      expect(service.error$.value).toBe('error_request_access_denied');
    });

    it('should not report to Sentry for error code 150', () => {
      const svc = service as unknown as PrivateApi;
      svc.onError({ data: 150 } as unknown as YT.OnErrorEvent);

      expect(loggingServiceMock.captureWarning).not.toHaveBeenCalled();
      expect(loggingServiceMock.captureInfo).not.toHaveBeenCalled();
      expect(service.error$.value).toBe('error_request_access_denied');
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
