import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { KeyboardShortcutService } from './keyboard-shortcut.service';
import { PlayerService } from './player.service';
import { PlayerStore } from '../store/player/player.store';
import { UiStore } from '../store/ui/ui.store';
import { YoutubePlayerService } from './youtube-player.service';
import { signal } from '@angular/core';

describe('KeyboardShortcutService', () => {
  let service: KeyboardShortcutService;
  let doc: Document;
  let playerServiceMock: {
    onPlayPause: ReturnType<typeof vi.fn>;
    updateVolume: ReturnType<typeof vi.fn>;
  };
  let playerStoreMock: {
    toggleMute: ReturnType<typeof vi.fn>;
    seekTo: ReturnType<typeof vi.fn>;
    volume: ReturnType<typeof signal>;
  };
  let uiStoreMock: {
    isPlayerExpanded: ReturnType<typeof signal>;
    hasActiveModal: ReturnType<typeof signal>;
    collapsePlayer: ReturnType<typeof vi.fn>;
    closeModal: ReturnType<typeof vi.fn>;
  };
  let youtubePlayerMock: {
    getCurrentTime: ReturnType<typeof vi.fn>;
    getDuration: ReturnType<typeof vi.fn>;
    seekTo: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    playerServiceMock = {
      onPlayPause: vi.fn(),
      updateVolume: vi.fn(),
    };
    playerStoreMock = {
      toggleMute: vi.fn(),
      seekTo: vi.fn(),
      volume: signal(50),
    };
    uiStoreMock = {
      isPlayerExpanded: signal(false),
      hasActiveModal: signal(false),
      collapsePlayer: vi.fn(),
      closeModal: vi.fn(),
    };
    youtubePlayerMock = {
      getCurrentTime: vi.fn().mockReturnValue(30),
      getDuration: vi.fn().mockReturnValue(200),
      seekTo: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        KeyboardShortcutService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: PlayerService, useValue: playerServiceMock },
        { provide: PlayerStore, useValue: playerStoreMock },
        { provide: UiStore, useValue: uiStoreMock },
        { provide: YoutubePlayerService, useValue: youtubePlayerMock },
      ],
    });

    doc = TestBed.inject(DOCUMENT);
    service = TestBed.inject(KeyboardShortcutService);
    service.initialize();
  });

  function dispatchKey(key: string, target?: HTMLElement): void {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    if (target) {
      Object.defineProperty(event, 'target', { value: target });
    }
    doc.dispatchEvent(event);
  }

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle play/pause on Space', () => {
    dispatchKey(' ');
    expect(playerServiceMock.onPlayPause).toHaveBeenCalled();
  });

  it('should seek backward on ArrowLeft', () => {
    dispatchKey('ArrowLeft');
    expect(youtubePlayerMock.seekTo).toHaveBeenCalledWith(25);
    expect(playerStoreMock.seekTo).toHaveBeenCalledWith(25);
  });

  it('should seek forward on ArrowRight', () => {
    dispatchKey('ArrowRight');
    expect(youtubePlayerMock.seekTo).toHaveBeenCalledWith(35);
    expect(playerStoreMock.seekTo).toHaveBeenCalledWith(35);
  });

  it('should increase volume on ArrowUp', () => {
    dispatchKey('ArrowUp');
    expect(playerServiceMock.updateVolume).toHaveBeenCalledWith(55);
  });

  it('should decrease volume on ArrowDown', () => {
    dispatchKey('ArrowDown');
    expect(playerServiceMock.updateVolume).toHaveBeenCalledWith(45);
  });

  it('should toggle mute on M', () => {
    dispatchKey('m');
    expect(playerStoreMock.toggleMute).toHaveBeenCalled();
  });

  it('should collapse expanded player on Escape', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (uiStoreMock.isPlayerExpanded as any).set(true);
    dispatchKey('Escape');
    expect(uiStoreMock.collapsePlayer).toHaveBeenCalled();
  });

  it('should not trigger shortcuts when typing in an input', () => {
    const input = doc.createElement('input');
    dispatchKey(' ', input);
    expect(playerServiceMock.onPlayPause).not.toHaveBeenCalled();
  });

  it('should clamp seek to 0 when near start', () => {
    youtubePlayerMock.getCurrentTime.mockReturnValue(2);
    dispatchKey('ArrowLeft');
    expect(youtubePlayerMock.seekTo).toHaveBeenCalledWith(0);
  });

  it('should clamp volume to 100 at max', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (playerStoreMock.volume as any).set(98);
    dispatchKey('ArrowUp');
    expect(playerServiceMock.updateVolume).toHaveBeenCalledWith(100);
  });
});
