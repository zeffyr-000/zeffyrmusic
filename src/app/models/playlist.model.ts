import { Video } from "./video.model";

export interface Playlist {
    id_playlist: string;
    id_perso: string;
    title: string;
    description: string;
    est_suivi: boolean
    id_top?: string;
    decade?: boolean;
    img_big: string;
    liste_video: string[];
    str_index: number[];
    tab_video: Video[];
    est_prive?: boolean;
    titre?: string;
    artiste?: string;
    id_artiste?: string;
    year?: number
}

export interface PlaylistResult {
    id_playlist: string;
    artiste: string;
    ordre: string;
    titre: string;
    url_image: string;
    year_release: number;
}

export interface UserPlaylist {
    id_playlist: string;
    titre: string;
    prive: boolean;
}