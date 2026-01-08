import { computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { ModalType, Notification, initialUiState } from './ui.models';
import { VideoItem } from '../../models/video.model';
import { withSsrSafety } from '../features/with-ssr-safety';

/**
 * UiStore - Global UI state management
 *
 * Manages player expansion, modals, notifications and responsive state.
 */
export const UiStore = signalStore(
  { providedIn: 'root' },

  withState(initialUiState),
  withSsrSafety(),

  withComputed(state => ({
    hasActiveModal: computed(() => state.activeModal() !== null),
    hasNotifications: computed(() => state.notifications().length > 0),
    notificationCount: computed(() => state.notifications().length),
    latestNotification: computed(() => {
      const notifications = state.notifications();
      return notifications.length > 0 ? notifications[notifications.length - 1] : null;
    }),
  })),

  withMethods(store => ({
    expandPlayer(): void {
      patchState(store, { isPlayerExpanded: true });
    },

    collapsePlayer(): void {
      patchState(store, { isPlayerExpanded: false });
    },

    togglePlayer(): void {
      patchState(store, { isPlayerExpanded: !store.isPlayerExpanded() });
    },

    setMobile(isMobile: boolean): void {
      patchState(store, { isMobile });
    },

    openModal(modalType: ModalType): void {
      patchState(store, { activeModal: modalType });
    },

    closeModal(): void {
      patchState(store, {
        activeModal: null,
        addVideoData: null,
        editPlaylistId: null,
      });
    },

    openLoginModal(): void {
      patchState(store, { activeModal: 'login' });
    },

    openRegisterModal(): void {
      patchState(store, { activeModal: 'register' });
    },

    openAddVideoModal(videoData: VideoItem): void {
      patchState(store, {
        activeModal: 'addVideo',
        addVideoData: videoData,
      });
    },

    openEditPlaylistModal(playlistId: string): void {
      patchState(store, {
        activeModal: 'editPlaylist',
        editPlaylistId: playlistId,
      });
    },

    showNotification(notification: Omit<Notification, 'id'>): string {
      const id = crypto.randomUUID();
      const newNotification: Notification = { ...notification, id };

      patchState(store, {
        notifications: [...store.notifications(), newNotification],
      });

      if (notification.duration !== 0) {
        const duration = notification.duration ?? 5000;
        store.runInBrowser(() => {
          setTimeout(() => this.dismissNotification(id), duration);
        });
      }

      return id;
    },

    dismissNotification(id: string): void {
      patchState(store, {
        notifications: store.notifications().filter(n => n.id !== id),
      });
    },

    clearNotifications(): void {
      patchState(store, { notifications: [] });
    },

    showSessionExpired(): void {
      patchState(store, { showSessionExpiredMessage: true });
    },

    hideSessionExpired(): void {
      patchState(store, { showSessionExpiredMessage: false });
    },

    showSuccess(message: string, duration?: number): string {
      return this.showNotification({ message, type: 'success', duration });
    },

    showError(message: string, duration?: number): string {
      return this.showNotification({ message, type: 'error', duration });
    },

    showInfo(message: string, duration?: number): string {
      return this.showNotification({ message, type: 'info', duration });
    },

    reset(): void {
      patchState(store, initialUiState);
    },
  }))
);
