import {
  ChangeDetectionStrategy,
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
import { Subject, switchMap, catchError, EMPTY } from 'rxjs';
import { LyricsService } from '../services/lyrics.service';
import { LyricsLine, LyricsErrorCode } from '../models/lyrics.model';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  readonly trackName = signal<string | null>(null);
  readonly artistName = signal<string | null>(null);
  /** currentTime captured at reset — used to detect stale time from previous track. */
  private readonly staleTimeThreshold = signal(0);

  /** Skeleton items for the loading state. */
  readonly skeletonItems = Array.from({ length: 8 });

  // -- Computed --------------------------------------------------------------

  /** Translated aria-label for the host element. */
  readonly ariaLabel = computed(() => this.translocoService.translate('lyrics_title'));

  /** Whether the panel is playing its exit animation. */
  readonly isClosing = computed(() => this.uiStore.isLyricsPanelClosing());

  /** Index of the highlighted lyrics line (visual only).
   * Returns -1 when playback hasn't started so no line appears active.
   */
  readonly activeLineIndex = computed(() => {
    const currentLines = this.lines();
    if (!currentLines || currentLines.length === 0) return -1;

    const currentTime = this.playerStore.currentTime();
    if (currentTime === 0) return -1;

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
   * Falls back to 0 when lyrics are loaded but playback hasn't started.
   * Guards against cached lyrics arriving before YouTube resets currentTime:
   * if currentTime still equals the value captured at the last track reset,
   * it is treated as stale and scroll is forced to line 0.
   */
  readonly scrollLineIndex = computed(() => {
    if (!this.lines()?.length) return -1;
    const currentTime = this.playerStore.currentTime();
    // currentTime hasn't changed since the previous track reset → stale value
    if (currentTime > 0 && currentTime === this.staleTimeThreshold()) return 0;
    const idx = this.activeLineIndex();
    return idx >= 0 ? idx : 0;
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
          return this.lyricsService.getLyrics(idVideo).pipe(
            catchError((err: HttpErrorResponse) => {
              this.isLoading.set(false);
              this.error.set(this.mapErrorToTranslationKey(err));
              return EMPTY;
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(response => {
        this.isLoading.set(false);
        this.isSynced.set(response.synced);
        this.lines.set(response.lines);
        this.plainLyrics.set(response.plainLyrics);
        this.trackName.set(response.trackName);
        this.artistName.set(response.artistName);
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
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        untracked(() => this.uiStore.closeLyricsPanel());
      }
    });

    // Close panel when window is resized below desktop breakpoint
    if (isPlatformBrowser(this.platformId) && typeof window.matchMedia === 'function') {
      const mql = window.matchMedia('(min-width: 768px)');
      const onChange = (e: MediaQueryListEvent): void => {
        if (!e.matches) {
          this.uiStore.closeLyricsPanel();
        }
      };
      mql.addEventListener('change', onChange);
      this.destroyRef.onDestroy(() => mql.removeEventListener('change', onChange));
    }
  }

  // -- Methods ---------------------------------------------------------------

  /** Request animated close of the lyrics panel. */
  close(): void {
    this.uiStore.requestCloseLyricsPanel();
  }

  /** Finalize close after exit animation completes. */
  onHostAnimationEnd(event: AnimationEvent): void {
    if (event.target !== event.currentTarget) return;
    if (this.uiStore.isLyricsPanelClosing()) {
      this.uiStore.closeLyricsPanel();
    }
  }

  private resetState(): void {
    this.staleTimeThreshold.set(this.playerStore.currentTime());
    this.lines.set(null);
    this.plainLyrics.set(null);
    this.isSynced.set(false);
    this.trackName.set(null);
    this.artistName.set(null);
    this.error.set(null);
    this.isLoading.set(false);
  }

  private mapErrorToTranslationKey(err: HttpErrorResponse): string {
    const code = err.error?.error as LyricsErrorCode | undefined;

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
