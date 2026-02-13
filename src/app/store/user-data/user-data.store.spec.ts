import { TestBed } from '@angular/core/testing';
import { UserDataStore } from './user-data.store';
import { UserPlaylist } from '../../models/playlist.model';
import { FollowItem } from '../../models/follow.model';
import { UserVideo, Video } from '../../models/video.model';
import { initialUserDataState } from './user-data.models';

describe('UserDataStore', () => {
  let store: InstanceType<typeof UserDataStore>;

  // Test data
  const mockPlaylist: UserPlaylist = {
    id_playlist: 'playlist-1',
    titre: 'My Playlist',
    prive: false,
  };

  const mockPlaylist2: UserPlaylist = {
    id_playlist: 'playlist-2',
    titre: 'Private Playlist',
    prive: true,
  };

  const mockFollow: FollowItem = {
    id_playlist: 'follow-1',
    titre: 'Rock Hits',
    artiste: 'Various Artists',
    url_image: 'https://example.com/image.jpg',
  };

  const mockFollow2: FollowItem = {
    id_playlist: 'follow-2',
    titre: 'Jazz Collection',
  };

  const mockLikedVideo: UserVideo = {
    id: 'video-1',
    key: 'abc123',
    titre: 'Great Song',
    duree: '3:45',
    artiste: 'Artist Name',
  };

  const mockLikedVideo2: UserVideo = {
    id: 'video-2',
    key: 'def456',
    titre: 'Another Song',
    duree: '4:20',
    artiste: 'Another Artist',
  };

  const mockVideo: Video = {
    id_video: 'vid-1',
    artiste: 'Artist',
    artists: [],
    duree: '3:30',
    id_playlist: 'playlist-1',
    key: 'xyz789',
    ordre: '1',
    titre: 'Video Title',
    titre_album: 'Album',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(UserDataStore);
    // Reset state before each test
    store.reset();
  });

  describe('Initial State', () => {
    it('should have empty playlists initially', () => {
      expect(store.playlists()).toEqual([]);
    });

    it('should have empty follows initially', () => {
      expect(store.follows()).toEqual([]);
    });

    it('should have empty liked videos initially', () => {
      expect(store.likedVideos()).toEqual([]);
    });

    it('should not be loading initially', () => {
      expect(store.loading()).toBe(false);
    });

    it('should have no error initially', () => {
      expect(store.error()).toBeNull();
    });
  });

  describe('Computed Properties', () => {
    it('should compute hasPlaylists correctly', () => {
      expect(store.hasPlaylists()).toBe(false);
      store.addPlaylist(mockPlaylist);
      expect(store.hasPlaylists()).toBe(true);
    });

    it('should compute hasFollows correctly', () => {
      expect(store.hasFollows()).toBe(false);
      store.addFollow(mockFollow);
      expect(store.hasFollows()).toBe(true);
    });

    it('should compute hasLikedVideos correctly', () => {
      expect(store.hasLikedVideos()).toBe(false);
      store.likeVideo(mockLikedVideo);
      expect(store.hasLikedVideos()).toBe(true);
    });

    it('should compute playlistCount correctly', () => {
      expect(store.playlistCount()).toBe(0);
      store.addPlaylist(mockPlaylist);
      store.addPlaylist(mockPlaylist2);
      expect(store.playlistCount()).toBe(2);
    });

    it('should compute followCount correctly', () => {
      expect(store.followCount()).toBe(0);
      store.addFollow(mockFollow);
      store.addFollow(mockFollow2);
      expect(store.followCount()).toBe(2);
    });

    it('should compute likedVideoCount correctly', () => {
      expect(store.likedVideoCount()).toBe(0);
      store.likeVideo(mockLikedVideo);
      store.likeVideo(mockLikedVideo2);
      expect(store.likedVideoCount()).toBe(2);
    });

    it('should filter public playlists', () => {
      store.addPlaylist(mockPlaylist); // public
      store.addPlaylist(mockPlaylist2); // private
      expect(store.publicPlaylists()).toHaveLength(1);
      expect(store.publicPlaylists()[0].id_playlist).toBe('playlist-1');
    });

    it('should filter private playlists', () => {
      store.addPlaylist(mockPlaylist); // public
      store.addPlaylist(mockPlaylist2); // private
      expect(store.privatePlaylists()).toHaveLength(1);
      expect(store.privatePlaylists()[0].id_playlist).toBe('playlist-2');
    });
  });

  describe('Initialization', () => {
    it('should initialize with all data', () => {
      store.initialize({
        playlists: [mockPlaylist, mockPlaylist2],
        follows: [mockFollow],
        likedVideos: [mockLikedVideo],
        initialVideos: [mockVideo],
        initialTabIndex: [0, 1, 2],
      });

      expect(store.playlists()).toHaveLength(2);
      expect(store.follows()).toHaveLength(1);
      expect(store.likedVideos()).toHaveLength(1);
      expect(store.initialVideos()).toHaveLength(1);
      expect(store.initialTabIndex()).toEqual([0, 1, 2]);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should handle partial initialization', () => {
      store.initialize({
        playlists: [mockPlaylist],
        follows: [],
        likedVideos: [],
      });

      expect(store.playlists()).toHaveLength(1);
      expect(store.follows()).toHaveLength(0);
      expect(store.likedVideos()).toHaveLength(0);
    });

    it('should reset all data', () => {
      store.initialize({
        playlists: [mockPlaylist],
        follows: [mockFollow],
        likedVideos: [mockLikedVideo],
      });

      store.reset();

      expect(store.playlists()).toEqual(initialUserDataState.playlists);
      expect(store.follows()).toEqual(initialUserDataState.follows);
      expect(store.likedVideos()).toEqual(initialUserDataState.likedVideos);
    });
  });

  describe('Playlists', () => {
    it('should add a playlist at the beginning', () => {
      store.addPlaylist(mockPlaylist);
      store.addPlaylist(mockPlaylist2);

      expect(store.playlists()).toHaveLength(2);
      expect(store.playlists()[0].id_playlist).toBe('playlist-2');
    });

    it('should remove a playlist by ID', () => {
      store.addPlaylist(mockPlaylist);
      store.addPlaylist(mockPlaylist2);
      store.removePlaylist('playlist-1');

      expect(store.playlists()).toHaveLength(1);
      expect(store.playlists()[0].id_playlist).toBe('playlist-2');
    });

    it('should update playlist title', () => {
      store.addPlaylist(mockPlaylist);
      store.updatePlaylistTitle('playlist-1', 'New Title');

      expect(store.playlists()[0].titre).toBe('New Title');
    });

    it('should toggle playlist visibility', () => {
      store.addPlaylist(mockPlaylist);
      expect(store.playlists()[0].prive).toBe(false);

      store.togglePlaylistVisibility('playlist-1', true);
      expect(store.playlists()[0].prive).toBe(true);

      store.togglePlaylistVisibility('playlist-1', false);
      expect(store.playlists()[0].prive).toBe(false);
    });

    it('should set all playlists', () => {
      store.setPlaylists([mockPlaylist, mockPlaylist2]);

      expect(store.playlists()).toHaveLength(2);
    });
  });

  describe('Follows', () => {
    it('should add a follow at the beginning', () => {
      store.addFollow(mockFollow);
      store.addFollow(mockFollow2);

      expect(store.follows()).toHaveLength(2);
      expect(store.follows()[0].id_playlist).toBe('follow-2');
    });

    it('should remove a follow by playlist ID', () => {
      store.addFollow(mockFollow);
      store.addFollow(mockFollow2);
      store.removeFollow('follow-1');

      expect(store.follows()).toHaveLength(1);
      expect(store.follows()[0].id_playlist).toBe('follow-2');
    });

    it('should check if playlist is followed', () => {
      store.addFollow(mockFollow);

      expect(store.isFollowing('follow-1')).toBe(true);
      expect(store.isFollowing('non-existent')).toBe(false);
    });

    it('should set all follows', () => {
      store.setFollows([mockFollow, mockFollow2]);

      expect(store.follows()).toHaveLength(2);
    });
  });

  describe('Liked Videos', () => {
    it('should add a liked video at the beginning', () => {
      store.likeVideo(mockLikedVideo);
      store.likeVideo(mockLikedVideo2);

      expect(store.likedVideos()).toHaveLength(2);
      expect(store.likedVideos()[0].key).toBe('def456');
    });

    it('should not add duplicate liked video', () => {
      store.likeVideo(mockLikedVideo);
      store.likeVideo(mockLikedVideo); // Try to add same video again

      expect(store.likedVideos()).toHaveLength(1);
    });

    it('should remove a liked video by key', () => {
      store.likeVideo(mockLikedVideo);
      store.likeVideo(mockLikedVideo2);
      store.unlikeVideo('abc123');

      expect(store.likedVideos()).toHaveLength(1);
      expect(store.likedVideos()[0].key).toBe('def456');
    });

    it('should check if video is liked', () => {
      store.likeVideo(mockLikedVideo);

      expect(store.isLiked('abc123')).toBe(true);
      expect(store.isLiked('non-existent')).toBe(false);
    });

    it('should get a liked video by key', () => {
      store.likeVideo(mockLikedVideo);

      const video = store.getLikedVideo('abc123');
      expect(video).toBeDefined();
      expect(video?.titre).toBe('Great Song');

      const notFound = store.getLikedVideo('non-existent');
      expect(notFound).toBeUndefined();
    });

    it('should set all liked videos', () => {
      store.setLikedVideos([mockLikedVideo, mockLikedVideo2]);

      expect(store.likedVideos()).toHaveLength(2);
    });

    it('should reorder liked videos', () => {
      store.setLikedVideos([mockLikedVideo, mockLikedVideo2]);

      const reversed = [mockLikedVideo2, mockLikedVideo];
      store.reorderLikedVideos(reversed);

      expect(store.likedVideos()).toHaveLength(2);
      expect(store.likedVideos()[0].key).toBe('def456');
      expect(store.likedVideos()[1].key).toBe('abc123');
    });
  });

  describe('Initial Data', () => {
    it('should set initial videos and tab index', () => {
      store.setInitialData([mockVideo], [0, 1, 2]);

      expect(store.initialVideos()).toHaveLength(1);
      expect(store.initialTabIndex()).toEqual([0, 1, 2]);
    });
  });

  describe('Loading & Error States', () => {
    it('should set loading state', () => {
      store.setLoading(true);
      expect(store.loading()).toBe(true);

      store.setLoading(false);
      expect(store.loading()).toBe(false);
    });

    it('should set error state and stop loading', () => {
      store.setLoading(true);
      store.setError('Something went wrong');

      expect(store.error()).toBe('Something went wrong');
      expect(store.loading()).toBe(false);
    });

    it('should clear error state', () => {
      store.setError('Error message');
      store.clearError();

      expect(store.error()).toBeNull();
    });
  });
});
