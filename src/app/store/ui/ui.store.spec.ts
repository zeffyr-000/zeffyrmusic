import { TestBed } from '@angular/core/testing';
import { UiStore } from './ui.store';
import { initialUiState } from './ui.models';
import { VideoItem } from '../../models/video.model';

describe('UiStore', () => {
  let store: InstanceType<typeof UiStore>;

  const mockVideoItem: VideoItem = {
    key: 'abc123',
    artist: 'Test Artist',
    title: 'Test Song',
    duration: 180,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(UiStore);
    store.reset();
  });

  describe('Initial State', () => {
    it('should have player collapsed initially', () => {
      expect(store.isPlayerExpanded()).toBe(false);
    });

    it('should not be mobile initially', () => {
      expect(store.isMobile()).toBe(false);
    });

    it('should have no active modal initially', () => {
      expect(store.activeModal()).toBeNull();
    });

    it('should have no notifications initially', () => {
      expect(store.notifications()).toEqual([]);
    });
  });

  describe('Computed Properties', () => {
    it('should compute hasActiveModal correctly', () => {
      expect(store.hasActiveModal()).toBe(false);
      store.openLoginModal();
      expect(store.hasActiveModal()).toBe(true);
    });

    it('should compute hasNotifications correctly', () => {
      expect(store.hasNotifications()).toBe(false);
      store.showNotification({ message: 'Test', type: 'info', duration: 0 });
      expect(store.hasNotifications()).toBe(true);
    });

    it('should compute notificationCount correctly', () => {
      expect(store.notificationCount()).toBe(0);
      store.showNotification({ message: 'Test 1', type: 'info', duration: 0 });
      store.showNotification({ message: 'Test 2', type: 'success', duration: 0 });
      expect(store.notificationCount()).toBe(2);
    });

    it('should compute latestNotification correctly', () => {
      expect(store.latestNotification()).toBeNull();
      store.showNotification({ message: 'First', type: 'info', duration: 0 });
      store.showNotification({ message: 'Second', type: 'success', duration: 0 });
      expect(store.latestNotification()?.message).toBe('Second');
    });
  });

  describe('Player', () => {
    it('should expand player', () => {
      store.expandPlayer();
      expect(store.isPlayerExpanded()).toBe(true);
    });

    it('should collapse player', () => {
      store.expandPlayer();
      store.collapsePlayer();
      expect(store.isPlayerExpanded()).toBe(false);
    });

    it('should toggle player', () => {
      expect(store.isPlayerExpanded()).toBe(false);
      store.togglePlayer();
      expect(store.isPlayerExpanded()).toBe(true);
      store.togglePlayer();
      expect(store.isPlayerExpanded()).toBe(false);
    });
  });

  describe('Mobile', () => {
    it('should set mobile state', () => {
      store.setMobile(true);
      expect(store.isMobile()).toBe(true);
      store.setMobile(false);
      expect(store.isMobile()).toBe(false);
    });
  });

  describe('Modals', () => {
    it('should open generic modal', () => {
      store.openModal('login');
      expect(store.activeModal()).toBe('login');
    });

    it('should close modal and reset data', () => {
      store.openAddVideoModal(mockVideoItem);
      expect(store.addVideoData()).toEqual(mockVideoItem);

      store.closeModal();
      expect(store.activeModal()).toBeNull();
      expect(store.addVideoData()).toBeNull();
    });

    it('should open login modal', () => {
      store.openLoginModal();
      expect(store.activeModal()).toBe('login');
    });

    it('should open register modal', () => {
      store.openRegisterModal();
      expect(store.activeModal()).toBe('register');
    });

    it('should open add video modal with data', () => {
      store.openAddVideoModal(mockVideoItem);
      expect(store.activeModal()).toBe('addVideo');
      expect(store.addVideoData()).toEqual(mockVideoItem);
    });

    it('should open edit playlist modal with id', () => {
      store.openEditPlaylistModal('playlist-123');
      expect(store.activeModal()).toBe('editPlaylist');
      expect(store.editPlaylistId()).toBe('playlist-123');
    });
  });

  describe('Notifications', () => {
    it('should show notification and return id', () => {
      const id = store.showNotification({ message: 'Test', type: 'info', duration: 0 });
      expect(id).toBeTruthy();
      expect(store.notifications()).toHaveLength(1);
      expect(store.notifications()[0].message).toBe('Test');
    });

    it('should dismiss notification by id', () => {
      const id = store.showNotification({ message: 'Test', type: 'info', duration: 0 });
      store.dismissNotification(id);
      expect(store.notifications()).toHaveLength(0);
    });

    it('should clear all notifications', () => {
      store.showNotification({ message: 'Test 1', type: 'info', duration: 0 });
      store.showNotification({ message: 'Test 2', type: 'success', duration: 0 });
      store.clearNotifications();
      expect(store.notifications()).toHaveLength(0);
    });

    it('should show success notification', () => {
      store.showSuccess('Success message', 0);
      expect(store.notifications()[0].type).toBe('success');
    });

    it('should show error notification', () => {
      store.showError('Error message', 0);
      expect(store.notifications()[0].type).toBe('error');
    });

    it('should show info notification', () => {
      store.showInfo('Info message', 0);
      expect(store.notifications()[0].type).toBe('info');
    });

    it('should auto-dismiss notification after duration', async () => {
      vi.useFakeTimers();

      store.showNotification({ message: 'Auto dismiss', type: 'info', duration: 1000 });
      expect(store.notifications()).toHaveLength(1);

      await vi.advanceTimersByTimeAsync(1000);
      expect(store.notifications()).toHaveLength(0);

      vi.useRealTimers();
    });
  });

  describe('Reset', () => {
    it('should reset to initial state', () => {
      store.expandPlayer();
      store.setMobile(true);
      store.openLoginModal();
      store.showNotification({ message: 'Test', type: 'info', duration: 0 });

      store.reset();

      expect(store.isPlayerExpanded()).toBe(initialUiState.isPlayerExpanded);
      expect(store.isMobile()).toBe(initialUiState.isMobile);
      expect(store.activeModal()).toBe(initialUiState.activeModal);
      expect(store.notifications()).toEqual(initialUiState.notifications);
    });
  });
});
