import { TestBed } from '@angular/core/testing';
import { QueueStore } from './queue.store';
import { Video } from '../../models/video.model';

describe('QueueStore', () => {
  let store: InstanceType<typeof QueueStore>;

  // Test data
  const mockVideo1: Video = {
    id_video: 'v1',
    artiste: 'Artist 1',
    artists: [{ label: 'Artist 1', id_artist: 'a1' }],
    duree: '3:30',
    id_playlist: 'p1',
    key: 'key1',
    ordre: '1',
    titre: 'Song 1',
    titre_album: 'Album 1',
  };

  const mockVideo2: Video = {
    id_video: 'v2',
    artiste: 'Artist 2',
    artists: [{ label: 'Artist 2', id_artist: 'a2' }],
    duree: '4:00',
    id_playlist: 'p1',
    key: 'key2',
    ordre: '2',
    titre: 'Song 2',
    titre_album: 'Album 1',
  };

  const mockVideo3: Video = {
    id_video: 'v3',
    artiste: 'Artist 3',
    artists: [{ label: 'Artist 3', id_artist: 'a3' }],
    duree: '2:45',
    id_playlist: 'p1',
    key: 'key3',
    ordre: '3',
    titre: 'Song 3',
    titre_album: 'Album 2',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(QueueStore);
    store.clear();
  });

  describe('Initial State', () => {
    it('should have empty items initially', () => {
      expect(store.items()).toEqual([]);
    });

    it('should have currentIndex at 0', () => {
      expect(store.currentIndex()).toBe(0);
    });

    it('should not be shuffled initially', () => {
      expect(store.isShuffled()).toBe(false);
    });

    it('should have no current video initially', () => {
      expect(store.currentVideo()).toBeNull();
    });
  });

  describe('Computed Properties', () => {
    beforeEach(() => {
      store.setQueue([mockVideo1, mockVideo2, mockVideo3], 'playlist-1');
    });

    it('should compute currentVideo correctly', () => {
      expect(store.currentVideo()).toEqual(mockVideo1);
    });

    it('should compute currentKey correctly', () => {
      expect(store.currentKey()).toBe('key1');
    });

    it('should compute currentTitle correctly', () => {
      expect(store.currentTitle()).toBe('Song 1');
    });

    it('should compute currentArtist correctly', () => {
      expect(store.currentArtist()).toBe('Artist 1');
    });

    it('should return empty strings when queue is empty', () => {
      store.clear();
      expect(store.currentKey()).toBe('');
      expect(store.currentTitle()).toBe('');
      expect(store.currentArtist()).toBe('');
    });

    it('should compute hasItems correctly', () => {
      expect(store.hasItems()).toBe(true);
      store.clear();
      expect(store.hasItems()).toBe(false);
    });

    it('should compute itemCount correctly', () => {
      expect(store.itemCount()).toBe(3);
    });

    it('should compute hasPrevious correctly', () => {
      expect(store.hasPrevious()).toBe(false);
      store.goToIndex(1);
      expect(store.hasPrevious()).toBe(true);
    });

    it('should compute hasNext correctly', () => {
      expect(store.hasNext()).toBe(true);
      store.goToIndex(2);
      expect(store.hasNext()).toBe(false);
    });

    it('should compute currentPosition correctly', () => {
      expect(store.currentPosition()).toBe(1);
      store.goToIndex(2);
      expect(store.currentPosition()).toBe(3);
    });
  });

  describe('setQueue', () => {
    it('should set queue with videos', () => {
      store.setQueue([mockVideo1, mockVideo2], 'playlist-1');

      expect(store.items()).toHaveLength(2);
      expect(store.sourcePlaylistId()).toBe('playlist-1');
      expect(store.tabIndex()).toEqual([0, 1]);
    });

    it('should set topChartsId', () => {
      store.setQueue([mockVideo1], null, 'top-charts-1');

      expect(store.sourceTopChartsId()).toBe('top-charts-1');
    });

    it('should reset currentIndex to 0', () => {
      store.setQueue([mockVideo1, mockVideo2], null);
      store.goToIndex(1);
      store.setQueue([mockVideo3], null);

      expect(store.currentIndex()).toBe(0);
    });
  });

  describe('addToQueue', () => {
    it('should add videos to the end of queue', () => {
      store.setQueue([mockVideo1], null);
      store.addToQueue([mockVideo2, mockVideo3]);

      expect(store.items()).toHaveLength(3);
      expect(store.items()[2]).toEqual(mockVideo3);
    });

    it('should update tabIndex correctly', () => {
      store.setQueue([mockVideo1], null);
      store.addToQueue([mockVideo2]);

      expect(store.tabIndex()).toEqual([0, 1]);
    });
  });

  describe('addAfterCurrent', () => {
    it('should add video after current track', () => {
      store.setQueue([mockVideo1, mockVideo3], null);
      store.addAfterCurrent(mockVideo2);

      expect(store.items()).toHaveLength(3);
      // After going to next, we should get mockVideo2
      store.next();
      expect(store.currentVideo()?.key).toBe('key2');
    });
  });

  describe('removeFromQueue', () => {
    it('should remove video at index', () => {
      store.setQueue([mockVideo1, mockVideo2, mockVideo3], null);
      store.removeFromQueue(1);

      expect(store.items()).toHaveLength(2);
      expect(store.items().find(v => v.key === 'key2')).toBeUndefined();
    });

    it('should adjust currentIndex when removing before current', () => {
      store.setQueue([mockVideo1, mockVideo2, mockVideo3], null);
      store.goToIndex(2);
      store.removeFromQueue(0);

      expect(store.currentIndex()).toBe(1);
    });

    it('should not remove with invalid index', () => {
      store.setQueue([mockVideo1, mockVideo2], null);
      store.removeFromQueue(-1);
      store.removeFromQueue(10);

      expect(store.items()).toHaveLength(2);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      store.setQueue([mockVideo1, mockVideo2, mockVideo3], null);
    });

    it('should go to specific index', () => {
      store.goToIndex(2);
      expect(store.currentIndex()).toBe(2);
      expect(store.currentVideo()).toEqual(mockVideo3);
    });

    it('should not go to invalid index', () => {
      store.goToIndex(10);
      expect(store.currentIndex()).toBe(0);
    });

    it('should go to next track', () => {
      const result = store.next();
      expect(result).toBe(true);
      expect(store.currentIndex()).toBe(1);
    });

    it('should return false when no next track', () => {
      store.goToIndex(2);
      const result = store.next();
      expect(result).toBe(false);
      expect(store.currentIndex()).toBe(2);
    });

    it('should go to previous track', () => {
      store.goToIndex(2);
      const result = store.previous();
      expect(result).toBe(true);
      expect(store.currentIndex()).toBe(1);
    });

    it('should return false when no previous track', () => {
      const result = store.previous();
      expect(result).toBe(false);
      expect(store.currentIndex()).toBe(0);
    });
  });

  describe('Shuffle', () => {
    beforeEach(() => {
      store.setQueue([mockVideo1, mockVideo2, mockVideo3], null);
    });

    it('should toggle shuffle on', () => {
      const result = store.toggleShuffle();
      expect(result).toBe(true);
      expect(store.isShuffled()).toBe(true);
    });

    it('should keep current song at position 0 when shuffling', () => {
      store.goToIndex(1); // Select mockVideo2
      store.toggleShuffle();

      expect(store.currentIndex()).toBe(0);
      expect(store.currentVideo()?.key).toBe('key2');
    });

    it('should toggle shuffle off and restore order', () => {
      store.toggleShuffle(); // On
      store.toggleShuffle(); // Off

      expect(store.isShuffled()).toBe(false);
      expect(store.tabIndex()).toEqual([0, 1, 2]);
    });

    it('should maintain current song position when unshuffling', () => {
      store.goToIndex(1);
      store.toggleShuffle();
      store.toggleShuffle();

      expect(store.currentVideo()?.key).toBe('key2');
    });
  });

  describe('clear', () => {
    it('should reset queue to initial state', () => {
      store.setQueue([mockVideo1, mockVideo2], 'playlist-1');
      store.toggleShuffle();
      store.clear();

      expect(store.items()).toEqual([]);
      expect(store.isShuffled()).toBe(false);
      expect(store.sourcePlaylistId()).toBeNull();
    });
  });
});
