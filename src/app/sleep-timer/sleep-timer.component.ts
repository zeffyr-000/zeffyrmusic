import {
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownItem,
  NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslocoPipe } from '@jsverse/transloco';
import { PlayerStore } from '../store';
import { formatTime } from '../utils';

/**
 * Sleep timer — pauses playback after a user-selected delay.
 *
 * Shows a small dropdown of preset durations. While a timer is armed, a live
 * countdown is displayed and playback is paused automatically on expiry.
 */
@Component({
  selector: 'app-sleep-timer',
  templateUrl: './sleep-timer.component.html',
  styleUrl: './sleep-timer.component.scss',
  imports: [
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    NgbTooltip,
    TranslocoPipe,
  ],
})
export class SleepTimerComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly playerStore = inject(PlayerStore);

  /** Preset durations offered in the dropdown (minutes). */
  readonly presets = [15, 30, 45, 60] as const;

  /** Wall-clock timestamp (ms) at which playback should pause, or null when idle. */
  private readonly endsAt = signal<number | null>(null);
  /** Ticks every second while a timer is armed to drive the countdown. */
  private readonly now = signal(Date.now());

  /** Whether a timer is currently armed. */
  readonly isActive = computed(() => this.endsAt() !== null);

  /** Seconds left before playback pauses, or null when idle. */
  readonly remainingSeconds = computed(() => {
    const target = this.endsAt();
    if (target === null) return null;
    return Math.round((target - this.now()) / 1000);
  });

  /** Formatted "m:ss" countdown for the UI. */
  readonly remainingLabel = computed(() => {
    const seconds = this.remainingSeconds();
    return seconds === null ? '' : formatTime(seconds);
  });

  constructor() {
    // Pause playback the moment the countdown reaches zero, then disarm.
    effect(() => {
      if (this.remainingSeconds() === 0) {
        untracked(() => {
          this.playerStore.pause();
          this.endsAt.set(null);
        });
      }
    });
  }

  /** Arm the timer for the given number of minutes. */
  start(minutes: number): void {
    this.endsAt.set(Date.now() + minutes * 60_000);
    if (!isPlatformBrowser(this.platformId)) return;
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.now.set(Date.now()));
  }

  /** Add 5 minutes to a running timer. */
  extend(): void {
    if (this.endsAt() === null) return;
    this.endsAt.set(Date.now() + 5 * 60_000);
  }

  /** Cancel the armed timer. */
  cancel(): void {
    this.endsAt.set(null);
  }
}
