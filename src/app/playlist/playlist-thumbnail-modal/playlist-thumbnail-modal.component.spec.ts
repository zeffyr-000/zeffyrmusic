import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';
import type { ImageCroppedEvent } from 'ngx-image-cropper';
import { PlaylistThumbnailModalComponent } from './playlist-thumbnail-modal.component';
import { PlaylistThumbnailService } from 'src/app/services/playlist-thumbnail.service';
import { UiStore } from 'src/app/store';
import { getTranslocoTestingProviders } from 'src/app/transloco-testing';
import type {
  MockNgbActiveModal,
  MockPlaylistThumbnailService,
} from 'src/app/models/test-mocks.model';

describe('PlaylistThumbnailModalComponent', () => {
  let component: PlaylistThumbnailModalComponent;
  let fixture: ComponentFixture<PlaylistThumbnailModalComponent>;
  let activeModalMock: MockNgbActiveModal;
  let uiStoreMock: { showError: ReturnType<typeof vi.fn> };
  let thumbnailServiceMock: MockPlaylistThumbnailService;

  beforeEach(async () => {
    activeModalMock = { close: vi.fn(), dismiss: vi.fn() };
    uiStoreMock = { showError: vi.fn() };
    thumbnailServiceMock = {
      uploadThumbnail: vi
        .fn()
        .mockReturnValue(
          of({ img_big: 'https://cdn.example.com/custom.jpg' })
        ) as MockPlaylistThumbnailService['uploadThumbnail'],
      resetThumbnail: vi
        .fn()
        .mockReturnValue(of({ img_big: '' })) as MockPlaylistThumbnailService['resetThumbnail'],
    };

    await TestBed.configureTestingModule({
      imports: [PlaylistThumbnailModalComponent],
      providers: [
        { provide: NgbActiveModal, useValue: activeModalMock },
        { provide: PlaylistThumbnailService, useValue: thumbnailServiceMock },
        { provide: UiStore, useValue: uiStoreMock },
        getTranslocoTestingProviders(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlaylistThumbnailModalComponent);
    component = fixture.componentInstance;
    component.idPlaylist = 'playlist-123';
    fixture.detectChanges();
  });

  it('should create and start on select step', () => {
    expect(component).toBeTruthy();
    expect(component.step()).toBe('select');
    expect(component.isLoading()).toBe(false);
  });

  describe('onFileSelected', () => {
    const makeFileEvent = (name: string, type: string, size: number): Event => {
      const file = new File([new Uint8Array(size)], name, { type });
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [file] });
      return { target: input } as unknown as Event;
    };

    it('should move to crop step on valid jpeg file', () => {
      const event = makeFileEvent('photo.jpg', 'image/jpeg', 100);
      component.onFileSelected(event);

      expect(component.step()).toBe('crop');
      expect(component.outputFormat()).toBe('jpeg');
      expect(component.gifWarning()).toBe(false);
      expect(component.imageChangedEvent()).toBe(event);
    });

    it('should move to crop step on valid png file', () => {
      const event = makeFileEvent('photo.png', 'image/png', 100);
      component.onFileSelected(event);

      expect(component.step()).toBe('crop');
      expect(component.outputFormat()).toBe('png');
    });

    it('should show gif warning for GIF files and output as jpeg', () => {
      const event = makeFileEvent('anim.gif', 'image/gif', 100);
      component.onFileSelected(event);

      expect(component.gifWarning()).toBe(true);
      expect(component.outputFormat()).toBe('jpeg');
      expect(component.step()).toBe('crop');
    });

    it('should reject files exceeding 10 MB', () => {
      const event = makeFileEvent('huge.jpg', 'image/jpeg', 11 * 1024 * 1024);
      component.onFileSelected(event);

      expect(component.step()).toBe('select');
      expect(uiStoreMock.showError).toHaveBeenCalledOnce();
    });

    it('should reject unsupported file formats', () => {
      const event = makeFileEvent('doc.pdf', 'application/pdf', 100);
      component.onFileSelected(event);

      expect(component.step()).toBe('select');
      expect(uiStoreMock.showError).toHaveBeenCalledOnce();
    });
  });

  describe('onImageCropped', () => {
    it('should store the cropped blob', () => {
      const mockBlob = new Blob(['data']);
      component.onImageCropped({
        blob: mockBlob,
      } as Partial<ImageCroppedEvent> as ImageCroppedEvent);

      expect(component.croppedBlob()).toBe(mockBlob);
    });

    it('should set blob to null when event blob is null', () => {
      component.onImageCropped({ blob: null } as Partial<ImageCroppedEvent> as ImageCroppedEvent);

      expect(component.croppedBlob()).toBeNull();
    });
  });

  describe('confirm', () => {
    it('should not call uploadThumbnail if no blob is set', () => {
      component.confirm();

      expect(thumbnailServiceMock.uploadThumbnail).not.toHaveBeenCalled();
    });

    it('should upload blob and close modal on success', () => {
      const mockBlob = new Blob(['data'], { type: 'image/jpeg' });
      component.onImageCropped({
        blob: mockBlob,
      } as Partial<ImageCroppedEvent> as ImageCroppedEvent);

      component.confirm();

      expect(thumbnailServiceMock.uploadThumbnail).toHaveBeenCalledWith(
        'playlist-123',
        mockBlob,
        'image/jpeg'
      );
      expect(activeModalMock.close).toHaveBeenCalledWith({
        img_big: 'https://cdn.example.com/custom.jpg',
      });
      expect(component.isLoading()).toBe(false);
    });

    it('should show error and reset loading on upload failure', () => {
      thumbnailServiceMock.uploadThumbnail.mockReturnValue(throwError(() => new Error('500')));
      const mockBlob = new Blob(['data'], { type: 'image/jpeg' });
      component.onImageCropped({
        blob: mockBlob,
      } as Partial<ImageCroppedEvent> as ImageCroppedEvent);

      component.confirm();

      expect(uiStoreMock.showError).toHaveBeenCalledOnce();
      expect(activeModalMock.close).not.toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });
  });
});
