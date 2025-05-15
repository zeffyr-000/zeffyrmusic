import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import { SeoService } from '../services/seo.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrl: './help.component.css',
  imports: [RouterLink, TranslocoPipe]
})
export class HelpComponent implements OnInit {

  constructor(
    private readonly titleService: Title,
    private readonly metaService: Meta,
    private readonly seoService: SeoService,
    private readonly translocoService: TranslocoService
  ) { }

  ngOnInit() {
    this.titleService.setTitle(this.translocoService.translate('help_meta_title'));
    this.metaService.updateTag({ name: 'description', content: this.translocoService.translate('help_meta_description') });
    this.seoService.updateCanonicalUrl(`${environment.URL_BASE}help`);
  }

}
