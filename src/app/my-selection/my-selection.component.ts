import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { UserLibraryService } from '../services/user-library.service';
import { Title } from '@angular/platform-browser';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import { DefaultImageDirective } from '../directives/default-image.directive';
import { UserDataStore } from '../store/user-data/user-data.store';

@Component({
  selector: 'app-my-selection',
  templateUrl: './my-selection.component.html',
  styleUrl: './my-selection.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DefaultImageDirective, TranslocoPipe],
})
export class MySelectionComponent implements OnInit {
  private readonly userLibraryService = inject(UserLibraryService);
  private readonly titleService = inject(Title);
  private readonly translocoService = inject(TranslocoService);
  readonly userDataStore = inject(UserDataStore);

  ngOnInit() {
    this.titleService.setTitle(this.translocoService.translate('ma_selection') + ' - Zeffyr Music');
  }

  onDeleteFollow(idPlaylist: string) {
    this.userLibraryService.removeFollow(idPlaylist).subscribe();
  }
}
