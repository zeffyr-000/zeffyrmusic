import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Subject, switchMap, catchError, EMPTY, timeout, TimeoutError } from 'rxjs';
import { LyricsService } from '../services/lyrics.service';
import { LyricsLine } from '../models/lyrics.model';
import { PlayerStore, QueueStore, UiStore } from '../store';

/**
 * Integrated karaoke lyrics panel displayed within the #content area.
 *
 * Fetches lyrics for the current video, highlights the active line
 * based on PlayerStore.currentTime(), and auto-scrolls to keep it centered.
 */
@Component({
  selector: 'app-lyrics-panel',
  templateUrl: './lyrics-panel.component.html',
  styleUrl: './lyrics-panel.component.scss',
  imports: [TranslocoPipe],
  host: {
    role: 'complementary',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.closing]': 'isClosing()',
    '(animationend)': 'onHostAnimationEnd($event)',
  },
})
export class LyricsPanelComponent {
  // -- Dependencies ----------------------------------------------------------
  private readonly lyricsService = inject(LyricsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly translocoService = inject(TranslocoService);
  private readonly uiStore = inject(UiStore);
  private readonly playerStore = inject(PlayerStore);
  private readonly queueStore = inject(QueueStore);

  // -- Local state -----------------------------------------------------------
  readonly isLoading = signal(false);
  readonly lines = signal<LyricsLine[] | null>(null);
  readonly plainLyrics = signal<string | null>(null);
  readonly isSynced = signal(false);
  readonly error = signal<string | null>(null);
  /** Whether the current error is recoverable (network/timeout) and a retry is offered. */
  readonly canRetry = signal(false);
  /** Loading escalation stage: 0 = normal reassurance, 1 = "taking longer than usual". */
  private readonly loadingStage = signal<0 | 1>(0);
  readonly trackName = signal<string | null>(null);
  readonly artistName = signal<string | null>(null);
  /** currentTime captured at reset — used to detect stale time from previous track. */
  private readonly staleTimeThreshold = signal(0);

  /** Skeleton items for the loading state. */
  readonly skeletonItems = Array.from({ length: 8 });

  /** Safety timeout for the lyrics request (ms). Calls routinely take 10s+, so
   * this only guards against a truly stuck backend, never a normal slow call. */
  private static readonly REQUEST_TIMEOUT_MS = 30_000;
  /** Delay before escalating the loading message to "taking longer than usual" (ms). */
  private static readonly LONG_WAIT_MS = 8_000;
  /** Handle for the loading-message escalation timer. */
  private longWaitTimer: ReturnType<typeof setTimeout> | null = null;

  // -- Computed --------------------------------------------------------------

  /** Translated aria-label for the host element. */
  readonly ariaLabel = computed(() => this.translocoService.translate('lyrics_title'));

  /** Reassurance message shown under the skeleton, escalating on long waits. */
  readonly loadingMessage = computed(() =>
    this.loadingStage() === 1 ? 'lyrics_loading_long' : 'lyrics_loading'
  );

  /** Whether the panel is playing its exit animation. */
  readonly isClosing = computed(() => this.uiStore.isLyricsPanelClosing());

  /** Index of the highlighted lyrics line (visual only).
   * Returns -1 when playback hasn't started, or when currentTime matches
   * the stale threshold captured at track change (avoids a flash of the
   * wrong active line during the brief reset window).
   * The threshold is cleared by a separate effect once playback diverges.
   */
  readonly activeLineIndex = computed(() => {
    const currentLines = this.lines();
    if (!currentLines || currentLines.length === 0) return -1;

    const currentTime = this.playerStore.currentTime();
    const threshold = this.staleTimeThreshold();
    // Not started yet
    if (currentTime === 0) return -1;
    // currentTime still matches the value frozen at track reset — stale
    if (threshold !== 0 && currentTime === threshold) return -1;

    let activeIdx = -1;
    for (let i = 0; i < currentLines.length; i++) {
      if (currentLines[i].time <= currentTime) {
        activeIdx = i;
      } else {
        break;
      }
    }
    return activeIdx;
  });

  /** Index used for auto-scroll.
   * Depends only on activeLineIndex — does not read currentTime directly.
   * The auto-scroll effect therefore fires only on actual line transitions,
   * not on every 200ms progress tick. Stale-time detection is handled
   * upstream in activeLineIndex.
   */
  readonly scrollLineIndex = computed(() => {
    if (!this.lines()?.length) return -1;
    return Math.max(this.activeLineIndex(), 0);
  });

  // -- ViewChild refs --------------------------------------------------------
  readonly lineElements = viewChildren<ElementRef<HTMLElement>>('lineRef');
  private readonly closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtnRef');
  private readonly contentEl = viewChild<ElementRef<HTMLElement>>('contentRef');

  /** Emits video IDs; switchMap cancels any pending HTTP request. */
  private readonly loadTrigger$ = new Subject<string>();

  constructor() {
    // Set up switchMap pipeline — cancels previous request on new track
    this.loadTrigger$
      .pipe(
        switchMap(idVideo => {
          this.resetState();
          this.isLoading.set(true);
          this.startLongWaitTimer();
          return this.lyricsService.getLyrics(idVideo).pipe(
            timeout({ each: LyricsPanelComponent.REQUEST_TIMEOUT_MS }),
            catchError((err: unknown) => {
              this.stopLongWaitTimer();
              this.isLoading.set(false);
              if (err instanceof TimeoutError) {
                this.error.set('lyrics_timeout');
              } else {
                this.error.set(
                  this.mapErrorToTranslationKey((err as HttpErrorResponse).error?.error)
                );
              }
              // Network/timeout failures are transient — offer a retry.
              this.canRetry.set(true);
              return EMPTY;
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(response => {
        this.stopLongWaitTimer();
        this.isLoading.set(false);
        if (!response.success) {
          this.error.set(this.mapErrorToTranslationKey(response.error));
          return;
        }
        this.isSynced.set(response.synced);
        this.lines.set(response.lines);
        this.plainLyrics.set(response.plainLyrics);
        this.trackName.set(response.trackName);
        this.artistName.set(response.artistName);
      });

    // Clear the stale-time guard as soon as playback moves away from the
    // captured threshold. Without this, a later seek to the exact same
    // numeric time in the new track would incorrectly suppress highlighting.
    effect(() => {
      const threshold = this.staleTimeThreshold();
      const currentTime = this.playerStore.currentTime();
      if (threshold !== 0 && currentTime !== threshold) {
        untracked(() => this.staleTimeThreshold.set(0));
      }
    });

    // Load lyrics when the current video changes
    effect(() => {
      const video = this.queueStore.currentVideo();
      untracked(() => {
        if (video?.id_video) {
          this.loadTrigger$.next(video.id_video);
        } else {
          this.resetState();
        }
      });
    });

    // Auto-scroll to the active line.
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const idx = this.scrollLineIndex();
      const elements = this.lineElements();
      if (idx >= 0 && elements[idx]) {
        const el = elements[idx].nativeElement;
        const prefersReducedMotion =
          typeof globalThis.matchMedia === 'function' &&
          globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const behavior: ScrollBehavior = prefersReducedMotion ? 'instant' : 'smooth';
        if (typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior, block: 'center' });
        }
      }
    });

    // Reset scroll to top when a new load starts (skeleton phase).
    effect(() => {
      if (this.isLoading()) {
        const content = this.contentEl();
        untracked(() => {
          if (content) content.nativeElement.scrollTop = 0;
        });
      }
    });

    // Focus close button when the view is ready
    effect(() => {
      const btn = this.closeBtn();
      if (btn) {
        untracked(() => btn.nativeElement.focus({ preventScroll: true }));
      }
    });

    // Immediately close without animation when reduced motion is preferred
    effect(() => {
      if (
        this.uiStore.isLyricsPanelClosing() &&
        isPlatformBrowser(this.platformId) &&
        typeof globalThis.matchMedia === 'function' &&
        globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        untracked(() => this.uiStore.closeLyricsPanel());
      }
    });

    // Close panel when window is resized below desktop breakpoint
    if (isPlatformBrowser(this.platformId) && typeof globalThis.matchMedia === 'function') {
      const mql = globalThis.matchMedia('(min-width: 768px)');
      const onChange = (e: MediaQueryListEvent): void => {
        if (!e.matches) {
          this.uiStore.closeLyricsPanel();
        }
      };
      mql.addEventListener('change', onChange);
      this.destroyRef.onDestroy(() => mql.removeEventListener('change', onChange));
    }

    this.destroyRef.onDestroy(() => this.stopLongWaitTimer());
  }

  // -- Methods ---------------------------------------------------------------

  /** Request animated close of the lyrics panel. */
  close(): void {
    this.uiStore.requestCloseLyricsPanel();
  }

  /** Re-run the lyrics request for the current track after a recoverable error. */
  retry(): void {
    const idVideo = this.queueStore.currentVideo()?.id_video;
    if (idVideo) {
      this.loadTrigger$.next(idVideo);
    }
  }

  /** Start the timer that escalates the loading message on long waits. */
  private startLongWaitTimer(): void {
    this.stopLongWaitTimer();
    if (!isPlatformBrowser(this.platformId)) return;
    this.longWaitTimer = setTimeout(
      () => this.loadingStage.set(1),
      LyricsPanelComponent.LONG_WAIT_MS
    );
  }

  /** Clear the loading-message escalation timer. */
  private stopLongWaitTimer(): void {
    if (this.longWaitTimer !== null) {
      clearTimeout(this.longWaitTimer);
      this.longWaitTimer = null;
    }
  }

  /** Finalize close after exit animation completes. */
  onHostAnimationEnd(event: AnimationEvent): void {
    if (event.target !== event.currentTarget) return;
    if (this.uiStore.isLyricsPanelClosing()) {
      this.uiStore.closeLyricsPanel();
    }
  }

  private resetState(): void {
    this.stopLongWaitTimer();
    this.staleTimeThreshold.set(this.playerStore.currentTime());
    this.lines.set(null);
    this.plainLyrics.set(null);
    this.isSynced.set(false);
    this.trackName.set(null);
    this.artistName.set(null);
    this.error.set(null);
    this.canRetry.set(false);
    this.loadingStage.set(0);
    this.isLoading.set(false);
  }

  private mapErrorToTranslationKey(code: string | undefined): string {
    switch (code) {
      case 'lyrics_not_found':
      case 'no_metadata':
      case 'not_found':
        return 'lyrics_none';
      case 'forbidden':
        return 'lyrics_forbidden';
      case 'lrclib_unavailable':
        return 'lyrics_service_unavailable';
      default:
        return 'lyrics_error';
    }
  }
}
