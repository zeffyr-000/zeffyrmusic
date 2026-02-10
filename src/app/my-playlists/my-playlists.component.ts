import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  TemplateRef,
  inject,
  signal,
} from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import {
  NgbActiveModal,
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbModal,
  NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { CreatePlaylistResponse, UserReponse } from '../models/user.model';
import { UserLibraryService } from '../services/user-library.service';
import { UserService } from '../services/user.service';
import { UiStore } from '../store/ui/ui.store';
import { UserDataStore } from '../store/user-data/user-data.store';

@Component({
  selector: 'app-my-playlists',
  templateUrl: './my-playlists.component.html',
  styleUrl: './my-playlists.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    NgbDropdown,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
    NgbTooltip,
    RouterLink,
    TranslocoPipe,
  ],
})
export class MyPlaylistsComponent implements OnInit {
  private readonly userLibraryService = inject(UserLibraryService);
  private readonly titleService = inject(Title);
  private readonly translocoService = inject(TranslocoService);
  private readonly userService = inject(UserService);
  private readonly modalService = inject(NgbModal);
  readonly userDataStore = inject(UserDataStore);
  private readonly uiStore = inject(UiStore);

  readonly currentIdPlaylistEdit = signal('');

  // Signal Forms
  readonly createPlaylistModel = signal({ titre: '' });
  readonly createPlaylistForm = form(this.createPlaylistModel, schemaPath => {
    required(schemaPath.titre);
  });

  readonly editTitleModel = signal({ playlist_titre: '' });
  readonly editTitleForm = form(this.editTitleModel, schemaPath => {
    required(schemaPath.playlist_titre);
  });

  ngOnInit() {
    this.titleService.setTitle(
      this.translocoService.translate('mes_playlists') + ' - Zeffyr Music'
    );
  }

  onCreatePlaylist(event: Event) {
    event.preventDefault();
    if (this.createPlaylistForm().valid()) {
      this.userService.createPlaylist(this.createPlaylistModel()).subscribe({
        next: (data: CreatePlaylistResponse) => {
          if (data.success !== undefined && data.success) {
            this.userLibraryService.addPlaylist(data.id_playlist, data.titre);
            this.createPlaylistModel.set({ titre: '' });
            this.uiStore.showSuccess(this.translocoService.translate('playlist_created'));
          } else {
            this.uiStore.showError(this.translocoService.translate(data?.error || 'generic_error'));
          }
        },
        error: () => {
          this.uiStore.showError(this.translocoService.translate('generic_error'));
        },
      });
    }
  }

  onSwitchVisibility(idPlaylist: string, visibility: string) {
    this.userLibraryService.togglePlaylistVisibility(idPlaylist, visibility === 'prive').subscribe({
      error: () => {
        this.uiStore.showError(this.translocoService.translate('generic_error'));
      },
    });
  }

  onConfirmEditTitlePlaylist(
    idPlaylist: string,
    title: string,
    contentModalConfirmEditTitle: TemplateRef<unknown>
  ) {
    this.modalService.open(contentModalConfirmEditTitle, { size: 'lg' });
    this.currentIdPlaylistEdit.set(idPlaylist);
    this.editTitleModel.set({ playlist_titre: title });
  }

  onEditTitlePlaylist(event: Event, modal: NgbActiveModal) {
    event.preventDefault();
    if (this.editTitleForm().valid()) {
      const newTitle = this.editTitleModel().playlist_titre;
      this.userService
        .editTitlePlaylist({
          id_playlist: this.currentIdPlaylistEdit(),
          titre: newTitle,
        })
        .subscribe({
          next: (data: UserReponse) => {
            if (data.success !== undefined && data.success) {
              this.userLibraryService.updatePlaylistTitle(this.currentIdPlaylistEdit(), newTitle);
              modal.dismiss();
              this.uiStore.showSuccess(this.translocoService.translate('playlist_title_updated'));
            } else {
              this.uiStore.showError(
                this.translocoService.translate(data?.error || 'generic_error')
              );
            }
          },
          error: () => {
            this.uiStore.showError(this.translocoService.translate('generic_error'));
          },
        });
    }
  }

  onConfirmDeletePlaylist(
    idPlaylist: string,
    contentModalConfirmDeletePlaylist: TemplateRef<unknown>
  ) {
    this.modalService.open(contentModalConfirmDeletePlaylist, { size: 'lg' });
    this.currentIdPlaylistEdit.set(idPlaylist);
  }

  onDeletePlaylist(modal: NgbActiveModal) {
    this.userLibraryService.deletePlaylist(this.currentIdPlaylistEdit()).subscribe({
      next: () => {
        modal.dismiss();
        this.uiStore.showSuccess(this.translocoService.translate('playlist_deleted'));
      },
      error: () => {
        this.uiStore.showError(this.translocoService.translate('generic_error'));
      },
    });
  }
}
