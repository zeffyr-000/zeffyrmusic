/**
 * UserData Store Models
 * User data: playlists, follows, likes
 */

import { FollowItem } from '../../models/follow.model';
import { UserPlaylist } from '../../models/playlist.model';
import { UserVideo, Video } from '../../models/video.model';

export interface UserDataState {
  playlists: UserPlaylist[];
  follows: FollowItem[];
  likedVideos: UserVideo[];
  initialVideos: Video[];
  initialTabIndex: number[];
  loading: boolean;
  error: string | null;
}

export const initialUserDataState: UserDataState = {
  playlists: [],
  follows: [],
  likedVideos: [],
  initialVideos: [],
  initialTabIndex: [],
  loading: false,
  error: null,
};
