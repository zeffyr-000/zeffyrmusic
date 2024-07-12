import { FollowItem } from "./follow.model";
import { UserPlaylist } from "./playlist.model";

export interface IRegister {
    pseudo: string;
    mail: string;
    password: string;
}

export interface UserReponse {
    success: boolean;
    error: string;
}

export interface CreatePlaylistResponse {
    success: boolean;
    id_playlist: string;
    titre: string;
    error: string;
}

export interface LoginResponse {
    success: boolean;
    pseudo: string;
    id_perso: string;
    mail: string;
    dark_mode_enabled: boolean;
    liste_playlist: UserPlaylist[];
    liste_suivi: FollowItem[];
    error?: string;
}

export interface ILogin {
    pseudo: string;
    password: string;
}

export interface IPass {
    mail: string;
}

export interface IEditPass {
    passwordold: string;
    passwordnew: string;
}

export interface IEditMail {
    mail: string;
}

export interface ICreatePlaylist {
    titre: string;
}

export interface IEditTitlePlaylist {
    id_playlist: string;
    titre: string;
}