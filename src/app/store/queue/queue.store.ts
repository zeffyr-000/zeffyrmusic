import { computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { initialQueueState } from './queue.models';
import { Video } from '../../models/video.model';
import { withSsrSafety } from '../features/with-ssr-safety';

/**
 * QueueStore - Playback queue management
 *
 * Manages video list, current position, shuffle and navigation.
 */
export const QueueStore = signalStore(
  { providedIn: 'root' },

  withState(initialQueueState),
  withSsrSafety(),

  withComputed(state => ({
    currentVideo: computed(() => {
      const items = state.items();
      const index = state.currentIndex();
      const tabIndex = state.tabIndex();

      if (items.length === 0 || tabIndex.length === 0) {
        return null;
      }

      const actualIndex = tabIndex[index];
      return items[actualIndex] ?? null;
    }),

    currentKey: computed(() => {
      const items = state.items();
      const index = state.currentIndex();
      const tabIndex = state.tabIndex();

      if (items.length === 0 || tabIndex.length === 0) {
        return '';
      }

      const actualIndex = tabIndex[index];
      return items[actualIndex]?.key ?? '';
    }),

    currentTitle: computed(() => {
      const items = state.items();
      const index = state.currentIndex();
      const tabIndex = state.tabIndex();

      if (items.length === 0 || tabIndex.length === 0) {
        return '';
      }

      const actualIndex = tabIndex[index];
      return items[actualIndex]?.titre ?? '';
    }),

    currentArtist: computed(() => {
      const items = state.items();
      const index = state.currentIndex();
      const tabIndex = state.tabIndex();

      if (items.length === 0 || tabIndex.length === 0) {
        return '';
      }

      const actualIndex = tabIndex[index];
      return items[actualIndex]?.artiste ?? '';
    }),

    hasItems: computed(() => state.items().length > 0),
    itemCount: computed(() => state.items().length),
    hasPrevious: computed(() => state.currentIndex() > 0),

    hasNext: computed(() => {
      const index = state.currentIndex();
      const tabIndex = state.tabIndex();
      return index < tabIndex.length - 1;
    }),

    currentPosition: computed(() => state.currentIndex() + 1),

    orderedItems: computed(() => {
      const items = state.items();
      const tabIndex = state.tabIndex();
      return tabIndex.map(i => items[i]).filter(Boolean);
    }),
  })),

  withMethods(store => {
    function shuffleArray(array: number[]): number[] {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    return {
      setQueue(
        items: Video[],
        sourcePlaylistId: string | null = null,
        sourceTopChartsId: string | null = null
      ): void {
        const tabIndex = items.map((_, i) => i);

        patchState(store, {
          items,
          currentIndex: 0,
          tabIndex: store.isShuffled() ? shuffleArray(tabIndex) : tabIndex,
          tabIndexOriginal: tabIndex,
          sourcePlaylistId,
          sourceTopChartsId,
        });
      },

      addToQueue(videos: Video[]): void {
        const currentItems = store.items();
        const currentTabIndex = store.tabIndex();
        const currentTabIndexOriginal = store.tabIndexOriginal();

        const startIndex = currentItems.length;
        const newItems = [...currentItems, ...videos];
        const newIndexes = videos.map((_, i) => startIndex + i);

        const newTabIndex = [...currentTabIndex, ...newIndexes];
        const newTabIndexOriginal = [...currentTabIndexOriginal, ...newIndexes];

        patchState(store, {
          items: newItems,
          tabIndex: store.isShuffled() ? shuffleArray(newTabIndex) : newTabIndex,
          tabIndexOriginal: newTabIndexOriginal,
        });
      },

      addAfterCurrent(video: Video): void {
        const currentItems = store.items();
        const currentIndex = store.currentIndex();
        const currentTabIndex = store.tabIndex();
        const currentTabIndexOriginal = store.tabIndexOriginal();

        const newItems = [...currentItems, video];
        const newVideoIndex = newItems.length - 1;

        const newTabIndex = [...currentTabIndex];
        newTabIndex.splice(currentIndex + 1, 0, newVideoIndex);

        const newTabIndexOriginal = [...currentTabIndexOriginal, newVideoIndex];

        patchState(store, {
          items: newItems,
          tabIndex: newTabIndex,
          tabIndexOriginal: newTabIndexOriginal,
        });
      },

      removeFromQueue(index: number): void {
        const currentItems = store.items();
        const currentIndex = store.currentIndex();

        if (index < 0 || index >= currentItems.length) return;

        const newItems = currentItems.filter((_, i) => i !== index);
        const newTabIndex = store
          .tabIndex()
          .filter(i => i !== index)
          .map(i => (i > index ? i - 1 : i));
        const newTabIndexOriginal = store
          .tabIndexOriginal()
          .filter(i => i !== index)
          .map(i => (i > index ? i - 1 : i));

        let newCurrentIndex = currentIndex;
        if (index < currentIndex) {
          newCurrentIndex = currentIndex - 1;
        } else if (index === currentIndex && currentIndex >= newItems.length) {
          newCurrentIndex = Math.max(0, newItems.length - 1);
        }

        patchState(store, {
          items: newItems,
          currentIndex: newCurrentIndex,
          tabIndex: newTabIndex,
          tabIndexOriginal: newTabIndexOriginal,
        });
      },

      goToIndex(index: number): void {
        const tabIndex = store.tabIndex();
        if (index >= 0 && index < tabIndex.length) {
          patchState(store, { currentIndex: index });
        }
      },

      next(): boolean {
        const currentIndex = store.currentIndex();
        const tabIndex = store.tabIndex();

        if (currentIndex < tabIndex.length - 1) {
          patchState(store, { currentIndex: currentIndex + 1 });
          return true;
        }
        return false;
      },

      previous(): boolean {
        const currentIndex = store.currentIndex();

        if (currentIndex > 0) {
          patchState(store, { currentIndex: currentIndex - 1 });
          return true;
        }
        return false;
      },

      toggleShuffle(): boolean {
        const isShuffled = !store.isShuffled();

        if (isShuffled) {
          const currentActualIndex = store.tabIndex()[store.currentIndex()];
          const otherIndexes = store.tabIndexOriginal().filter(i => i !== currentActualIndex);
          const shuffledOthers = shuffleArray(otherIndexes);

          patchState(store, {
            isShuffled: true,
            tabIndex: [currentActualIndex, ...shuffledOthers],
            currentIndex: 0,
          });
        } else {
          const currentActualIndex = store.tabIndex()[store.currentIndex()];
          const newCurrentIndex = store.tabIndexOriginal().indexOf(currentActualIndex);

          patchState(store, {
            isShuffled: false,
            tabIndex: [...store.tabIndexOriginal()],
            currentIndex: newCurrentIndex >= 0 ? newCurrentIndex : 0,
          });
        }

        return isShuffled;
      },

      setShuffle(isShuffled: boolean): void {
        if (isShuffled !== store.isShuffled()) {
          this.toggleShuffle();
        }
      },

      clear(): void {
        patchState(store, initialQueueState);
      },

      setSource(playlistId: string | null, topChartsId: string | null = null): void {
        patchState(store, {
          sourcePlaylistId: playlistId,
          sourceTopChartsId: topChartsId,
        });
      },
    };
  })
);
