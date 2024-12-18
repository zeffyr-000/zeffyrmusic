import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrl: './help.component.css',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false
})
export class HelpComponent implements OnInit {

  constructor(
    private readonly titleService: Title,
    private readonly metaService: Meta,
    private readonly translocoService: TranslocoService
  ) { }

  ngOnInit() {
    this.titleService.setTitle(this.translocoService.translate('help_meta_title'));
    this.metaService.updateTag({ name: 'description', content: this.translocoService.translate('help_meta_description') });
  }

}
