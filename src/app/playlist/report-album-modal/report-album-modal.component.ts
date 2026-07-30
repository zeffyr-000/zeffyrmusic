import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import {
  REPORT_ALBUM_REASONS,
  ReportAlbumError,
  ReportAlbumReason,
} from 'src/app/models/report-album.model';
import { ReportAlbumService } from 'src/app/services/report-album.service';
import { UiStore } from 'src/app/store';

/**
 * Backend error slugs mapped to their translation keys. Partial on purpose:
 * `already_reported` is handled earlier as a benign outcome, not an error.
 */
const ERROR_KEY_MAP: Partial<Record<ReportAlbumError, string>> = {
  album_not_found: 'report_album_error_not_found',
  unauthorized: 'report_album_error_unauthorized',
};

@Component({
  selector: 'app-report-album-modal',
  templateUrl: './report-album-modal.component.html',
  imports: [FormField, FormRoot, TranslocoPipe],
})
export class ReportAlbumModalComponent {
  readonly modal = inject(NgbActiveModal);
  private readonly reportAlbumService = inject(ReportAlbumService);
  private readonly translocoService = inject(TranslocoService);
  private readonly uiStore = inject(UiStore);

  /** Set by the opener through modalRef.componentInstance. */
  idPlaylist!: string;

  readonly reasons = REPORT_ALBUM_REASONS;
  readonly errorMessage = signal('');

  readonly reportModel = signal<{ reason: ReportAlbumReason | '' }>({ reason: '' });
  readonly reportForm = form(
    this.reportModel,
    schemaPath => {
      required(schemaPath.reason);
    },
    {
      submission: {
        action: () => this.submitReport(),
      },
    }
  );

  private async submitReport(): Promise<void> {
    const reason = this.reportModel().reason;
    if (!reason) {
      return;
    }
    this.errorMessage.set('');

    try {
      const result = await firstValueFrom(
        this.reportAlbumService.reportAlbum({ id_playlist: this.idPlaylist, reason })
      );

      if (result.success) {
        this.uiStore.showSuccess(this.translocoService.translate('report_album_success'));
        this.modal.close(reason);
        return;
      }

      // Reporting twice is not a user error: acknowledge it and close.
      if (result.error === 'already_reported') {
        this.uiStore.showInfo(this.translocoService.translate('report_album_already'));
        this.modal.close(reason);
        return;
      }

      this.errorMessage.set(this.translocoService.translate(resolveErrorKey(result.error)));
    } catch {
      this.errorMessage.set(this.translocoService.translate('generic_error'));
    }
  }
}

function resolveErrorKey(error?: ReportAlbumError): string {
  return (error && ERROR_KEY_MAP[error]) || 'generic_error';
}
