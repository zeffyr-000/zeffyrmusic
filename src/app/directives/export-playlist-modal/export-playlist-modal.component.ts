import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Video } from '../../models/video.model';
import { UiStore } from '../../store/ui/ui.store';
import { formatPlaylistAsCsv, formatPlaylistAsText } from '../../utils';

const UNSAFE_FILENAME_CHARS = /[/\\:*?"<>|]/g;

function sanitizeFilename(name: string): string {
  return name.replaceAll(UNSAFE_FILENAME_CHARS, '_').trim().slice(0, 200);
}

@Component({
  selector: 'app-export-playlist-modal',
  templateUrl: './export-playlist-modal.component.html',
  styleUrl: './export-playlist-modal.component.scss',
  imports: [TranslocoPipe],
})
export class ExportPlaylistModalComponent {
  readonly activeModal = inject(NgbActiveModal);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly uiStore = inject(UiStore);
  private readonly translocoService = inject(TranslocoService);

  readonly copied = signal(false);
  readonly tracks = signal<Video[]>([]);
  readonly playlistTitle = signal('');

  copyToClipboard(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const clipboard = globalThis.navigator?.clipboard;
    if (typeof clipboard?.writeText !== 'function') {
      this.uiStore.showError(this.translocoService.translate('generic_error'));
      return;
    }
    const text = formatPlaylistAsText(this.tracks());
    clipboard
      .writeText(text)
      .then(() => {
        this.copied.set(true);
        this.uiStore.showSuccess(this.translocoService.translate('export_copy_success'));
      })
      .catch(() => {
        this.uiStore.showError(this.translocoService.translate('generic_error'));
      });
  }

  downloadCsv(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const csv = formatPlaylistAsCsv(this.tracks());
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilename(this.playlistTitle()) || 'playlist'}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url));
    this.uiStore.showSuccess(this.translocoService.translate('export_download_success'));
  }
}
