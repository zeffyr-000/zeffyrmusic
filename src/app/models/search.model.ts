import { ArtistResult } from "./artist.model";
import { PlaylistResult } from "./playlist.model";
import { Video } from "./video.model";

export interface Album {
    artiste: string;
    id_playlist: string;
    ordre: string;
    titre: string;
    url_image: string;
    year_release: number;
}

export interface Track {
    artiste: string;
    duree: string;
    id_playlist: string;
    id_video: string;
    key: string;
    ordre: string;
    titre: string;
    titre_album: string;
}

export interface Extra {
    key: string;
    title: string;
    duree: number;
}

export interface SearchResults1 {
    artist: ArtistResult[],
    playlist: PlaylistResult[]
}

export interface SearchResults2 {
    tab_video: Video[]
}

export interface SearchResults3 {
    tab_extra: Extra[]
}

export interface SearchBarResponse {
    playlist: PlaylistResult[];
    artist: ArtistResult[];
}