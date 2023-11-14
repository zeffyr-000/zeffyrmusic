export interface Album {
    artiste: string;
    id_playlist: string;
    ordre: string;
    titre: string;
    url_image: string;
    year_release: string;
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