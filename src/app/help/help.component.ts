import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
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
export class HelpComponent implements OnInit {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly seoService = inject(SeoService);
  private readonly translocoService = inject(TranslocoService);
  private readonly googleAnalyticsService = inject(GoogleAnalyticsService);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit() {
    this.titleService.setTitle(this.translocoService.translate('help_meta_title'));
    const description = this.translocoService.translate('help_meta_description');
    if (description) {
      this.metaService.updateTag({
        name: 'description',
        content: description,
      });
    }
    this.seoService.updateCanonicalUrl(`${environment.URL_BASE}help`);

    if (isPlatformBrowser(this.platformId)) {
      this.googleAnalyticsService.pageView('/help', this.titleService.getTitle());
    }
  }
}
