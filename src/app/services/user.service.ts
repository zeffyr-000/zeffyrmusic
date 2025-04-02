import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CreatePlaylistResponse, ICreatePlaylist, IEditMail, IEditPass, IEditTitlePlaylist, ILogin, IPass, IRegister, ISendPass, LoginResponse, SendPassResponse, UserReponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private httpClient: HttpClient) { }

  register(data: IRegister): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'inscription', data, environment.httpClientConfig);
  }

  login(data: ILogin, token: string): Observable<LoginResponse> {
    return this.httpClient.post<LoginResponse>(environment.URL_SERVER + 'login', { ...data, token }, environment.httpClientConfig);
  }

  logout(): Observable<UserReponse> {
    return this.httpClient.get<UserReponse>(environment.URL_SERVER + 'deconnexion', environment.httpClientConfig);
  }

  resetPass(data: IPass): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'pass', data, environment.httpClientConfig);
  }

  sendResetPass(data: ISendPass): Observable<SendPassResponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'send_reset_pass', data, environment.httpClientConfig);
  }

  editPass(data: IEditPass): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'options/passe', data, environment.httpClientConfig);
  }

  editMail(data: IEditMail): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'options/mail', data, environment.httpClientConfig);
  }

  editDarkMode(data: { dark_mode_enabled: boolean }): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'options/dark_mode', data, environment.httpClientConfig);
  }

  editLanguage(data: { language: string }): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'options/language', data, environment.httpClientConfig);
  }

  deleteAccount(data: { password: string }): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'options/delete', data, environment.httpClientConfig);
  }

  createPlaylist(data: ICreatePlaylist): Observable<CreatePlaylistResponse> {
    return this.httpClient.post<CreatePlaylistResponse>(environment.URL_SERVER + 'playlist-creer', data, environment.httpClientConfig);
  }

  editTitlePlaylist(data: IEditTitlePlaylist): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'edit_title', data, environment.httpClientConfig);
  }

  associateGoogleAccount(data: { id_token: string }): Observable<UserReponse> {
    return this.httpClient.post<UserReponse>(environment.URL_SERVER + 'options/associate_google_account', data, environment.httpClientConfig);
  }
}
