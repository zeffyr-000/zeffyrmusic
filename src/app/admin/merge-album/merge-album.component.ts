import { Component, OnInit, TemplateRef, computed, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DefaultImageDirective } from '../../directives/default-image.directive';
import { ToMMSSPipe } from '../../pipes/to-mmss.pipe';
import { AlbumAdminService } from '../../services/album-admin.service';
import { SeoService } from '../../services/seo.service';
import { Playlist } from '../../models/playlist.model';
import { MergeAlbumsPayload } from '../../models/album-admin.model';
import { UiStore } from '../../store';
import { environment } from '../../../environments/environment';

type AlbumChoice = 'album1' | 'album2';

@Component({
  selector: 'app-merge-album',
  templateUrl: './merge-album.component.html',
  styleUrl: './merge-album.component.scss',
  imports: [FormField, FormRoot, TranslocoPipe, DefaultImageDirective, ToMMSSPipe],
})
export class MergeAlbumComponent implements OnInit {
  private readonly albumAdminService = inject(AlbumAdminService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly seoService = inject(SeoService);
  private readonly translocoService = inject(TranslocoService);
  private readonly modalService = inject(NgbModal);
  private readonly uiStore = inject(UiStore);

  // Album data
  readonly album1 = signal<Playlist | null>(null);
  readonly album2 = signal<Playlist | null>(null);
  readonly isLoadingAlbum1 = signal(false);
  readonly isLoadingAlbum2 = signal(false);
  readonly isSubmitting = signal(false);
  readonly mergeSuccess = signal(false);
  readonly album1Error = signal('');
  readonly album2Error = signal('');
  readonly hasSourceParam = signal(false);
  readonly deletedAlbumChoice = signal<AlbumChoice | null>(null);

  private readonly errorKeyMap: Record<string, string> = {
    not_found: 'admin_merge_album_not_found',
  };

  // Merge selection state
  readonly selectedKeepAlbum = signal<AlbumChoice>('album1');
  readonly selectedTitre = signal<AlbumChoice>('album1');
  readonly selectedArtiste = signal<AlbumChoice>('album1');
  readonly selectedImage = signal<AlbumChoice>('album1');
  readonly selectedVideos = signal<AlbumChoice>('album1');
  readonly selectedYear = signal<AlbumChoice>('album1');

  readonly bothLoaded = computed(() => this.album1() !== null && this.album2() !== null);

  // Signal Forms — Album 1 input
  readonly album1Model = signal({ albumInput: '' });
  readonly album1Form = form(
    this.album1Model,
    schemaPath => {
      required(schemaPath.albumInput);
      validate(schemaPath.albumInput, ({ value }) => {
        const parsed = this.parseAlbumId(value());
        if (!parsed) {
          return {
            kind: 'invalidFormat',
            message: this.translocoService.translate('admin_merge_invalid_id'),
          };
        }
        return null;
      });
    },
    {
      submission: {
        action: () => this.submitAlbum1(),
      },
    }
  );

  // Signal Forms — Album 2 input
  readonly album2Model = signal({ albumInput: '' });
  readonly album2Form = form(
    this.album2Model,
    schemaPath => {
      required(schemaPath.albumInput);
      validate(schemaPath.albumInput, ({ value }) => {
        const parsed = this.parseAlbumId(value());
        if (!parsed) {
          return {
            kind: 'invalidFormat',
            message: this.translocoService.translate('admin_merge_invalid_id'),
          };
        }
        return null;
      });
    },
    {
      submission: {
        action: () => this.submitAlbum2(),
      },
    }
  );

  ngOnInit(): void {
    this.titleService.setTitle(
      this.translocoService.translate('admin_merge_albums_title') + ' - Zeffyr Music'
    );
    this.metaService.updateTag({
      name: 'description',
      content: this.translocoService.translate('admin_merge_albums_title') || '',
    });
    this.seoService.updateCanonicalUrl(`${environment.URL_BASE}admin/merge-album`);

    const sourceId = this.activatedRoute.snapshot.queryParamMap.get('source');
    if (sourceId) {
      this.hasSourceParam.set(true);
      const parsedId = this.parseAlbumId(sourceId);
      if (parsedId) {
        this.loadAlbum1(parsedId);
      } else {
        this.album1Error.set(this.translocoService.translate('admin_merge_invalid_id'));
      }
    }
  }

  private loadAlbum1(idPlaylist: string): void {
    this.isLoadingAlbum1.set(true);
    this.album1Error.set('');

    this.albumAdminService.getAlbumDetails(idPlaylist).subscribe({
      next: (data: Playlist) => {
        this.isLoadingAlbum1.set(false);
        this.applyAlbumResult(data, this.album1, this.album1Error);
      },
      error: () => {
        this.isLoadingAlbum1.set(false);
        this.album1Error.set(this.translocoService.translate('admin_merge_error'));
      },
    });
  }

  async submitAlbum1(): Promise<void> {
    const id = this.parseAlbumId(this.album1Model().albumInput);
    if (!id) return;

    this.album1Error.set('');
    this.isLoadingAlbum1.set(true);
    try {
      const data = await firstValueFrom(this.albumAdminService.getAlbumDetails(id));
      this.applyAlbumResult(data, this.album1, this.album1Error);
    } catch {
      this.album1Error.set(this.translocoService.translate('admin_merge_error'));
    } finally {
      this.isLoadingAlbum1.set(false);
    }
  }

  async submitAlbum2(): Promise<void> {
    const id = this.parseAlbumId(this.album2Model().albumInput);
    if (!id) return;

    const album1 = this.album1();
    if (id === album1?.id_playlist) {
      this.album2Error.set(this.translocoService.translate('admin_merge_same_album'));
      return;
    }

    this.album2Error.set('');
    this.isLoadingAlbum2.set(true);
    try {
      const data = await firstValueFrom(this.albumAdminService.getAlbumDetails(id));
      this.applyAlbumResult(data, this.album2, this.album2Error);
    } catch {
      this.album2Error.set(this.translocoService.translate('admin_merge_error'));
    } finally {
      this.isLoadingAlbum2.set(false);
    }
  }

  private applyAlbumResult(
    data: Playlist,
    albumSignal: typeof this.album1,
    errorSignal: typeof this.album1Error
  ): void {
    if (data.titre || data.title) {
      if (this.isUserPlaylist(data)) {
        albumSignal.set(null);
        errorSignal.set(this.translocoService.translate('admin_merge_user_playlist_error'));
      } else {
        albumSignal.set(data);
      }
    } else {
      albumSignal.set(null);
      errorSignal.set(this.translocoService.translate('admin_merge_album_not_found'));
    }
  }

  parseAlbumId(input: string): string | null {
    if (!input?.trim()) return null;
    const trimmed = input.trim();

    // Direct numeric ID
    if (/^\d+$/.test(trimmed)) {
      return trimmed;
    }

    // URL pattern: /playlist/123 or playlist/123
    const match = /playlist\/(\d+)/.exec(trimmed);
    if (match) {
      return match[1];
    }

    return null;
  }

  resetAlbum1(): void {
    this.album1.set(null);
    this.album1Error.set('');
    this.album1Model.set({ albumInput: '' });
    this.resetMergeState();
  }

  resetAlbum2(): void {
    this.album2.set(null);
    this.album2Error.set('');
    this.album2Model.set({ albumInput: '' });
    this.resetMergeState();
  }

  private resetMergeState(): void {
    this.mergeSuccess.set(false);
    this.deletedAlbumChoice.set(null);
    this.selectedKeepAlbum.set('album1');
    this.selectedTitre.set('album1');
    this.selectedArtiste.set('album1');
    this.selectedImage.set('album1');
    this.selectedVideos.set('album1');
    this.selectedYear.set('album1');
  }

  private isUserPlaylist(data: Playlist): boolean {
    return !!data.id_perso && data.id_perso !== '0';
  }

  onSelectKeepAlbum(choice: AlbumChoice): void {
    this.selectedKeepAlbum.set(choice);
  }

  onSelectTitre(choice: AlbumChoice): void {
    this.selectedTitre.set(choice);
  }

  onSelectArtiste(choice: AlbumChoice): void {
    this.selectedArtiste.set(choice);
  }

  onSelectImage(choice: AlbumChoice): void {
    this.selectedImage.set(choice);
  }

  onSelectVideos(choice: AlbumChoice): void {
    this.selectedVideos.set(choice);
  }

  onSelectYear(choice: AlbumChoice): void {
    this.selectedYear.set(choice);
  }

  openConfirmModal(tpl: TemplateRef<unknown>): void {
    this.modalService.open(tpl, { centered: true, size: 'md' });
  }

  async confirmMerge(): Promise<void> {
    const a1 = this.album1();
    const a2 = this.album2();
    if (!a1 || !a2) return;

    const pick = (choice: AlbumChoice) => (choice === 'album1' ? a1 : a2);
    const sources = {
      keep: pick(this.selectedKeepAlbum()),
      delete: this.selectedKeepAlbum() === 'album1' ? a2 : a1,
      titre: pick(this.selectedTitre()),
      artiste: pick(this.selectedArtiste()),
      image: pick(this.selectedImage()),
      videos: pick(this.selectedVideos()),
      year: pick(this.selectedYear()),
    };

    const payload: MergeAlbumsPayload = {
      keep_album_id: sources.keep.id_playlist,
      delete_album_id: sources.delete.id_playlist,
      titre_from: sources.titre.id_playlist,
      artiste_from: sources.artiste.id_playlist,
      img_from: sources.image.id_playlist,
      videos_from: sources.videos.id_playlist,
      year_from: sources.year.id_playlist,
    };

    this.isSubmitting.set(true);
    this.modalService.dismissAll();

    try {
      const result = await firstValueFrom(this.albumAdminService.mergeAlbums(payload));
      if (result.success) {
        this.handleMergeSuccess(sources);
      } else {
        const errorKey = result.error ? this.errorKeyMap[result.error] : undefined;
        this.uiStore.showError(this.translocoService.translate(errorKey ?? 'admin_merge_error'));
      }
    } catch {
      this.uiStore.showError(this.translocoService.translate('admin_merge_error'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private handleMergeSuccess(sources: Record<string, Playlist>): void {
    this.mergeSuccess.set(true);
    this.uiStore.showSuccess(this.translocoService.translate('admin_merge_success'));
    const deleteChoice: AlbumChoice = this.selectedKeepAlbum() === 'album1' ? 'album2' : 'album1';
    this.deletedAlbumChoice.set(deleteChoice);
    const keptAlbumSignal = this.selectedKeepAlbum() === 'album1' ? this.album1 : this.album2;
    keptAlbumSignal.update(album =>
      album
        ? {
            ...album,
            titre: sources['titre'].titre,
            title: sources['titre'].title,
            artiste: sources['artiste'].artiste,
            img_big: sources['image'].img_big,
            tab_video: sources['videos'].tab_video,
            year: sources['year'].year,
          }
        : album
    );
  }

  getAlbumDisplayTitle(album: Playlist): string {
    return album.titre || album.title;
  }
}
