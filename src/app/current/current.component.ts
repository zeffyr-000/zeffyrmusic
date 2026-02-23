import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { PlayerService } from '../services/player.service';
import { SeoService } from '../services/seo.service';
import { LazyLoadImageDirective } from '../directives/lazy-load-image.directive';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { QueueStore, AuthStore } from '../store';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-current',
  templateUrl: './current.component.html',
  styleUrl: './current.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LazyLoadImageDirective,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    TranslocoPipe,
  ],
})
export class CurrentComponent implements OnInit {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly seoService = inject(SeoService);
  private readonly translocoService = inject(TranslocoService);
  readonly playerService = inject(PlayerService);
  readonly queueStore = inject(QueueStore);
  readonly authStore = inject(AuthStore);

  ngOnInit(): void {
    this.titleService.setTitle(this.translocoService.translate('current_page_title'));
    this.metaService.updateTag({
      name: 'description',
      content: this.translocoService.translate('current_meta_description') || '',
    });
    this.seoService.updateCanonicalUrl(`${environment.URL_BASE}current`);
  }

  play(index: number, isInitialIndex: boolean) {
    this.playerService.lecture(index, isInitialIndex);
  }

  removeToPlaylist(index: number) {
    this.playerService.removeToPlaylist(index);
  }
}
