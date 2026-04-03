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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { SeoService } from 'src/app/services/seo.service';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { environment } from 'src/environments/environment';

const PAGE_META: Record<string, { title: string; description: string; schema?: 'faq' | 'howto' }> =
  {
    'install-android': {
      title: 'help_install_android_title',
      description: 'help_install_android_description',
      schema: 'howto',
    },
    'install-ios': {
      title: 'help_install_ios_title',
      description: 'help_install_ios_description',
      schema: 'howto',
    },
    'locked-screen': {
      title: 'help_screen_locked_title',
      description: 'help_screen_locked_description',
      schema: 'howto',
    },
    listen: { title: 'help_listen_title', description: 'help_listen_description', schema: 'howto' },
    legal: { title: 'help_legal_title', description: 'help_legal_description' },
    download: {
      title: 'help_download_title',
      description: 'help_download_description',
      schema: 'howto',
    },
    issues: { title: 'help_issues_title', description: 'help_issues_description', schema: 'faq' },
    playlists: {
      title: 'help_playlists_title',
      description: 'help_playlists_description',
      schema: 'howto',
    },
    settings: {
      title: 'help_settings_title',
      description: 'help_settings_description',
      schema: 'howto',
    },
    export: {
      title: 'help_export_title',
      description: 'help_export_description',
      schema: 'howto',
    },
  };

/** Compact FAQ definitions: [questionKey, ...answerKeys][] */
const FAQ_ENTRIES: [string, ...string[]][] = [
  [
    'help_issues_step_1_title',
    'help_issues_step_1_content1',
    'help_issues_step_1_content2',
    'help_issues_step_1_content3',
    'help_issues_step_1_content4',
  ],
  [
    'help_issues_step_2_title',
    'help_issues_step_2_content1',
    'help_issues_step_2_content2',
    'help_issues_step_2_content3',
  ],
  [
    'help_issues_step_3_title',
    'help_issues_step_3_content1',
    'help_issues_step_3_content2',
    'help_issues_step_3_content3',
  ],
  [
    'help_issues_step_4_title',
    'help_issues_step_4_content1',
    'help_issues_step_4_content2',
    'help_issues_step_4_content3',
    'help_issues_step_4_content4',
  ],
];

@Component({
  selector: 'app-help-page',
  templateUrl: './help-page.component.html',
  styleUrl: './help-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, RouterLink],
})
export class HelpPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly seoService = inject(SeoService);
  private readonly translocoService = inject(TranslocoService);
  private readonly googleAnalyticsService = inject(GoogleAnalyticsService);
  private readonly platformId = inject(PLATFORM_ID);

  page = '';
  URL_ASSETS = environment.URL_ASSETS;

  ngOnInit() {
    this.page = this.route.snapshot.paramMap.get('page') ?? '';
    const meta = PAGE_META[this.page];

    if (!meta) {
      this.router.navigate(['/help'], { replaceUrl: true });
      return;
    }

    this.titleService.setTitle(this.translocoService.translate(meta.title) + ' - Zeffyr Music');
    const description = this.translocoService.translate(meta.description);
    if (description) {
      this.metaService.updateTag({
        name: 'description',
        content: description,
      });
    }
    this.seoService.updateCanonicalUrl(`${environment.URL_BASE}help/${this.page}`);
    this.setStructuredData();

    if (isPlatformBrowser(this.platformId)) {
      this.googleAnalyticsService.pageView(`/help/${this.page}`, this.titleService.getTitle());
    }
  }

  ngOnDestroy(): void {
    this.seoService.removeJsonLd();
  }

  private setStructuredData(): void {
    const meta = PAGE_META[this.page];
    if (!meta.schema) return;

    if (meta.schema === 'faq') {
      this.seoService.setJsonLd({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_ENTRIES.map(([question, ...answers]) => ({
          '@type': 'Question',
          name: this.t(question),
          acceptedAnswer: {
            '@type': 'Answer',
            text: answers.map(key => this.t(key)).join(' '),
          },
        })),
      });
    } else {
      this.seoService.setJsonLd({
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: this.t(meta.title),
        description: this.t(meta.description),
      });
    }
  }

  private t(key: string): string {
    return this.translocoService.translate(key);
  }
}
