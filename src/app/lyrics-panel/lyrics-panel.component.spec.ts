import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { LyricsPanelComponent } from './lyrics-panel.component';
import { LyricsService } from '../services/lyrics.service';
import { LyricsResponse } from '../models/lyrics.model';
import { QueueStore, PlayerStore, UiStore } from '../store';
import { Video } from '../models/video.model';

describe('LyricsPanelComponent', () => {
  let component: LyricsPanelComponent;
  let fixture: ComponentFixture<LyricsPanelComponent>;
  let lyricsServiceMock: { getLyrics: ReturnType<typeof vi.fn> };
  let queueStore: InstanceType<typeof QueueStore>;
  let playerStore: InstanceType<typeof PlayerStore>;
  let uiStore: InstanceType<typeof UiStore>;

  const syncedResponse: LyricsResponse = {
    success: true,
    synced: true,
    lines: [
      { time: 0, text: 'Intro' },
      { time: 12.5, text: 'First line' },
      { time: 15.3, text: 'Second line' },
      { time: 20.0, text: 'Third line' },
    ],
    plainLyrics: 'Intro\nFirst line\nSecond line\nThird line',
    trackName: 'Test Track',
    artistName: 'Test Artist',
  };

  const plainResponse: LyricsResponse = {
    success: true,
    synced: false,
    lines: null,
    plainLyrics: 'Some plain lyrics\nLine two\nLine three',
    trackName: 'Plain Track',
    artistName: 'Plain Artist',
  };

  const mockVideo: Video = {
    id_video: '123',
    artiste: 'Test Artist',
    artists: [],
    duree: '240',
    id_playlist: '1',
    key: 'abc123',
    ordre: '1',
    titre: 'Test Song',
    titre_album: 'Test Album',
  };

  beforeEach(async () => {
    lyricsServiceMock = { getLyrics: vi.fn().mockReturnValue(of(syncedResponse)) };

    await TestBed.configureTestingModule({
      imports: [LyricsPanelComponent],
      providers: [
        getTranslocoTestingProviders(),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: LyricsService, useValue: lyricsServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    queueStore = TestBed.inject(QueueStore);
    playerStore = TestBed.inject(PlayerStore);
    uiStore = TestBed.inject(UiStore);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LyricsPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load lyrics when a video is in the queue', () => {
    queueStore.setQueue([mockVideo], '1');
    fixture.detectChanges();

    expect(lyricsServiceMock.getLyrics).toHaveBeenCalledWith('123');
    expect(component.isLoading()).toBe(false);
    expect(component.isSynced()).toBe(true);
    expect(component.lines()).toHaveLength(4);
    expect(component.trackName()).toBe('Test Track');
    expect(component.artistName()).toBe('Test Artist');
  });

  it('should handle plain-only lyrics', () => {
    lyricsServiceMock.getLyrics.mockReturnValue(of(plainResponse));
    queueStore.setQueue([mockVideo], '1');
    fixture.detectChanges();

    expect(component.isSynced()).toBe(false);
    expect(component.lines()).toBeNull();
    expect(component.plainLyrics()).toBeTruthy();
  });

  it('should compute activeLineIndex based on currentTime', () => {
    queueStore.setQueue([mockVideo], '1');
    fixture.detectChanges();

    expect(component.activeLineIndex()).toBe(-1); // currentTime = 0, timer not started

    playerStore.updateProgress(13);
    expect(component.activeLineIndex()).toBe(1); // time 12.5

    playerStore.updateProgress(16);
    expect(component.activeLineIndex()).toBe(2); // time 15.3

    playerStore.updateProgress(25);
    expect(component.activeLineIndex()).toBe(3); // time 20.0
  });

  it('should return -1 for activeLineIndex when no lines', () => {
    lyricsServiceMock.getLyrics.mockReturnValue(of(plainResponse));
    queueStore.setQueue([mockVideo], '1');
    fixture.detectChanges();

    expect(component.activeLineIndex()).toBe(-1);
  });

  it('should set error on lyrics_not_found', () => {
    const errorResponse = new HttpErrorResponse({
      error: { error: 'lyrics_not_found' },
      status: 404,
      statusText: 'Not Found',
    });
    lyricsServiceMock.getLyrics.mockReturnValue(throwError(() => errorResponse));
    queueStore.setQueue([mockVideo], '1');
    fixture.detectChanges();

    expect(component.error()).toBe('lyrics_none');
    expect(component.isLoading()).toBe(false);
  });

  it('should set error on lrclib_unavailable', () => {
    const errorResponse = new HttpErrorResponse({
      error: { error: 'lrclib_unavailable' },
      status: 502,
      statusText: 'Bad Gateway',
    });
    lyricsServiceMock.getLyrics.mockReturnValue(throwError(() => errorResponse));
    queueStore.setQueue([mockVideo], '1');
    fixture.detectChanges();

    expect(component.error()).toBe('lyrics_service_unavailable');
  });

  it('should set error on forbidden', () => {
    const errorResponse = new HttpErrorResponse({
      error: { error: 'forbidden' },
      status: 403,
      statusText: 'Forbidden',
    });
    lyricsServiceMock.getLyrics.mockReturnValue(throwError(() => errorResponse));
    queueStore.setQueue([mockVideo], '1');
    fixture.detectChanges();

    expect(component.error()).toBe('lyrics_forbidden');
  });

  it('should set generic error on unknown error', () => {
    const errorResponse = new HttpErrorResponse({
      error: { error: 'unknown_error' },
      status: 500,
      statusText: 'Internal Server Error',
    });
    lyricsServiceMock.getLyrics.mockReturnValue(throwError(() => errorResponse));
    queueStore.setQueue([mockVideo], '1');
    fixture.detectChanges();

    expect(component.error()).toBe('lyrics_error');
  });

  it('should request animated close of the lyrics panel via UiStore', () => {
    const requestCloseSpy = vi.spyOn(uiStore, 'requestCloseLyricsPanel');
    uiStore.openLyricsPanel();
    fixture.detectChanges();
    component.close();
    expect(requestCloseSpy).toHaveBeenCalled();
  });

  it('should reset state when no video is present', () => {
    const errorResponse = new HttpErrorResponse({
      error: { error: 'lyrics_not_found' },
      status: 404,
      statusText: 'Not Found',
    });
    lyricsServiceMock.getLyrics.mockReturnValue(throwError(() => errorResponse));
    queueStore.setQueue([mockVideo], '1');
    fixture.detectChanges();
    expect(component.error()).toBe('lyrics_none');

    queueStore.clear();
    fixture.detectChanges();

    expect(component.lines()).toBeNull();
    expect(component.plainLyrics()).toBeNull();
    expect(component.error()).toBeNull();
    expect(component.isLoading()).toBe(false);
  });

  describe('onHostAnimationEnd', () => {
    it('should call closeLyricsPanel when closing and event is from the host', () => {
      const closeSpy = vi.spyOn(uiStore, 'closeLyricsPanel');
      uiStore.openLyricsPanel();
      uiStore.requestCloseLyricsPanel();
      fixture.detectChanges();

      const mockEvent = {
        target: fixture.nativeElement,
        currentTarget: fixture.nativeElement,
      } as unknown as AnimationEvent;
      component.onHostAnimationEnd(mockEvent);

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should not call closeLyricsPanel when event originates from a child element', () => {
      const closeSpy = vi.spyOn(uiStore, 'closeLyricsPanel');
      uiStore.openLyricsPanel();
      uiStore.requestCloseLyricsPanel();
      fixture.detectChanges();

      const child = document.createElement('span');
      const mockEvent = {
        target: child,
        currentTarget: fixture.nativeElement,
      } as unknown as AnimationEvent;
      component.onHostAnimationEnd(mockEvent);

      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('should not call closeLyricsPanel when panel is not in closing state', () => {
      const closeSpy = vi.spyOn(uiStore, 'closeLyricsPanel');
      uiStore.openLyricsPanel();
      fixture.detectChanges();

      const mockEvent = {
        target: fixture.nativeElement,
        currentTarget: fixture.nativeElement,
      } as unknown as AnimationEvent;
      component.onHostAnimationEnd(mockEvent);

      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  it('should cancel previous request on track change (switchMap)', () => {
    const subject1 = new Subject<LyricsResponse>();
    const subject2 = new Subject<LyricsResponse>();
    let callCount = 0;
    lyricsServiceMock.getLyrics.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? subject1.asObservable() : subject2.asObservable();
    });

    const mockVideo2: Video = { ...mockVideo, id_video: '456', key: 'def456' };

    // First track
    queueStore.setQueue([mockVideo], '1');
    fixture.detectChanges();
    expect(component.isLoading()).toBe(true);

    // Switch track before first response arrives
    queueStore.setQueue([mockVideo2], '1');
    fixture.detectChanges();

    // First response arrives late — should be ignored
    subject1.next(syncedResponse);
    subject1.complete();
    expect(component.trackName()).toBeNull(); // switchMap cancelled it

    // Second response arrives
    subject2.next({ ...plainResponse, trackName: 'Second Track' });
    subject2.complete();
    expect(component.trackName()).toBe('Second Track');
  });

  describe('scrollLineIndex', () => {
    it('should return -1 when no lines are loaded', () => {
      lyricsServiceMock.getLyrics.mockReturnValue(of(plainResponse));
      queueStore.setQueue([mockVideo], '1');
      fixture.detectChanges();

      expect(component.lines()).toBeNull();
      expect(component.scrollLineIndex()).toBe(-1);
    });

    it('should return 0 when currentTime equals the stale threshold (previous track value)', () => {
      // Set currentTime to a non-zero value before the track change
      playerStore.updateProgress(10);

      // Simulate a track change: resetState() captures currentTime=10 as the stale threshold
      queueStore.setQueue([mockVideo], '1');
      fixture.detectChanges();

      // currentTime is still 10 (YouTube hasn't reset yet) — stale detection triggers
      playerStore.updateProgress(10);
      expect(component.scrollLineIndex()).toBe(0);
    });

    it('should return 0 when currentTime is 0 (playback not yet started)', () => {
      queueStore.setQueue([mockVideo], '1');
      fixture.detectChanges();

      // currentTime === 0 → activeLineIndex returns -1, scrollLineIndex falls back to 0
      expect(playerStore.currentTime()).toBe(0);
      expect(component.scrollLineIndex()).toBe(0);
    });

    it('should return the activeLineIndex when playback is progressing normally', () => {
      queueStore.setQueue([mockVideo], '1');
      fixture.detectChanges();

      playerStore.updateProgress(16);
      // activeLineIndex at time 16 → index 2 (time 15.3)
      expect(component.activeLineIndex()).toBe(2);
      expect(component.scrollLineIndex()).toBe(2);
    });

    it('should clear the stale guard once playback diverges so a later seek to the same time works normally', () => {
      // Set currentTime to 10 before the track change
      playerStore.updateProgress(10);

      // Track change: resetState() captures currentTime=10 as the stale threshold
      queueStore.setQueue([mockVideo], '1');
      fixture.detectChanges();

      // currentTime is still 10 — stale guard is active, no line highlighted
      expect(component.activeLineIndex()).toBe(-1);

      // Playback advances past the threshold — the clearing effect fires
      playerStore.updateProgress(16);
      fixture.detectChanges(); // flush the effect that resets staleTimeThreshold to 0

      // Seek back to the same numeric time that was the old stale threshold
      playerStore.updateProgress(10);

      // Guard has been cleared (threshold === 0), so the Intro line (time 0 ≤ 10) is active
      expect(component.activeLineIndex()).toBe(0);
      expect(component.scrollLineIndex()).toBe(0);
    });
  });
});
