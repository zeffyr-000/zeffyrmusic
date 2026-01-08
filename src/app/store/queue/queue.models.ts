/**
 * Queue Store Models
 * File de lecture : vidéos, index, shuffle, navigation
 */

import { Video } from '../../models/video.model';

export interface QueueState {
  items: Video[];
  currentIndex: number;
  tabIndex: number[];
  tabIndexOriginal: number[];
  isShuffled: boolean;
  sourcePlaylistId: string | null;
  sourceTopChartsId: string | null;
}

export const initialQueueState: QueueState = {
  items: [],
  currentIndex: 0,
  tabIndex: [],
  tabIndexOriginal: [],
  isShuffled: false,
  sourcePlaylistId: null,
  sourceTopChartsId: null,
};
