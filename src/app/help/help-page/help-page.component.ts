import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { switchMap, take } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-help-page',
  templateUrl: './help-page.component.html',
  styleUrl: './help-page.component.css'
})
export class HelpPageComponent implements OnInit {
  page: string;
  URL_ASSETS = environment.URL_ASSETS;

  constructor(private route: ActivatedRoute,
    private readonly titleService: Title,
    private readonly metaService: Meta,
    private readonly translocoService: TranslocoService
  ) { }


  ngOnInit() {
    this.page = this.route.snapshot.paramMap.get('page');

    this.translocoService.langChanges$
      .pipe(
        take(1),
        switchMap(() => {
          let pageTitle = '';
          switch (this.page) {
            case 'install-android':
              pageTitle = 'help_install_android_title';
              break;
            case 'install-ios':
              pageTitle = 'help_install_ios_title';
              break;
            case 'locked-screen':
              pageTitle = 'help_screen_locked_title';
              break;
          }
          return this.translocoService.selectTranslate(pageTitle);
        })
      )
      .subscribe(title => {
        this.titleService.setTitle(title + ' - Zeffyr Music');
      });

    this.translocoService.langChanges$
      .pipe(
        take(1),
        switchMap(() => {
          let pageDescription = '';
          switch (this.page) {
            case 'install-android':
              pageDescription = 'help_install_android_description';
              break;
            case 'install-ios':
              pageDescription = 'help_install_ios_description';
              break;
            case 'locked-screen':
              pageDescription = 'help_screen_locked_description';
              break;
          }
          return this.translocoService.selectTranslate(pageDescription);
        })
      )
      .subscribe(description => {
        this.metaService.updateTag({ name: 'description', content: description });
      });
  }
}
