import { describe, it, expect, vi, beforeEach, afterEach, type MockedObject } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PLATFORM_ID } from '@angular/core';
import { ExportPlaylistModalComponent } from './export-playlist-modal.component';
import { UiStore } from '../../store/ui/ui.store';
import { getTranslocoTestingProviders } from '../../transloco-testing';
import { Video } from '../../models/video.model';

function makeVideo(overrides: Partial<Video> = {}): Video {
  return {
    id_video: '1',
    artiste: 'Test Artist',
    artists: [],
    duree: '180',
    id_playlist: 'p1',
    key: 'testkey',
    ordre: '1',
    titre: 'Test Song',
    titre_album: '',
    ...overrides,
  };
}

describe('ExportPlaylistModalComponent', () => {
  let component: ExportPlaylistModalComponent;
  let fixture: ComponentFixture<ExportPlaylistModalComponent>;
  let activeModalMock: MockedObject<NgbActiveModal>;
  let uiStoreMock: MockedObject<Pick<InstanceType<typeof UiStore>, 'showSuccess' | 'showError'>>;
  const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

  afterEach(() => {
    if (originalClipboardDescriptor) {
      Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor);
    } else {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    }
  });

  beforeEach(async () => {
    activeModalMock = {
      close: vi.fn(),
      dismiss: vi.fn(),
    } as unknown as MockedObject<NgbActiveModal>;

    uiStoreMock = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    } as unknown as MockedObject<Pick<InstanceType<typeof UiStore>, 'showSuccess' | 'showError'>>;

    await TestBed.configureTestingModule({
      imports: [ExportPlaylistModalComponent],
      providers: [
        { provide: NgbActiveModal, useValue: activeModalMock },
        { provide: UiStore, useValue: uiStoreMock },
        getTranslocoTestingProviders(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportPlaylistModalComponent);
    component = fixture.componentInstance;
    component.tracks.set([makeVideo(), makeVideo({ titre: 'Song 2', key: 'key2' })]);
    component.playlistTitle.set('My Playlist');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should copy text to clipboard and show success toast', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    component.copyToClipboard();
    await vi.waitFor(() => expect(writeTextMock).toHaveBeenCalled());

    expect(writeTextMock).toHaveBeenCalledWith('Test Artist - Test Song\nTest Artist - Song 2');
    expect(component.copied()).toBe(true);
    expect(uiStoreMock.showSuccess).toHaveBeenCalled();
    expect(activeModalMock.close).not.toHaveBeenCalled();
  });

  it('should show error toast when clipboard fails', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    component.copyToClipboard();
    await vi.waitFor(() => expect(uiStoreMock.showError).toHaveBeenCalled());

    expect(component.copied()).toBe(false);
    expect(uiStoreMock.showSuccess).not.toHaveBeenCalled();
  });

  it('should show error toast when clipboard API is unavailable', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });

    component.copyToClipboard();

    expect(uiStoreMock.showError).toHaveBeenCalled();
    expect(component.copied()).toBe(false);
  });

  it('should download CSV and revoke URL asynchronously', () => {
    vi.useFakeTimers();
    const clickMock = vi.fn();
    const anchor = { href: '', download: '', click: clickMock };
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(anchor as unknown as HTMLAnchorElement);
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

    component.downloadCsv();

    expect(clickMock).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).not.toHaveBeenCalled();

    vi.runAllTimers();

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test');
    expect(uiStoreMock.showSuccess).toHaveBeenCalled();
    expect(activeModalMock.close).not.toHaveBeenCalled();

    createElementSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    vi.useRealTimers();
  });

  describe('SSR safety', () => {
    let serverComponent: ExportPlaylistModalComponent;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ExportPlaylistModalComponent],
        providers: [
          { provide: NgbActiveModal, useValue: activeModalMock },
          { provide: UiStore, useValue: uiStoreMock },
          { provide: PLATFORM_ID, useValue: 'server' },
          getTranslocoTestingProviders(),
        ],
      }).compileComponents();
      const serverFixture = TestBed.createComponent(ExportPlaylistModalComponent);
      serverComponent = serverFixture.componentInstance;
      serverComponent.tracks.set([makeVideo()]);
    });

    it('should not copy to clipboard on server', () => {
      serverComponent.copyToClipboard();
      expect(uiStoreMock.showSuccess).not.toHaveBeenCalled();
    });

    it('should not download CSV on server', () => {
      serverComponent.downloadCsv();
      expect(uiStoreMock.showSuccess).not.toHaveBeenCalled();
    });
  });
});
