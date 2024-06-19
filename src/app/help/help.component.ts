import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { switchMap, take } from 'rxjs';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrl: './help.component.css'
})
export class HelpComponent implements OnInit {

  constructor(
    private readonly titleService: Title,
    private readonly metaService: Meta,
    private readonly translocoService: TranslocoService
  ) { }

  ngOnInit() {
    this.translocoService.langChanges$
      .pipe(
        take(1),
        switchMap(() => this.translocoService.selectTranslate('help_meta_title'))
      )
      .subscribe(title => {
        this.titleService.setTitle(title);
      });

    this.translocoService.langChanges$
      .pipe(
        take(1),
        switchMap(() => this.translocoService.selectTranslate('help_meta_description'))
      )
      .subscribe(description => {
        this.metaService.updateTag({ name: 'description', content: description });
      });
  }

}
