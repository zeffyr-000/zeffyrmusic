import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { SeoService } from 'src/app/services/seo.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-help-page',
  templateUrl: './help-page.component.html',
  styleUrl: './help-page.component.css',
  imports: [TranslocoPipe]
})
export class HelpPageComponent implements OnInit {
  page: string;
  URL_ASSETS = environment.URL_ASSETS;

  constructor(private route: ActivatedRoute,
    private readonly titleService: Title,
    private readonly metaService: Meta,
    private readonly seoService: SeoService,
    private readonly translocoService: TranslocoService
  ) { }


  ngOnInit() {
    this.page = this.route.snapshot.paramMap.get('page');
    let pageTitle = '';
    let pageDescription = '';

    switch (this.page) {
      case 'install-android':
        pageTitle = 'help_install_android_title';
        pageDescription = 'help_install_android_description';
        break;
      case 'install-ios':
        pageTitle = 'help_install_ios_title';
        pageDescription = 'help_install_ios_description';
        break;
      case 'locked-screen':
        pageTitle = 'help_screen_locked_title';
        pageDescription = 'help_screen_locked_description';
        break;
      case 'listen':
        pageTitle = 'help_listen_title';
        pageDescription = 'help_listen_description';
        break;
      case 'legal':
        pageTitle = 'help_legal_title';
        pageDescription = 'help_legal_description';
        break;
      case 'download':
        pageTitle = 'help_download_title';
        pageDescription = 'help_download_description';
        break;
      case 'issues':
        pageTitle = 'help_issues_title';
        pageDescription = 'help_issues_description';
        break;
    }

    this.titleService.setTitle(this.translocoService.translate(pageTitle) + ' - Zeffyr Music');
    this.metaService.updateTag({ name: 'description', content: this.translocoService.translate(pageDescription) });
    this.seoService.updateCanonicalUrl(`${environment.URL_BASE}help/${this.page}`);
  }
}
