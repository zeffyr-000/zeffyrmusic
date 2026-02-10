import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  TemplateRef,
  inject,
  signal,
} from '@angular/core';
import { UserLibraryService } from '../services/user-library.service';
import { Title } from '@angular/platform-browser';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import { DefaultImageDirective } from '../directives/default-image.directive';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserDataStore } from '../store/user-data/user-data.store';
import { UiStore } from '../store/ui/ui.store';

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
  private readonly modalService = inject(NgbModal);
  readonly userDataStore = inject(UserDataStore);
  private readonly uiStore = inject(UiStore);

  private readonly pendingDeleteId = signal('');
  readonly pendingDeleteTitle = signal('');
  readonly pendingDeleteArtist = signal('');

  ngOnInit() {
    this.titleService.setTitle(this.translocoService.translate('ma_selection') + ' - Zeffyr Music');
  }

  onConfirmDeleteFollow(
    idPlaylist: string,
    title: string,
    artist: string,
    modalTemplate: TemplateRef<unknown>
  ) {
    this.pendingDeleteId.set(idPlaylist);
    this.pendingDeleteTitle.set(title);
    this.pendingDeleteArtist.set(artist);
    this.modalService.open(modalTemplate, { size: 'lg' });
  }

  onDeleteFollow(modal: NgbActiveModal) {
    this.userLibraryService.removeFollow(this.pendingDeleteId()).subscribe({
      next: () => {
        modal.dismiss();
        this.uiStore.showSuccess(this.translocoService.translate('selection_removed'));
      },
      error: () => {
        this.uiStore.showError(this.translocoService.translate('generic_error'));
      },
    });
  }
}
