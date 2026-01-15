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
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreatePlaylistResponse, UserReponse } from '../models/user.model';
import { UserLibraryService } from '../services/user-library.service';
import { UserService } from '../services/user.service';
import { RouterLink } from '@angular/router';
import { UserDataStore } from '../store/user-data/user-data.store';

@Component({
  selector: 'app-my-playlists',
  templateUrl: './my-playlists.component.html',
  styleUrl: './my-playlists.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, RouterLink, TranslocoPipe],
})
export class MyPlaylistsComponent implements OnInit {
  private readonly userLibraryService = inject(UserLibraryService);
  private readonly titleService = inject(Title);
  private readonly translocoService = inject(TranslocoService);
  readonly userDataStore = inject(UserDataStore);
  private readonly userService = inject(UserService);
  private readonly modalService = inject(NgbModal);

  readonly error = signal('');

  currentIdPlaylistEdit = '';

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
          } else {
            this.error.set(this.translocoService.translate(data?.error || 'generic_error'));
          }
        },
      });
    }
  }

  onSwitchVisibility(idPlaylist: string, isPrivate: string) {
    this.userLibraryService.togglePlaylistVisibility(idPlaylist, isPrivate === 'prive').subscribe();
  }

  onConfirmEditTitlePlaylist(
    idPlaylist: string,
    title: string,
    contentModalConfirmEditTitle: TemplateRef<unknown>
  ) {
    this.modalService.open(contentModalConfirmEditTitle);
    this.currentIdPlaylistEdit = idPlaylist;
    this.editTitleModel.set({ playlist_titre: title });
  }

  onEditTitlePlaylist(event: Event, modal: NgbActiveModal) {
    event.preventDefault();
    if (this.editTitleForm().valid()) {
      const newTitle = this.editTitleModel().playlist_titre;
      this.userService
        .editTitlePlaylist({
          id_playlist: this.currentIdPlaylistEdit,
          titre: newTitle,
        })
        .subscribe({
          next: (data: UserReponse) => {
            if (data.success !== undefined && data.success) {
              this.userLibraryService.updatePlaylistTitle(this.currentIdPlaylistEdit, newTitle);
              modal.dismiss();
            } else {
              this.error.set(this.translocoService.translate(data?.error || 'generic_error'));
            }
          },
        });
    }
  }

  onConfirmDeletePlaylist(
    idPlaylist: string,
    contentModalConfirmDeletePlaylist: TemplateRef<unknown>
  ) {
    this.modalService.open(contentModalConfirmDeletePlaylist);
    this.currentIdPlaylistEdit = idPlaylist;
  }

  onDeletePlaylist(modal: NgbActiveModal) {
    this.userLibraryService.deletePlaylist(this.currentIdPlaylistEdit).subscribe({
      next: () => modal.dismiss(),
    });
  }
}
