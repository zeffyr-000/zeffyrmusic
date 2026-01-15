import { Injectable, PLATFORM_ID, inject, ApplicationRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';

/**
 * PageLifecycleService - PWA Page Lifecycle Management
 *
 * Handles page visibility changes, bfcache restoration, and PWA resume events.
 * Critical for standalone PWA mode where the app may be frozen and restored.
 *
 * Events handled:
 * - pageshow (with persisted flag for bfcache restoration)
 * - visibilitychange (background/foreground transitions)
 * - freeze/resume (Page Lifecycle API for modern browsers)
 */
@Injectable({
  providedIn: 'root',
})
export class PageLifecycleService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly appRef = inject(ApplicationRef);
  private readonly isBrowser: boolean;

  /** Emits when app is resumed from background/frozen state */
  readonly resumed$ = new Subject<ResumeEvent>();

  /** Timestamp of last resume */
  private lastResumeTime = 0;

  /** Debounce time to avoid multiple rapid resume events */
  private readonly RESUME_DEBOUNCE_MS = 1000;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.initializeListeners();
    }
  }

  private initializeListeners(): void {
    // Track if page was restored from bfcache
    let wasRestoredFromCache = false;

    // Handle page show (including bfcache restoration)
    window.addEventListener('pageshow', (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from bfcache
        wasRestoredFromCache = true;
        this.emitResume('bfcache', wasRestoredFromCache);
      }
    });

    // Handle visibility changes (tab switch, app background/foreground)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.emitResume('visibility', wasRestoredFromCache);
      }
    });

    // Handle Page Lifecycle API (modern browsers)
    if ('onfreeze' in document) {
      document.addEventListener('freeze', () => {
        // App is being frozen - state could be saved here if needed
      });

      document.addEventListener('resume', () => {
        this.emitResume('lifecycle', false);
      });
    }

    // Handle online/offline for network-dependent refresh
    window.addEventListener('online', () => {
      // If app comes back online, might need to refresh stale data
      this.emitResume('online', false);
    });
  }

  private emitResume(source: ResumeSource, wasFromCache: boolean): void {
    const now = Date.now();

    // Debounce rapid resume events
    if (now - this.lastResumeTime < this.RESUME_DEBOUNCE_MS) {
      return;
    }

    this.lastResumeTime = now;

    const event: ResumeEvent = {
      source,
      timestamp: now,
      wasFromCache,
    };

    this.resumed$.next(event);

    // Force Angular change detection after resume
    // Critical for zoneless apps where signals might not trigger updates
    this.forceChangeDetection();
  }

  /**
   * Force Angular to run change detection.
   * Essential for zoneless apps after resume from frozen state.
   */
  forceChangeDetection(): void {
    if (this.isBrowser) {
      // Use setTimeout to ensure we're in the next microtask
      setTimeout(() => {
        this.appRef.tick();
      }, 0);
    }
  }

  /**
   * Check if the app is in standalone PWA mode
   */
  isStandalonePwa(): boolean {
    if (!this.isBrowser) return false;

    return (
      ('standalone' in window.navigator &&
        (window.navigator as Navigator & { standalone: boolean }).standalone) ||
      window.matchMedia('(display-mode: standalone)').matches
    );
  }
}

export type ResumeSource = 'bfcache' | 'visibility' | 'lifecycle' | 'online';

export interface ResumeEvent {
  source: ResumeSource;
  timestamp: number;
  wasFromCache: boolean;
}
