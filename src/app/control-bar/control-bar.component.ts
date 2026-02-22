import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  untracked,
  DOCUMENT,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { NgbTooltip, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoPipe } from '@jsverse/transloco';
import { PlayerService } from '../services/player.service';
import { UserLibraryService } from '../services/user-library.service';
import { AuthStore, PlayerStore, QueueStore } from '../store';
import { SwipeDownDirective } from '../directives/swipe-down.directive';

@Component({
  selector: 'app-control-bar',
  templateUrl: './control-bar.component.html',
  styleUrl: './control-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SwipeDownDirective, NgbTooltip, NgbPopover, TranslocoPipe],
})
export class ControlBarComponent {
  // -- Dependencies ----------------------------------------------------------
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject<Document>(DOCUMENT);
  private readonly playerService = inject(PlayerService);
  private readonly userLibraryService = inject(UserLibraryService);
  private readonly destroyRef = inject(DestroyRef);
  readonly authStore = inject(AuthStore);
  readonly playerStore = inject(PlayerStore);
  readonly queueStore = inject(QueueStore);

  // -- Derived state ---------------------------------------------------------
  readonly currentKey = computed(() => this.queueStore.currentKey());
  /** Stable array reference — only recreated when the track key actually changes.
   * Used by @for to trigger the .cb-left entry animation on each track change. */
  readonly currentKeyArr = computed(() => [this.currentKey()]);
  readonly currentTitle = computed(() => this.queueStore.currentVideo()?.titre ?? '');
  readonly currentArtist = computed(() => this.queueStore.currentVideo()?.artiste ?? '');
  readonly thumbnailUrl = computed(() => {
    const key = this.currentKey();
    return key ? `https://img.youtube.com/vi/${key}/mqdefault.jpg` : null;
  });
  readonly isLiked = computed(() => this.userLibraryService.isLiked(this.currentKey()));
  readonly volumeIcon = computed(() => {
    if (this.playerStore.isMuted()) return 'volume_off';
    const vol = this.playerStore.volume();
    if (vol === 0) return 'volume_off';
    return vol < 50 ? 'volume_down' : 'volume_up';
  });

  // -- Local state -----------------------------------------------------------
  /** Increments on each track change to alternate the CSS animation-name and restart it. */
  private readonly _animTick = signal(0);
  /** Alternates true/false on each track change — drives the animation class toggle. */
  readonly cbAnimA = computed(() => this._animTick() % 2 === 0);

  constructor() {
    // Re-trigger .cb-left entry animation on track change without DOM recreation (avoids NG0956)
    effect(() => {
      this.currentKey(); // establish dependency
      untracked(() => this._animTick.update(v => v + 1));
    });
  }

  readonly isPlayerExpanded = signal(false);
  readonly isDraggingPlayer = signal(false);
  readonly dragProgress = signal(0);

  /** Shows drag position while seeking, otherwise the store progress. */
  readonly displayProgress = computed(() =>
    this.isDraggingPlayer() ? this.dragProgress() : this.playerStore.progress()
  );

  // -- Transport actions -----------------------------------------------------

  onPlayPause(): void {
    this.playerService.onPlayPause();
  }

  onBefore(): void {
    this.playerService.before();
  }

  onAfter(): void {
    this.playerService.after();
  }

  repeat(): void {
    this.playerService.switchRepeat();
  }

  random(): void {
    this.playerService.switchRandom();
  }

  goFullscreen(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.getElementById(id)?.requestFullscreen();
  }

  /** Toggles like on the current track. */
  toggleLike(event: Event): void {
    event.stopPropagation();
    const key = this.currentKey();
    if (!key) return;
    const like$ = this.isLiked()
      ? this.userLibraryService.removeLike(key)
      : this.userLibraryService.addLike(key);
    like$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  // -- Slider handlers -------------------------------------------------------

  /** Real-time visual feedback during player slider drag. */
  onPlayerSliderInput(event: Event): void {
    const value = +(event.target as HTMLInputElement).value;
    this.isDraggingPlayer.set(true);
    this.dragProgress.set(value);
  }

  /** Commits seek position when user releases the player slider. */
  onPlayerSliderChange(event: Event): void {
    const value = +(event.target as HTMLInputElement).value;
    this.playerStore.seekToPercent(value);
    this.playerService.updatePositionSlider(value / 100);
    this.isDraggingPlayer.set(false);
  }

  /** Updates volume in real-time as user drags the volume slider. */
  onVolumeInput(event: Event): void {
    const value = +(event.target as HTMLInputElement).value;
    this.playerService.updateVolume(value);
  }

  /** Toggles mute state. */
  toggleMute(): void {
    this.playerService.toggleMute();
  }

  // -- Mobile expand/collapse ------------------------------------------------

  expandPlayer(): void {
    this.isPlayerExpanded.set(true);
    if (isPlatformBrowser(this.platformId)) {
      this.document.body.style.overflow = 'hidden';
    }
  }

  collapsePlayer(): void {
    this.isPlayerExpanded.set(false);
    if (isPlatformBrowser(this.platformId)) {
      this.document.body.style.overflow = '';
    }
  }
}
