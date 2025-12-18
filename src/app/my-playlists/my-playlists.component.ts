import { Component, OnDestroy, OnInit, TemplateRef, inject } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreatePlaylistResponse, UserReponse } from '../models/user.model';
import { PlayerService } from '../services/player.service';
import { UserService } from '../services/user.service';
import { Subscription } from 'rxjs';
import { UserPlaylist } from '../models/playlist.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-my-playlists',
  templateUrl: './my-playlists.component.html',
  styleUrl: './my-playlists.component.css',
  imports: [FormsModule, RouterLink, TranslocoPipe],
})
export class MyPlaylistsComponent implements OnInit, OnDestroy {
  playerService = inject(PlayerService);
  private titleService = inject(Title);
  private readonly translocoService = inject(TranslocoService);
  userService = inject(UserService);
  modalService = inject(NgbModal);

  error: string;
  listPlaylist: UserPlaylist[];
  subscriptionListPlaylist: Subscription;

  currentIdPlaylistEdit: string;
  playlistTitle: string;

  ngOnInit() {
    this.titleService.setTitle(
      this.translocoService.translate('mes_playlists') + ' - Zeffyr Music'
    );

    this.subscriptionListPlaylist = this.playerService.subjectListPlaylist.subscribe(data => {
      this.listPlaylist = data;
    });
  }

  onCreatePlaylist(form: NgForm) {
    if (form.valid) {
      this.userService.createPlaylist(form.form.value).subscribe({
        next: (data: CreatePlaylistResponse) => {
          if (data.success !== undefined && data.success) {
            this.playerService.addNewPlaylist(data.id_playlist, data.titre);
          } else {
            this.error = this.translocoService.translate(data?.error || 'generic_error');
          }
        },
      });
    }
  }

  onSwitchVisibility(idPlaylist: string, isPrivate: string) {
    this.playerService.switchVisibilityPlaylist(idPlaylist, isPrivate === 'prive');
  }

  onConfirmEditTitlePlaylist(
    idPlaylist: string,
    title: string,
    contentModalConfirmEditTitle: TemplateRef<unknown>
  ) {
    this.modalService.open(contentModalConfirmEditTitle);
    this.currentIdPlaylistEdit = idPlaylist;
    this.playlistTitle = title;
  }

  onEditTitlePlaylist(form: NgForm, modal: NgbActiveModal) {
    if (form.valid) {
      this.userService
        .editTitlePlaylist({
          id_playlist: this.currentIdPlaylistEdit,
          titre: form.form.value.playlist_titre,
        })
        .subscribe({
          next: (data: UserReponse) => {
            if (data.success !== undefined && data.success) {
              this.playerService.editPlaylistTitle(
                this.currentIdPlaylistEdit,
                form.form.value.playlist_titre
              );
              modal.dismiss();
            } else {
              this.error = this.translocoService.translate(data?.error || 'generic_error');
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
    this.playerService.deletePlaylist(this.currentIdPlaylistEdit);
    modal.dismiss();
  }

  ngOnDestroy() {
    this.subscriptionListPlaylist.unsubscribe();
  }
}
