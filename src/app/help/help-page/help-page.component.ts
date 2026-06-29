import { Component, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
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
    legal: { title: 'help_legal_title', description: 'help_legal_description', schema: 'faq' },
    download: {
      title: 'help_download_title',
      description: 'help_download_description',
      schema: 'faq',
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

type ContentEntry = [titleKey: string, ...contentKeys: string[]];

/** FAQ definitions per page: [questionKey, ...answerKeys][] */
const FAQ_DATA_BY_PAGE: Record<string, ContentEntry[]> = {
  issues: [
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
  ],
  legal: [
    ['help_legal_step_1_title', 'help_legal_step_1_content'],
    [
      'help_legal_step_2_title',
      'help_legal_step_2_content1',
      'help_legal_step_2_content2',
      'help_legal_step_2_content3',
      'help_legal_step_2_content4',
    ],
  ],
  download: [
    [
      'help_download_step_1_title',
      'help_download_step_1_content1',
      'help_download_step_1_content2',
      'help_download_step_1_content3',
      'help_download_step_1_content4',
    ],
  ],
};

/** HowTo step definitions per page: [stepTitleKey, ...stepContentKeys][] */
const HOWTO_STEPS: Record<string, ContentEntry[]> = {
  'install-android': [
    [
      'help_install_android_chrome_title',
      'help_install_android_chrome_content_1',
      'help_install_android_chrome_content_2',
      'help_install_android_chrome_content_3',
      'help_install_android_chrome_content_4',
      'help_install_android_chrome_content_5',
    ],
    [
      'help_install_android_samsung_title',
      'help_install_android_samsung_content_1',
      'help_install_android_samsung_content_2',
      'help_install_android_samsung_content_3',
      'help_install_android_samsung_content_4',
      'help_install_android_samsung_content_5',
      'help_install_android_samsung_content_6',
    ],
  ],
  'install-ios': [
    [
      'help_install_ios_title',
      'help_install_ios_content_1',
      'help_install_ios_content_2',
      'help_install_ios_content_3',
      'help_install_ios_content_4',
      'help_install_ios_content_5',
      'help_install_ios_content_6',
    ],
  ],
  'locked-screen': [
    ['help_screen_locked_step_1_title', 'help_screen_locked_step_1_content'],
    ['help_screen_locked_step_2_title', 'help_screen_locked_step_2_content'],
    ['help_screen_locked_step_3_title', 'help_screen_locked_step_3_content'],
    ['help_screen_locked_step_4_title', 'help_screen_locked_step_4_content'],
    ['help_screen_locked_step_5_title', 'help_screen_locked_step_5_content'],
    ['help_screen_locked_step_6_title', 'help_screen_locked_step_6_content'],
    ['help_screen_locked_step_7_title', 'help_screen_locked_step_7_content'],
  ],
  listen: [
    ['help_listen_step_1_title', 'help_listen_step_1_content1', 'help_listen_step_1_content2'],
    ['help_listen_step_2_title', 'help_listen_step_2_content1', 'help_listen_step_2_content2'],
    [
      'help_listen_step_3_title',
      'help_listen_step_3_content1',
      'help_listen_step_3_content2',
      'help_listen_step_3_content3',
      'help_listen_step_3_content4',
      'help_listen_step_3_content5',
    ],
    [
      'help_listen_step_4_title',
      'help_listen_step_4_content1',
      'help_listen_step_4_content2',
      'help_listen_step_4_content3',
    ],
    [
      'help_listen_step_5_title',
      'help_listen_step_5_content1',
      'help_listen_step_5_content2',
      'help_listen_step_5_content3',
    ],
    ['help_listen_step_6_title', 'help_listen_step_6_content1', 'help_listen_step_6_content2'],
  ],
  playlists: [
    [
      'help_playlists_step_1_title',
      'help_playlists_step_1_content1',
      'help_playlists_step_1_content2',
      'help_playlists_step_1_content3',
    ],
    [
      'help_playlists_step_2_title',
      'help_playlists_step_2_content1',
      'help_playlists_step_2_content2',
      'help_playlists_step_2_content3',
    ],
    [
      'help_playlists_step_3_title',
      'help_playlists_step_3_content1',
      'help_playlists_step_3_content2',
      'help_playlists_step_3_content3',
      'help_playlists_step_3_content4',
    ],
    [
      'help_playlists_step_4_title',
      'help_playlists_step_4_content1',
      'help_playlists_step_4_content2',
      'help_playlists_step_4_content3',
    ],
    [
      'help_playlists_step_5_title',
      'help_playlists_step_5_content1',
      'help_playlists_step_5_content2',
      'help_playlists_step_5_content3',
    ],
  ],
  settings: [
    [
      'help_settings_step_1_title',
      'help_settings_step_1_content1',
      'help_settings_step_1_content2',
    ],
    [
      'help_settings_step_2_title',
      'help_settings_step_2_content1',
      'help_settings_step_2_content2',
    ],
    [
      'help_settings_step_3_title',
      'help_settings_step_3_content1',
      'help_settings_step_3_content2',
      'help_settings_step_3_content3',
      'help_settings_step_3_content4',
    ],
    ['help_settings_step_4_title', 'help_settings_step_4_content'],
  ],
  export: [
    ['help_export_step_1_title', 'help_export_step_1_content1', 'help_export_step_1_content2'],
    ['help_export_step_2_title', 'help_export_step_2_content1', 'help_export_step_2_content2'],
    ['help_export_step_3_title', 'help_export_step_3_content1', 'help_export_step_3_content2'],
    [
      'help_export_step_4_title',
      'help_export_step_4_content1',
      'help_export_step_4_content2',
      'help_export_step_4_content3',
      'help_export_step_4_content4',
    ],
  ],
};

/** Image URLs for HowTo steps that have screenshots */
const HOWTO_IMAGES: Record<string, string> = {
  'install-android': 'assets/img/help/android_chrome_1.jpg',
  'install-ios': 'assets/img/help/ios_safari_1.jpg',
};

@Component({
  selector: 'app-help-page',
  templateUrl: './help-page.component.html',
  styleUrl: './help-page.component.scss',
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

    const title = this.t(meta.title) + ' - Zeffyr Music';
    const description = this.t(meta.description);
    const canonicalUrl = `${environment.URL_BASE}help/${this.page}`;

    this.titleService.setTitle(title);
    if (description) {
      this.metaService.updateTag({ name: 'description', content: description });
    }
    this.seoService.updateCanonicalUrl(canonicalUrl);

    this.metaService.updateTag({ name: 'og:title', content: title });
    this.metaService.updateTag({ name: 'og:description', content: description });
    this.metaService.updateTag({ name: 'og:url', content: canonicalUrl });
    this.metaService.updateTag({ name: 'og:type', content: 'article' });
    this.metaService.updateTag({ name: 'og:site_name', content: 'Zeffyr Music' });

    this.seoService.setBreadcrumbJsonLd([
      { name: this.t('home'), url: environment.URL_BASE },
      { name: this.t('help_title_directory'), url: `${environment.URL_BASE}help` },
      { name: this.t(meta.title), url: canonicalUrl },
    ]);
    this.setStructuredData();

    if (isPlatformBrowser(this.platformId)) {
      this.googleAnalyticsService.pageView(`/help/${this.page}`, this.titleService.getTitle());
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

  private setStructuredData(): void {
    const meta = PAGE_META[this.page];
    if (!meta.schema) return;

    if (meta.schema === 'faq') {
      const entries = FAQ_DATA_BY_PAGE[this.page];
      if (!entries) return;
      this.seoService.setJsonLd({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: entries.map(([question, ...answers]) => ({
          '@type': 'Question',
          name: this.t(question),
          acceptedAnswer: {
            '@type': 'Answer',
            text: answers.map(key => this.t(key)).join(' '),
          },
        })),
      });
    } else {
      const steps = HOWTO_STEPS[this.page];
      if (!steps) return;
      const imageUrl = HOWTO_IMAGES[this.page];
      const jsonLd: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: this.t(meta.title),
        description: this.t(meta.description),
        step: steps.map(([stepTitle, ...stepContents]) => {
          const step: Record<string, string> = {
            '@type': 'HowToStep',
            name: this.t(stepTitle),
            text: stepContents.map(key => this.t(key)).join(' '),
          };
          return step;
        }),
      };
      if (imageUrl) {
        jsonLd['image'] = `${environment.URL_BASE}${imageUrl}`;
      }
      this.seoService.setJsonLd(jsonLd);
    }
  }

  private t(key: string): string {
    return this.translocoService.translate(key);
  }
}
