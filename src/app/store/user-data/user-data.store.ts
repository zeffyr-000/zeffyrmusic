import { computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { initialUserDataState } from './user-data.models';
import { UserPlaylist } from '../../models/playlist.model';
import { FollowItem } from '../../models/follow.model';
import { UserVideo, Video } from '../../models/video.model';
import { withSsrSafety } from '../features/with-ssr-safety';

/**
 * UserDataStore - User library data management
 *
 * Manages playlists, followed playlists and liked videos.
 */
export const UserDataStore = signalStore(
  { providedIn: 'root' },

  withState(initialUserDataState),
  withSsrSafety(),

  withComputed(state => ({
    hasPlaylists: computed(() => state.playlists().length > 0),
    hasFollows: computed(() => state.follows().length > 0),
    hasLikedVideos: computed(() => state.likedVideos().length > 0),
    playlistCount: computed(() => state.playlists().length),
    followCount: computed(() => state.follows().length),
    likedVideoCount: computed(() => state.likedVideos().length),
    publicPlaylists: computed(() => state.playlists().filter(p => !p.prive)),
    privatePlaylists: computed(() => state.playlists().filter(p => p.prive)),
  })),

  withMethods(store => ({
    initialize(data: {
      playlists: UserPlaylist[];
      follows: FollowItem[];
      likedVideos: UserVideo[];
      initialVideos?: Video[];
      initialTabIndex?: number[];
    }): void {
      patchState(store, {
        playlists: data.playlists ?? [],
        follows: data.follows ?? [],
        likedVideos: data.likedVideos ?? [],
        initialVideos: data.initialVideos ?? [],
        initialTabIndex: data.initialTabIndex ?? [],
        loading: false,
        error: null,
      });
    },

    reset(): void {
      patchState(store, initialUserDataState);
    },

    setPlaylists(playlists: UserPlaylist[]): void {
      patchState(store, { playlists });
    },

    addPlaylist(playlist: UserPlaylist): void {
      patchState(store, {
        playlists: [playlist, ...store.playlists()],
      });
    },

    removePlaylist(idPlaylist: string): void {
      patchState(store, {
        playlists: store.playlists().filter(p => p.id_playlist !== idPlaylist),
      });
    },

    updatePlaylistTitle(idPlaylist: string, titre: string): void {
      patchState(store, {
        playlists: store.playlists().map(p => (p.id_playlist === idPlaylist ? { ...p, titre } : p)),
      });
    },

    togglePlaylistVisibility(idPlaylist: string, prive: boolean): void {
      patchState(store, {
        playlists: store.playlists().map(p => (p.id_playlist === idPlaylist ? { ...p, prive } : p)),
      });
    },

    setFollows(follows: FollowItem[]): void {
      patchState(store, { follows });
    },

    addFollow(follow: FollowItem): void {
      patchState(store, {
        follows: [follow, ...store.follows()],
      });
    },

    removeFollow(idPlaylist: string): void {
      patchState(store, {
        follows: store.follows().filter(f => f.id_playlist !== idPlaylist),
      });
    },

    isFollowing(idPlaylist: string): boolean {
      return store.follows().some(f => f.id_playlist === idPlaylist);
    },

    setLikedVideos(likedVideos: UserVideo[]): void {
      patchState(store, { likedVideos });
    },

    likeVideo(video: UserVideo): void {
      if (!store.likedVideos().some(v => v.key === video.key)) {
        patchState(store, {
          likedVideos: [video, ...store.likedVideos()],
        });
      }
    },

    unlikeVideo(key: string): void {
      patchState(store, {
        likedVideos: store.likedVideos().filter(v => v.key !== key),
      });
    },

    isLiked(key: string): boolean {
      return store.likedVideos().some(v => v.key === key);
    },

    getLikedVideo(key: string): UserVideo | undefined {
      return store.likedVideos().find(v => v.key === key);
    },

    reorderLikedVideos(reorderedVideos: UserVideo[]): void {
      patchState(store, { likedVideos: reorderedVideos });
    },

    setInitialData(videos: Video[], tabIndex: number[]): void {
      patchState(store, {
        initialVideos: videos,
        initialTabIndex: tabIndex,
      });
    },

    setLoading(loading: boolean): void {
      patchState(store, { loading });
    },

    setError(error: string | null): void {
      patchState(store, { error, loading: false });
    },

    clearError(): void {
      patchState(store, { error: null });
    },
  }))
);
