import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { filter } from 'rxjs';
import { SeoService } from '../services/seo.service';
import { RESPONSE } from '../tokens';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe],
})
export class NotFoundComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly seoService = inject(SeoService);
  private readonly translocoService = inject(TranslocoService);
  private readonly googleAnalyticsService = inject(GoogleAnalyticsService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly response = inject(RESPONSE, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  readonly attemptedUrl = signal(this.sanitizePath(this.router.url));

  ngOnInit(): void {
    this.initPage();

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.attemptedUrl.set(this.sanitizePath(this.router.url));
        this.initPage();
      });
  }

  ngOnDestroy(): void {
    this.metaService.removeTag('name="robots"');
  }

  private initPage(): void {
    const title = this.translocoService.translate('page_not_found') + ' - Zeffyr Music';
    this.titleService.setTitle(title);
    const description = this.translocoService.translate('page_not_found_description');
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ name: 'robots', content: 'noindex' });

    const path = this.attemptedUrl();
    const canonicalUrl = new URL(path || '/', environment.URL_BASE).toString();
    this.seoService.updateCanonicalUrl(canonicalUrl);

    if (isPlatformServer(this.platformId) && this.response) {
      this.response.status(404);
    }

    if (isPlatformBrowser(this.platformId)) {
      this.googleAnalyticsService.pageView('/404', title);
      this.googleAnalyticsService.event('404_error', 'navigation', path);
    }
  }

  private sanitizePath(url: string): string {
    const path = url.split(/[?#]/)[0];
    return '/' + path.replace(/^\/+/, '');
  }
}
