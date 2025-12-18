import { Album } from './album.model';

export interface Artist {
  id_artist?: string;
  label: string;
}

export interface ArtistResult {
  artist: string;
  artiste?: string;
  id_artiste: string;
  id_artiste_deezer: string;
}

export interface ArtistData {
  nom: string;
  id_artiste_deezer: string;
  id_artist: string;
  list_albums: Album[];
}
