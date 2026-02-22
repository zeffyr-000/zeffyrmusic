import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PlayerService } from '../services/player.service';
import { UserLibraryService } from '../services/user-library.service';
import { ControlBarComponent } from './control-bar.component';
import { getTranslocoTestingProviders } from '../transloco-testing';
import type { MockPlayerService, MockUserLibraryService } from '../models/test-mocks.model';
import type { Video } from '../models/video.model';

describe('ControlBarComponent', () => {
  let component: ControlBarComponent;
  let fixture: ComponentFixture<ControlBarComponent>;
  let playerService: PlayerService;
  let playerServiceMock: Partial<MockPlayerService>;
  let userLibraryServiceMock: Pick<MockUserLibraryService, 'isLiked' | 'addLike' | 'removeLike'>;

  beforeEach(async () => {
    playerServiceMock = {
      switchRepeat: vi.fn(),
      switchRandom: vi.fn(),
      updatePositionSlider: vi.fn(),
      updateVolume: vi.fn(),
      onPlayPause: vi.fn(),
      before: vi.fn(),
      after: vi.fn(),
      toggleMute: vi.fn(),
    };
    userLibraryServiceMock = {
      isLiked: vi.fn<(key: string) => boolean>().mockReturnValue(false),
      addLike: vi.fn<(key: string) => Observable<boolean>>().mockReturnValue(of(true)),
      removeLike: vi.fn<(key: string) => Observable<boolean>>().mockReturnValue(of(true)),
    };

    await TestBed.configureTestingModule({
      imports: [ControlBarComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: PlayerService, useValue: playerServiceMock },
        { provide: UserLibraryService, useValue: userLibraryServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ControlBarComponent);
    component = fixture.componentInstance;
    playerService = TestBed.inject(PlayerService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Computed signals', () => {
    const mockVideo = { key: 'xyz789', titre: 'Song Title', artiste: 'Artist Name' } as Video;

    it('should return null thumbnailUrl when no currentKey', () => {
      expect(component.thumbnailUrl()).toBeNull();
    });

    it('should return thumbnail URL when currentKey exists', () => {
      component.queueStore.setQueue([mockVideo], null);
      expect(component.thumbnailUrl()).toBe('https://img.youtube.com/vi/xyz789/mqdefault.jpg');
    });

    it('should return currentTitle from currentVideo', () => {
      component.queueStore.setQueue([mockVideo], null);
      expect(component.currentTitle()).toBe('Song Title');
    });

    it('should return currentArtist from currentVideo', () => {
      component.queueStore.setQueue([mockVideo], null);
      expect(component.currentArtist()).toBe('Artist Name');
    });

    it('should return empty strings when no currentVideo', () => {
      expect(component.currentTitle()).toBe('');
      expect(component.currentArtist()).toBe('');
    });
  });

  describe('Transport actions', () => {
    it('should call playerService.onPlayPause when onPlayPause is called', () => {
      component.onPlayPause();
      expect(playerService.onPlayPause).toHaveBeenCalled();
    });

    it('should call playerService.before when onBefore is called', () => {
      component.onBefore();
      expect(playerService.before).toHaveBeenCalled();
    });

    it('should call playerService.after when onAfter is called', () => {
      component.onAfter();
      expect(playerService.after).toHaveBeenCalled();
    });

    it('should call playerService.switchRepeat when repeat is called', () => {
      component.repeat();
      expect(playerService.switchRepeat).toHaveBeenCalled();
    });

    it('should call playerService.switchRandom when random is called', () => {
      component.random();
      expect(playerService.switchRandom).toHaveBeenCalled();
    });

    it('should call requestFullscreen when goFullscreen is called', () => {
      const element = { requestFullscreen: vi.fn() };
      const getElementByIdSpy = vi
        .spyOn(document, 'getElementById')
        .mockReturnValue(element as unknown as HTMLElement);

      component.goFullscreen('testId');

      expect(document.getElementById).toHaveBeenCalledWith('testId');
      expect(element.requestFullscreen).toHaveBeenCalled();

      getElementByIdSpy.mockRestore();
    });
  });

  describe('Expand/Collapse', () => {
    it('should expand player', () => {
      component.expandPlayer();
      expect(component.isPlayerExpanded()).toBe(true);
    });

    it('should collapse player', () => {
      component.isPlayerExpanded.set(true);
      component.collapsePlayer();
      expect(component.isPlayerExpanded()).toBe(false);
    });
  });

  describe('Slider controls', () => {
    it('should update drag state on player slider input', () => {
      const event = { target: { value: '50' } } as unknown as Event;
      component.onPlayerSliderInput(event);
      expect(component.isDraggingPlayer()).toBe(true);
      expect(component.dragProgress()).toBe(50);
    });

    it('should commit seek and clear drag state on player slider change', () => {
      const seekSpy = vi.spyOn(component.playerStore, 'seekToPercent');
      const event = { target: { value: '75' } } as unknown as Event;
      component.onPlayerSliderChange(event);
      expect(playerService.updatePositionSlider).toHaveBeenCalledWith(0.75);
      expect(seekSpy).toHaveBeenCalledWith(75);
      expect(component.isDraggingPlayer()).toBe(false);
    });

    it('should use drag progress when dragging player slider', () => {
      component.isDraggingPlayer.set(true);
      component.dragProgress.set(42);
      expect(component.displayProgress()).toBe(42);
    });

    it('should use store progress when not dragging', () => {
      component.isDraggingPlayer.set(false);
      expect(component.displayProgress()).toBe(component.playerStore.progress());
    });

    it('should call playerService.updateVolume on volume input', () => {
      const event = { target: { value: '80' } } as unknown as Event;
      component.onVolumeInput(event);
      expect(playerService.updateVolume).toHaveBeenCalledWith(80);
    });

    it('should call playerService.toggleMute on toggleMute', () => {
      component.toggleMute();
      expect(playerService.toggleMute).toHaveBeenCalled();
    });
  });

  describe('toggleLike', () => {
    const mockVideo = { key: 'abc123', titre: 'Test', artiste: 'Artist' } as Video;

    it('should call addLike when track is not liked', () => {
      component.queueStore.setQueue([mockVideo], null);
      userLibraryServiceMock.isLiked.mockReturnValue(false);
      const event = { stopPropagation: vi.fn() } as unknown as Event;

      component.toggleLike(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(userLibraryServiceMock.addLike).toHaveBeenCalledWith('abc123');
    });

    it('should call removeLike when track is liked', () => {
      component.queueStore.setQueue([mockVideo], null);
      userLibraryServiceMock.isLiked.mockReturnValue(true);
      const event = { stopPropagation: vi.fn() } as unknown as Event;

      component.toggleLike(event);

      expect(userLibraryServiceMock.removeLike).toHaveBeenCalledWith('abc123');
    });

    it('should not call service when no currentKey', () => {
      const event = { stopPropagation: vi.fn() } as unknown as Event;

      component.toggleLike(event);

      expect(userLibraryServiceMock.addLike).not.toHaveBeenCalled();
      expect(userLibraryServiceMock.removeLike).not.toHaveBeenCalled();
    });
  });

  describe('volumeIcon', () => {
    it('should return volume_off when volume is 0', () => {
      component.playerStore.setVolume(0);
      expect(component.volumeIcon()).toBe('volume_off');
    });

    it('should return volume_down when volume is below 50', () => {
      component.playerStore.setVolume(30);
      expect(component.volumeIcon()).toBe('volume_down');
    });

    it('should return volume_up when volume is 50 or above', () => {
      component.playerStore.setVolume(80);
      expect(component.volumeIcon()).toBe('volume_up');
    });
  });

  describe('currentKeyArr', () => {
    const mockVideo = { key: 'track-a', titre: 'Track A', artiste: 'Artist' } as Video;
    const mockVideo2 = { key: 'track-b', titre: 'Track B', artiste: 'Artist' } as Video;

    it('should contain exactly one element', () => {
      component.queueStore.setQueue([mockVideo], null);
      expect(component.currentKeyArr()).toHaveLength(1);
    });

    it('should contain the current key', () => {
      component.queueStore.setQueue([mockVideo], null);
      expect(component.currentKeyArr()[0]).toBe('track-a');
    });

    it('should update when the track key changes', () => {
      component.queueStore.setQueue([mockVideo], null);
      const arr1 = component.currentKeyArr();
      component.queueStore.setQueue([mockVideo2], null);
      const arr2 = component.currentKeyArr();
      expect(arr2[0]).toBe('track-b');
      expect(arr1).not.toBe(arr2);
    });

    it('should maintain referential stability when key has not changed', () => {
      component.queueStore.setQueue([mockVideo], null);
      const arr1 = component.currentKeyArr();
      const arr2 = component.currentKeyArr();
      expect(arr1).toBe(arr2);
    });
  });

  describe('Animation tick (cbAnimA)', () => {
    const mockVideo = { key: 'track-a', titre: 'Track A', artiste: 'Artist' } as Video;
    const mockVideo2 = { key: 'track-b', titre: 'Track B', artiste: 'Artist' } as Video;

    it('should alternate cbAnimA between true and false on each track change', () => {
      const initial = component.cbAnimA();
      component.queueStore.setQueue([mockVideo], null);
      fixture.detectChanges();
      const after1 = component.cbAnimA();
      expect(after1).toBe(!initial);
      component.queueStore.setQueue([mockVideo2], null);
      fixture.detectChanges();
      expect(component.cbAnimA()).toBe(initial);
    });

    it('should not change cbAnimA when key stays the same', () => {
      component.queueStore.setQueue([mockVideo], null);
      fixture.detectChanges();
      const before = component.cbAnimA();
      fixture.detectChanges();
      expect(component.cbAnimA()).toBe(before);
    });
  });
});
