import { Injectable, DOCUMENT, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UiStore } from '../store';

/** Size (px) of the flying ghost thumbnail. */
const GHOST_SIZE = 48;

/** Duration (ms) of the ghost flight. */
const FLIGHT_DURATION = 650;

/** Delay (ms) after the flight starts before pulsing the freshly added items. */
const LANDING_DELAY = FLIGHT_DURATION - 120;

/** Desktop queue list (holds the track rows; ghost lands at its bottom). */
const DESKTOP_LIST = '#queue-content';

/** Mobile queue target (always-visible hamburger menu, top-left). */
const MOBILE_TARGET = '#header-burger';

/**
 * QueueAnimationService - Visual "fly to queue" feedback.
 *
 * Spawns a short-lived ghost thumbnail that flies from the clicked
 * button to the current playback queue (bottom of the queue list on desktop,
 * hamburger menu on mobile), giving users a clear cue that tracks were added.
 * Browser-only and SSR-safe.
 */
@Injectable({ providedIn: 'root' })
export class QueueAnimationService {
  private readonly document = inject<Document>(DOCUMENT);
  private readonly uiStore = inject(UiStore);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * Animate one (or several) tracks flying to the queue. When `count` > 1 the
   * ghost carries a "+N" badge so a bulk add is unambiguous.
   */
  flyToQueue(source: HTMLElement, videoKey: string, count = 1): void {
    if (!this.canAnimate()) {
      return;
    }

    const target = this.getTargetPoint();
    if (!target) {
      return;
    }

    this.spawnGhost(source.getBoundingClientRect(), target, this.thumbnailUrl(videoKey), count);
    this.pulseNewItems(count);
  }

  /** Whether animations may run (browser + motion allowed). */
  private canAnimate(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    if (typeof globalThis.matchMedia !== 'function') {
      return false;
    }

    if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }

    // Web Animations API support (used by `HTMLElement.animate`).
    return (
      (globalThis as unknown as { Element?: typeof Element }).Element !== undefined &&
      typeof Element.prototype.animate === 'function'
    );
  }

  /** Build a YouTube thumbnail URL from a video key. */
  private thumbnailUrl(key: string): string {
    return `https://img.youtube.com/vi/${key}/mqdefault.jpg`;
  }

  /**
   * Landing point for the ghost: the hamburger menu center on mobile, or the
   * bottom of the queue list (where new tracks are appended) on desktop.
   */
  private getTargetPoint(): { x: number; y: number } | null {
    if (this.uiStore.checkIsMobile() && globalThis.matchMedia('(max-width: 767.98px)').matches) {
      const burger = this.document.querySelector(MOBILE_TARGET);
      if (!burger) {
        return null;
      }
      const rect = burger.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    const list = this.document.querySelector(DESKTOP_LIST);
    if (!list) {
      return null;
    }
    const rect = list.getBoundingClientRect();
    const viewportBottom = this.document.defaultView?.innerHeight ?? rect.bottom;
    const bottomY = Math.min(rect.bottom, viewportBottom) - 28;
    return { x: rect.left + rect.width / 2, y: Math.max(bottomY, rect.top + 24) };
  }

  /** Create, animate and clean up the flying ghost. */
  private spawnGhost(
    from: DOMRect,
    to: { x: number; y: number },
    thumbnailUrl: string,
    count: number
  ): void {
    const ghost = this.buildGhost(thumbnailUrl, count);

    const startX = from.left + from.width / 2 - GHOST_SIZE / 2;
    const startY = from.top + from.height / 2 - GHOST_SIZE / 2;
    const endX = to.x - GHOST_SIZE / 2;
    const endY = to.y - GHOST_SIZE / 2;

    ghost.style.left = `${startX}px`;
    ghost.style.top = `${startY}px`;
    this.document.body.appendChild(ghost);

    const dx = endX - startX;
    const dy = endY - startY;

    const animation = ghost.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
        {
          transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 50}px) scale(0.85)`,
          opacity: 0.9,
          offset: 0.6,
        },
        { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0, offset: 1 },
      ],
      { duration: FLIGHT_DURATION, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'forwards' }
    );

    const cleanup = () => ghost.remove();
    animation.onfinish = cleanup;
    animation.oncancel = cleanup;
  }

  /** Build a ghost DOM node, with an optional "+N" badge for bulk adds. */
  private buildGhost(thumbnailUrl: string, count: number): HTMLElement {
    const ghost = this.document.createElement('div');
    ghost.className = 'fly-ghost';
    ghost.style.setProperty('--fly-ghost-size', `${GHOST_SIZE}px`);
    ghost.setAttribute('aria-hidden', 'true');

    const img = this.document.createElement('img');
    img.src = thumbnailUrl;
    img.alt = '';
    ghost.appendChild(img);

    if (count > 1) {
      const badge = this.document.createElement('span');
      badge.className = 'fly-ghost-badge';
      badge.textContent = `+${count}`;
      ghost.appendChild(badge);
    }

    return ghost;
  }

  /**
   * Briefly pulse the last `count` rows of the desktop queue list near the end of
   * the flight (slightly before it finishes) so the visual feedback feels immediate.
   * The list scroll position is left untouched. On mobile the list is hidden, so the
   * ghost flight alone provides the feedback.
   */
  private pulseNewItems(count: number): void {
    if (this.uiStore.checkIsMobile() && globalThis.matchMedia('(max-width: 767.98px)').matches) {
      return;
    }

    setTimeout(() => {
      const container = this.document.querySelector<HTMLElement>(DESKTOP_LIST);
      if (!container) {
        return;
      }

      // Glow the whole list to signal it just received tracks.
      this.restartAnimation(container, 'queue-received');

      const items = container.querySelectorAll<HTMLElement>('.track-item');
      const start = Math.max(0, items.length - count);
      for (let i = start; i < items.length; i++) {
        this.restartAnimation(items[i], 'track-item-added');
      }
    }, LANDING_DELAY);
  }

  /**
   * Restart a CSS animation class on an element reliably, even on rapid
   * consecutive calls. Removes the class immediately, then re-adds it on the
   * next animation frame so the browser can coalesce layout work for bulk adds.
   * Cleans up the class automatically via `animationend`.
   */
  private restartAnimation(el: HTMLElement, className: string): void {
    el.classList.remove(className);

    const restart = () => {
      el.classList.add(className);
      el.addEventListener('animationend', () => el.classList.remove(className), { once: true });
    };

    if (typeof globalThis.requestAnimationFrame === 'function') {
      globalThis.requestAnimationFrame(restart);
    } else {
      setTimeout(restart, 0);
    }
  }
}
