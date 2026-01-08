import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  CreatePlaylistResponse,
  ICreatePlaylist,
  IEditMail,
  IEditPass,
  IEditTitlePlaylist,
  ILogin,
  IPass,
  IRegister,
  ISendPass,
  LoginResponse,
  SendPassResponse,
  UserReponse,
} from '../models/user.model';

/**
 * UserService - User account and playlist HTTP operations
 *
 * Handles authentication, registration and playlist CRUD operations.
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private httpClient = inject(HttpClient);

  register(data: IRegister): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'inscription', data);
  }

  login(data: ILogin, token: string): Observable<LoginResponse> {
    return this.httpClient.post<LoginResponse>(environment.URL_SERVER + 'login', {
      ...data,
      token,
    });
  }

  logout(): Observable<UserReponse> {
    return this.httpClient.get<UserReponse>(environment.URL_SERVER + 'deconnexion');
  }

  resetPass(data: IPass): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'pass', data);
  }

  sendResetPass(data: ISendPass): Observable<SendPassResponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'send_reset_pass', data);
  }

  editPass(data: IEditPass): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'options/passe', data);
  }

  editMail(data: IEditMail): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'options/mail', data);
  }

  editDarkMode(data: { dark_mode_enabled: boolean }): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'options/dark_mode', data);
  }

  editLanguage(data: { language: string }): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'options/language', data);
  }

  deleteAccount(data: { password: string }): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'options/delete', data);
  }

  createPlaylist(data: ICreatePlaylist): Observable<CreatePlaylistResponse> {
    return this.httpClient.post<CreatePlaylistResponse>(
      environment.URL_SERVER + 'playlist-creer',
      data
    );
  }

  editTitlePlaylist(data: IEditTitlePlaylist): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'edit_title', data);
  }

  associateGoogleAccount(data: { id_token: string }): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(
      environment.URL_SERVER + 'options/associate_google_account',
      data
    );
  }
}
