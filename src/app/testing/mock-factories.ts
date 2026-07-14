/**
 * Typed mock factories for unit tests.
 *
 * Each factory builds its mock as a `Partial<RealService>` object literal:
 * if a method is renamed or removed on the real service, the literal stops
 * compiling — the drift that made the old `test-mocks.model.ts` interfaces
 * obsolete is caught at build time instead.
 *
 * Factories return bare `vi.fn()` mocks with no default return values;
 * configure them per test (`mock.method.mockReturnValue(...)`) in Arrange.
 */
import { vi, type MockedObject } from 'vitest';
import type { Router } from '@angular/router';
import type { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { GoogleAnalyticsService } from 'ngx-google-analytics';
import type { InitService } from '../services/init.service';
import type { PlayerService } from '../services/player.service';
import type { PlaylistThumbnailService } from '../services/playlist-thumbnail.service';
import type { UserLibraryService } from '../services/user-library.service';
import type { UserService } from '../services/user.service';

export function createPlayerServiceMock(): MockedObject<PlayerService> {
  const mock: Partial<PlayerService> = {
    lecture: vi.fn(),
    before: vi.fn(),
    after: vi.fn(),
    onPlayPause: vi.fn(),
    updateVolume: vi.fn(),
    toggleMute: vi.fn(),
    updatePositionSlider: vi.fn(),
    removeToPlaylist: vi.fn(),
    switchRepeat: vi.fn(),
    switchRandom: vi.fn(),
    removeVideoFromQueue: vi.fn(),
    addVideoInPlaylist: vi.fn(),
    addInCurrentList: vi.fn(),
    addVideoAfterCurrentInList: vi.fn(),
    runPlaylist: vi.fn(),
    clearErrorMessage: vi.fn(),
    ngOnDestroy: vi.fn(),
  };
  return mock as MockedObject<PlayerService>;
}

export function createUserServiceMock(): MockedObject<UserService> {
  const mock: Partial<UserService> = {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    resetPass: vi.fn(),
    sendResetPass: vi.fn(),
    editPass: vi.fn(),
    editMail: vi.fn(),
    editDarkMode: vi.fn(),
    editLanguage: vi.fn(),
    deleteAccount: vi.fn(),
    createPlaylist: vi.fn(),
    editTitlePlaylist: vi.fn(),
    associateGoogleAccount: vi.fn(),
  };
  return mock as MockedObject<UserService>;
}

export function createInitServiceMock(): MockedObject<InitService> {
  const mock: Partial<InitService> = {
    getPing: vi.fn(),
    onMessageUnlog: vi.fn(),
    checkSessionIfNeeded: vi.fn(),
    getHomeInit: vi.fn(),
  };
  return mock as MockedObject<InitService>;
}

export function createUserLibraryServiceMock(): MockedObject<UserLibraryService> {
  const mock: Partial<UserLibraryService> = {
    initializeFromLogin: vi.fn(),
    resetOnLogout: vi.fn(),
    addPlaylist: vi.fn(),
    updatePlaylistTitle: vi.fn(),
    togglePlaylistVisibility: vi.fn(),
    deletePlaylist: vi.fn(),
    toggleFollow: vi.fn(),
    removeFollow: vi.fn(),
    addLike: vi.fn(),
    removeLike: vi.fn(),
    isLiked: vi.fn(),
    addVideoToPlaylist: vi.fn(),
    removeVideoFromPlaylist: vi.fn(),
    renameTrack: vi.fn(),
    reorderPlaylistTracks: vi.fn(),
    reorderLikes: vi.fn(),
  };
  return mock as MockedObject<UserLibraryService>;
}

export function createPlaylistThumbnailServiceMock(): MockedObject<PlaylistThumbnailService> {
  const mock: Partial<PlaylistThumbnailService> = {
    uploadThumbnail: vi.fn(),
    resetThumbnail: vi.fn(),
  };
  return mock as MockedObject<PlaylistThumbnailService>;
}

export function createGoogleAnalyticsServiceMock(): MockedObject<GoogleAnalyticsService> {
  const mock: Partial<GoogleAnalyticsService> = {
    pageView: vi.fn(),
    event: vi.fn(),
    gtag: vi.fn(),
    exception: vi.fn(),
  };
  return mock as MockedObject<GoogleAnalyticsService>;
}

export function createRouterMock(): MockedObject<Router> {
  const mock: Partial<Router> = {
    navigate: vi.fn().mockResolvedValue(true),
    navigateByUrl: vi.fn().mockResolvedValue(true),
  };
  return mock as MockedObject<Router>;
}

export function createNgbModalMock(): MockedObject<NgbModal> {
  const mock: Partial<NgbModal> = {
    open: vi.fn(),
    dismissAll: vi.fn(),
  };
  return mock as MockedObject<NgbModal>;
}

export function createNgbActiveModalMock(): MockedObject<NgbActiveModal> {
  const mock: Partial<NgbActiveModal> = {
    close: vi.fn(),
    dismiss: vi.fn(),
  };
  return mock as MockedObject<NgbActiveModal>;
}
