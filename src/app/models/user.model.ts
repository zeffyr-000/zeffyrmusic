import { FollowItem } from "./follow.model";
import { UserPlaylist } from "./playlist.model";
import { UserVideo } from "./video.model";

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
    language: string;
    liste_playlist: UserPlaylist[];
    liste_suivi: FollowItem[];
    like_video: UserVideo[];
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

export interface ISendPass {
    id_perso: string;
    token: string;
    password: string;
}

export interface SendPassResponse {
    success: boolean;
    error?: string;
}