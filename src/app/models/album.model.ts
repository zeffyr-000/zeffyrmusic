export interface Album {
    artist: string;
    id_playlist: string;
    img_big: string;
    title: string;
    titre: string;
    year_release: number;
}

export interface HomeAlbum {
    id: string;
    titre: string;
    description: string;
    url_image: string;
    decade?: boolean;
}