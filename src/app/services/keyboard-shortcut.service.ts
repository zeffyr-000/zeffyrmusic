import { DOCUMENT } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PlayerService } from './player.service';
import { PlayerStore } from '../store/player/player.store';
import { UiStore } from '../store/ui/ui.store';
import { YoutubePlayerService } from './youtube-player.service';

/** Seek step in seconds for arrow key navigation */
const SEEK_STEP = 5;

/** Volume step for arrow key adjustment */
const VOLUME_STEP = 5;

/** Tags where keyboard shortcuts should be ignored */
const IGNORED_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Global keyboard shortcuts for playback control.
 *
 * Shortcuts:
 * - Space: toggle play/pause
 * - ArrowLeft: seek backward 5s
 * - ArrowRight: seek forward 5s
 * - ArrowUp: volume up 5%
 * - ArrowDown: volume down 5%
 * - M: toggle mute
 * - Escape: collapse expanded player / close modal
 */
@Injectable({
  providedIn: 'root',
})
export class KeyboardShortcutService implements OnDestroy {
  private readonly document = inject<Document>(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly playerService = inject(PlayerService);
  private readonly playerStore = inject(PlayerStore);
  private readonly uiStore = inject(UiStore);
  private readonly youtubePlayer = inject(YoutubePlayerService);

  private boundHandler: ((e: KeyboardEvent) => void) | null = null;

  initialize(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.boundHandler = (e: KeyboardEvent) => this.handleKeydown(e);
    this.document.addEventListener('keydown', this.boundHandler);
  }

  ngOnDestroy(): void {
    if (this.boundHandler) {
      this.document.removeEventListener('keydown', this.boundHandler);
      this.boundHandler = null;
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    // Skip when user is typing in form elements or contenteditable
    const target = event.target as HTMLElement;
    if (IGNORED_TAGS.has(target.tagName) || target.isContentEditable) {
      return;
    }

    switch (event.key) {
      case ' ':
        event.preventDefault();
        this.blurActiveButton(target);
        this.playerService.onPlayPause();
        break;

      case 'ArrowLeft':
        event.preventDefault();
        this.blurActiveButton(target);
        this.seekRelative(-SEEK_STEP);
        break;

      case 'ArrowRight':
        event.preventDefault();
        this.blurActiveButton(target);
        this.seekRelative(SEEK_STEP);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.blurActiveButton(target);
        this.adjustVolume(VOLUME_STEP);
        break;

      case 'ArrowDown':
        event.preventDefault();
        this.blurActiveButton(target);
        this.adjustVolume(-VOLUME_STEP);
        break;

      case 'm':
      case 'M':
        event.preventDefault();
        this.blurActiveButton(target);
        this.playerStore.toggleMute();
        break;

      case 'Escape':
        this.handleEscape();
        break;
    }
  }

  /** Remove focus from buttons so global shortcuts don't trigger outlines or native click */
  private blurActiveButton(target: HTMLElement): void {
    if (target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement) {
      target.blur();
    }
  }

  /** Seek forward or backward by the given number of seconds */
  private seekRelative(delta: number): void {
    const currentTime = this.youtubePlayer.getCurrentTime();
    const duration = this.youtubePlayer.getDuration();
    if (duration <= 0) return;

    const newTime = Math.max(0, Math.min(currentTime + delta, duration));
    this.youtubePlayer.seekTo(newTime);
    this.playerStore.seekTo(newTime);
  }

  /** Adjust volume by the given delta (positive or negative) */
  private adjustVolume(delta: number): void {
    const currentVolume = this.playerStore.volume();
    const newVolume = Math.max(0, Math.min(100, currentVolume + delta));
    this.playerService.updateVolume(newVolume);
  }

  /** Collapse expanded player or close active modal */
  private handleEscape(): void {
    if (this.uiStore.isPlayerExpanded()) {
      this.uiStore.collapsePlayer();
    } else if (this.uiStore.hasActiveModal()) {
      this.uiStore.closeModal();
    }
  }
}
