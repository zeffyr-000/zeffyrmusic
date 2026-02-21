import { DOCUMENT } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { filter } from 'rxjs';

/**
 * Manages focus after route navigation for SPA accessibility.
 * Resets focus to #content and announces the new page title via aria-live region.
 */
@Injectable({
  providedIn: 'root',
})
export class FocusService {
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);
  private readonly translocoService = inject(TranslocoService);
  private readonly document = inject<Document>(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private announcer: HTMLElement | null = null;

  initialize(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.createAnnouncer();

    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.resetFocus();
      this.announcePageTitle();
    });
  }

  /** Move focus to #content and scroll to top so keyboard users start at the page content */
  private resetFocus(): void {
    const content = this.document.getElementById('content');
    if (content) {
      content.setAttribute('tabindex', '-1');
      content.focus({ preventScroll: true });
      content.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  /** Announce the current page title to screen readers via aria-live */
  private announcePageTitle(): void {
    if (!this.announcer) {
      return;
    }

    const title = this.titleService.getTitle();
    const announcement = this.translocoService.translate('route_announced', { title });
    // Clear then set to ensure screen readers re-announce
    this.announcer.textContent = '';
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = announcement;
      }
    }, 100);
  }

  /** Create a visually-hidden aria-live region for route announcements */
  private createAnnouncer(): void {
    this.announcer = this.document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.setAttribute('role', 'status');
    this.announcer.classList.add('visually-hidden');
    this.announcer.id = 'route-announcer';
    this.document.body.appendChild(this.announcer);
  }
}
