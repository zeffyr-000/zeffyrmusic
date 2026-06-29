import { Component, OnInit, TemplateRef, computed, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DefaultImageDirective } from '../../directives/default-image.directive';
import { ArtistAdminService } from '../../services/artist-admin.service';
import { SeoService } from '../../services/seo.service';
import { ArtistData } from '../../models/artist.model';
import { MergeArtistsPayload } from '../../models/artist-admin.model';
import { UiStore } from '../../store';
import { environment } from '../../../environments/environment';

type ArtistChoice = 'artist1' | 'artist2';

@Component({
  selector: 'app-merge-artist',
  templateUrl: './merge-artist.component.html',
  styleUrl: './merge-artist.component.scss',
  imports: [FormField, FormRoot, TranslocoPipe, DefaultImageDirective],
})
export class MergeArtistComponent implements OnInit {
  private readonly artistAdminService = inject(ArtistAdminService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly seoService = inject(SeoService);
  private readonly translocoService = inject(TranslocoService);
  private readonly modalService = inject(NgbModal);
  private readonly uiStore = inject(UiStore);

  // Artist data
  readonly artist1 = signal<ArtistData | null>(null);
  readonly artist2 = signal<ArtistData | null>(null);
  readonly isLoadingArtist1 = signal(false);
  readonly isLoadingArtist2 = signal(false);
  readonly isSubmitting = signal(false);
  readonly mergeSuccess = signal(false);
  readonly artist1Error = signal('');
  readonly artist2Error = signal('');
  readonly hasSourceParam = signal(false);
  readonly deletedArtistChoice = signal<ArtistChoice | null>(null);

  private readonly errorKeyMap: Record<string, string> = {
    not_found: 'admin_merge_artist_not_found',
  };

  // Merge selection state
  readonly selectedKeepArtist = signal<ArtistChoice>('artist1');
  readonly selectedNom = signal<ArtistChoice>('artist1');
  readonly selectedDeezerId = signal<ArtistChoice>('artist1');

  readonly bothLoaded = computed(() => this.artist1() !== null && this.artist2() !== null);

  // Signal Forms — Artist 1 input
  readonly artist1Model = signal({ artistInput: '' });
  readonly artist1Form = form(
    this.artist1Model,
    schemaPath => {
      required(schemaPath.artistInput);
      validate(schemaPath.artistInput, ({ value }) => {
        const parsed = this.parseArtistId(value());
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
        action: () => this.submitArtist1(),
      },
    }
  );

  // Signal Forms — Artist 2 input
  readonly artist2Model = signal({ artistInput: '' });
  readonly artist2Form = form(
    this.artist2Model,
    schemaPath => {
      required(schemaPath.artistInput);
      validate(schemaPath.artistInput, ({ value }) => {
        const parsed = this.parseArtistId(value());
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
        action: () => this.submitArtist2(),
      },
    }
  );

  ngOnInit(): void {
    this.titleService.setTitle(
      this.translocoService.translate('admin_merge_artists_title') + ' - Zeffyr Music'
    );
    this.metaService.updateTag({
      name: 'description',
      content: this.translocoService.translate('admin_merge_artists_title') || '',
    });
    this.seoService.updateCanonicalUrl(`${environment.URL_BASE}admin/merge-artist`);

    const sourceId = this.activatedRoute.snapshot.queryParamMap.get('source');
    if (sourceId) {
      this.hasSourceParam.set(true);
      const parsedId = this.parseArtistId(sourceId);
      if (parsedId) {
        this.loadArtist1(parsedId);
      } else {
        this.artist1Error.set(this.translocoService.translate('admin_merge_invalid_id'));
      }
    }
  }

  private loadArtist1(idArtist: string): void {
    this.isLoadingArtist1.set(true);
    this.artist1Error.set('');

    this.artistAdminService.getArtistDetails(idArtist).subscribe({
      next: (data: ArtistData) => {
        this.isLoadingArtist1.set(false);
        this.applyArtistResult(idArtist, data, this.artist1, this.artist1Error);
      },
      error: () => {
        this.isLoadingArtist1.set(false);
        this.artist1Error.set(this.translocoService.translate('admin_merge_error'));
      },
    });
  }

  async submitArtist1(): Promise<void> {
    const id = this.parseArtistId(this.artist1Model().artistInput);
    if (!id) return;

    const a2 = this.artist2();
    if (id === a2?.id_artist) {
      this.artist1Error.set(this.translocoService.translate('admin_merge_same_artist'));
      return;
    }

    this.artist1Error.set('');
    this.isLoadingArtist1.set(true);
    try {
      const data = await firstValueFrom(this.artistAdminService.getArtistDetails(id));
      this.applyArtistResult(id, data, this.artist1, this.artist1Error);
    } catch {
      this.artist1Error.set(this.translocoService.translate('admin_merge_error'));
    } finally {
      this.isLoadingArtist1.set(false);
    }
  }

  async submitArtist2(): Promise<void> {
    const id = this.parseArtistId(this.artist2Model().artistInput);
    if (!id) return;

    const a1 = this.artist1();
    if (id === a1?.id_artist) {
      this.artist2Error.set(this.translocoService.translate('admin_merge_same_artist'));
      return;
    }

    this.artist2Error.set('');
    this.isLoadingArtist2.set(true);
    try {
      const data = await firstValueFrom(this.artistAdminService.getArtistDetails(id));
      this.applyArtistResult(id, data, this.artist2, this.artist2Error);
    } catch {
      this.artist2Error.set(this.translocoService.translate('admin_merge_error'));
    } finally {
      this.isLoadingArtist2.set(false);
    }
  }

  private applyArtistResult(
    id: string,
    data: ArtistData,
    artistSignal: typeof this.artist1,
    errorSignal: typeof this.artist1Error
  ): void {
    if (data.nom) {
      artistSignal.set({ ...data, id_artist: id });
    } else {
      artistSignal.set(null);
      errorSignal.set(this.translocoService.translate('admin_merge_artist_not_found'));
    }
  }

  parseArtistId(input: string): string | null {
    if (!input?.trim()) return null;
    const trimmed = input.trim();

    // Direct numeric ID
    if (/^\d+$/.test(trimmed)) {
      return trimmed;
    }

    // URL pattern: /artist/123 or artist/123
    const match = /artist\/(\d+)/.exec(trimmed);
    if (match) {
      return match[1];
    }

    return null;
  }

  resetArtist1(): void {
    this.artist1.set(null);
    this.artist1Error.set('');
    this.artist1Model.set({ artistInput: '' });
    this.resetMergeState();
  }

  resetArtist2(): void {
    this.artist2.set(null);
    this.artist2Error.set('');
    this.artist2Model.set({ artistInput: '' });
    this.resetMergeState();
  }

  private resetMergeState(): void {
    this.mergeSuccess.set(false);
    this.deletedArtistChoice.set(null);
    this.selectedKeepArtist.set('artist1');
    this.selectedNom.set('artist1');
    this.selectedDeezerId.set('artist1');
  }

  onSelectKeepArtist(choice: ArtistChoice): void {
    this.selectedKeepArtist.set(choice);
  }

  onSelectNom(choice: ArtistChoice): void {
    this.selectedNom.set(choice);
  }

  onSelectDeezerId(choice: ArtistChoice): void {
    this.selectedDeezerId.set(choice);
  }

  getArtistImageUrl(artist: ArtistData): string {
    return 'https://api.deezer.com/artist/' + artist.id_artiste_deezer + '/image?size=big';
  }

  openConfirmModal(tpl: TemplateRef<unknown>): void {
    this.modalService.open(tpl, { centered: true, size: 'md' });
  }

  async confirmMerge(): Promise<void> {
    const a1 = this.artist1();
    const a2 = this.artist2();
    if (!a1 || !a2) return;

    const pick = (choice: ArtistChoice) => (choice === 'artist1' ? a1 : a2);
    const sources = {
      keep: pick(this.selectedKeepArtist()),
      delete: this.selectedKeepArtist() === 'artist1' ? a2 : a1,
      nom: pick(this.selectedNom()),
      deezerId: pick(this.selectedDeezerId()),
    };

    const payload: MergeArtistsPayload = {
      keep_artist_id: sources.keep.id_artist,
      delete_artist_id: sources.delete.id_artist,
      nom_from: sources.nom.id_artist,
      id_artiste_deezer_from: sources.deezerId.id_artist,
    };

    this.isSubmitting.set(true);
    this.modalService.dismissAll();

    try {
      const result = await firstValueFrom(this.artistAdminService.mergeArtists(payload));
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

  private handleMergeSuccess(sources: Record<string, ArtistData>): void {
    this.mergeSuccess.set(true);
    this.uiStore.showSuccess(this.translocoService.translate('admin_merge_artist_success'));
    const deleteChoice: ArtistChoice =
      this.selectedKeepArtist() === 'artist1' ? 'artist2' : 'artist1';
    this.deletedArtistChoice.set(deleteChoice);

    const keptArtistSignal = this.selectedKeepArtist() === 'artist1' ? this.artist1 : this.artist2;
    const deletedArtist = this.selectedKeepArtist() === 'artist1' ? this.artist2() : this.artist1();

    keptArtistSignal.update(artist =>
      artist
        ? {
            ...artist,
            nom: sources['nom'].nom,
            id_artiste_deezer: sources['deezerId'].id_artiste_deezer,
            list_albums: [...artist.list_albums, ...(deletedArtist?.list_albums ?? [])],
          }
        : artist
    );
  }
}
