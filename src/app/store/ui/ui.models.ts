/**
 * UI Store Models
 * Interface state: modals, mobile, notifications
 */

import { VideoItem } from '../../models/video.model';

export type ModalType = 'login' | 'register' | 'addVideo' | 'resetPass' | 'editPlaylist' | null;

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface UiState {
  isPlayerExpanded: boolean;
  isMobile: boolean;
  activeModal: ModalType;
  addVideoData: VideoItem | null;
  editPlaylistId: string | null;
  notifications: Notification[];
  videoAddedToPlaylistId: { id: string; ts: number } | null;
  isLyricsPanelOpen: boolean;
  isLyricsPanelClosing: boolean;
}

export const initialUiState: UiState = {
  isPlayerExpanded: false,
  isMobile: false,
  activeModal: null,
  addVideoData: null,
  editPlaylistId: null,
  notifications: [],
  videoAddedToPlaylistId: null,
  isLyricsPanelOpen: false,
  isLyricsPanelClosing: false,
};
