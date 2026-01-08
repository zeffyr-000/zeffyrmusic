import { Artist } from './artist.model';

export interface Video {
  id_video: string;
  artiste: string;
  artists: Artist[];
  duree: string;
  id_playlist: string;
  id_artiste?: number;
  key: string;
  ordre: string;
  titre: string;
  titre_album: string;
}

export interface UserVideo {
  id: string;
  key: string;
  titre: string;
  duree: string;
  artiste: string;
}

export interface VideoItem {
  key: string;
  artist: string;
  title: string;
  duration: number;
}
