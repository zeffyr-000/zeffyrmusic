import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import { SeoService } from '../services/seo.service';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrl: './help.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe],
})
export class HelpComponent implements OnInit, OnDestroy {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly seoService = inject(SeoService);
  private readonly translocoService = inject(TranslocoService);
  private readonly googleAnalyticsService = inject(GoogleAnalyticsService);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit() {
    const title = this.translocoService.translate('help_meta_title');
    const description = this.translocoService.translate('help_meta_description');
    const canonicalUrl = `${environment.URL_BASE}help`;

    this.titleService.setTitle(title);
    if (description) {
      this.metaService.updateTag({ name: 'description', content: description });
    }
    this.seoService.updateCanonicalUrl(canonicalUrl);

    this.metaService.updateTag({ name: 'og:title', content: title });
    this.metaService.updateTag({ name: 'og:description', content: description });
    this.metaService.updateTag({ name: 'og:url', content: canonicalUrl });
    this.metaService.updateTag({ name: 'og:type', content: 'website' });
    this.metaService.updateTag({ name: 'og:site_name', content: 'Zeffyr Music' });

    this.seoService.setBreadcrumbJsonLd([
      { name: this.translocoService.translate('home'), url: environment.URL_BASE },
      { name: this.translocoService.translate('help_title_directory'), url: canonicalUrl },
    ]);

    const helpBase = `${environment.URL_BASE}help`;
    this.seoService.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description,
      url: canonicalUrl,
      inLanguage: this.translocoService.getActiveLang(),
      publisher: {
        '@type': 'Organization',
        name: 'Zeffyr Music',
        url: environment.URL_BASE,
      },
      hasPart: [
        'listen',
        'locked-screen',
        'playlists',
        'export',
        'install-android',
        'install-ios',
        'settings',
        'legal',
        'download',
        'issues',
      ].map(slug => ({
        '@type': 'WebPage',
        url: `${helpBase}/${slug}`,
      })),
    });

    if (isPlatformBrowser(this.platformId)) {
      this.googleAnalyticsService.pageView('/help', this.titleService.getTitle());
    }
  }

  ngOnDestroy(): void {
    this.seoService.removeJsonLd();
    this.metaService.removeTag('name="og:title"');
    this.metaService.removeTag('name="og:description"');
    this.metaService.removeTag('name="og:url"');
    this.metaService.removeTag('name="og:type"');
    this.metaService.removeTag('name="og:site_name"');
  }
}
