import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ImageCropperComponent, ImageCroppedEvent, OutputFormat } from 'ngx-image-cropper';
import { PlaylistThumbnailService } from 'src/app/services/playlist-thumbnail.service';
import { UiStore } from 'src/app/store';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MIME_TO_FORMAT: Partial<Record<string, OutputFormat>> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/gif': 'jpeg',
};

@Component({
  selector: 'app-playlist-thumbnail-modal',
  standalone: true,
  imports: [TranslocoPipe, ImageCropperComponent],
  templateUrl: './playlist-thumbnail-modal.component.html',
  styleUrl: './playlist-thumbnail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistThumbnailModalComponent {
  readonly modal = inject(NgbActiveModal);
  private readonly thumbnailService = inject(PlaylistThumbnailService);
  private readonly translocoService = inject(TranslocoService);
  private readonly uiStore = inject(UiStore);

  idPlaylist!: string;

  readonly step = signal<'select' | 'crop'>('select');
  readonly isLoading = signal(false);
  readonly imageChangedEvent = signal<Event | null>(null);
  readonly croppedBlob = signal<Blob | null>(null);
  readonly outputFormat = signal<OutputFormat>('jpeg');
  readonly gifWarning = signal(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.uiStore.showError(this.translocoService.translate('playlist_thumbnail_file_too_large'));
      input.value = '';
      return;
    }

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      this.uiStore.showError(this.translocoService.translate('playlist_thumbnail_error_format'));
      input.value = '';
      return;
    }

    const format = MIME_TO_FORMAT[file.type] ?? 'jpeg';
    this.outputFormat.set(format);
    this.gifWarning.set(file.type === 'image/gif');
    this.imageChangedEvent.set(event);
    this.step.set('crop');
  }

  onImageCropped(event: ImageCroppedEvent): void {
    this.croppedBlob.set(event.blob ?? null);
  }

  confirm(): void {
    const blob = this.croppedBlob();
    if (!blob) {
      return;
    }

    this.isLoading.set(true);
    const mimeType = `image/${this.outputFormat()}`;

    this.thumbnailService.uploadThumbnail(this.idPlaylist, blob, mimeType).subscribe({
      next: result => {
        this.isLoading.set(false);
        this.modal.close(result);
      },
      error: () => {
        this.isLoading.set(false);
        this.uiStore.showError(this.translocoService.translate('playlist_thumbnail_error'));
      },
    });
  }
}
