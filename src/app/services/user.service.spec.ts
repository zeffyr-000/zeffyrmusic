import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import type { Observable } from 'rxjs';
import { UserService } from './user.service';
import { environment } from '../../environments/environment';
import { provideHttpTesting } from '../testing/http-testing';
import { CreatePlaylistResponse, LoginResponse, UserReponse } from '../models/user.model';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [UserService, ...provideHttpTesting()],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Every UserService method is a thin HTTP call: one table entry per endpoint.
  interface EndpointCase {
    name: string;
    path: string;
    method: 'GET' | 'POST';
    /** When set, the request body must equal this value */
    body?: unknown;
    response: UserReponse | LoginResponse | CreatePlaylistResponse;
    act: () => Observable<unknown>;
  }

  const okResponse: UserReponse = { success: true, error: '' };

  const endpointCases: EndpointCase[] = [
    {
      name: 'register',
      path: 'inscription',
      method: 'POST',
      response: okResponse,
      act: () =>
        service.register({ pseudo: 'test_pseudo', mail: 'test_mail', password: 'test_password' }),
    },
    {
      name: 'login',
      path: 'login',
      method: 'POST',
      response: {
        success: true,
        pseudo: 'test_pseudo',
        id_perso: 'test_id_perso',
        mail: 'test_mail',
        is_admin: false,
        dark_mode_enabled: false,
        language: 'en',
        liste_playlist: [],
        liste_suivi: [],
        like_video: [],
        error: '',
      } as LoginResponse,
      act: () => service.login({ pseudo: 'test_pseudo', password: 'test_password' }, ''),
    },
    {
      name: 'logout',
      path: 'deconnexion',
      method: 'GET',
      response: okResponse,
      act: () => service.logout(),
    },
    {
      name: 'resetPass',
      path: 'pass',
      method: 'POST',
      response: okResponse,
      act: () => service.resetPass({ mail: 'test_mail' }),
    },
    {
      name: 'sendResetPass',
      path: 'send_reset_pass',
      method: 'POST',
      body: { id_perso: '12345', key: 'abcde', password: 'test_password' },
      response: okResponse,
      act: () =>
        service.sendResetPass({ id_perso: '12345', key: 'abcde', password: 'test_password' }),
    },
    {
      name: 'editPass',
      path: 'options/passe',
      method: 'POST',
      response: okResponse,
      act: () =>
        service.editPass({ passwordold: 'test_passwordold', passwordnew: 'test_passwordnew' }),
    },
    {
      name: 'editMail',
      path: 'options/mail',
      method: 'POST',
      response: okResponse,
      act: () => service.editMail({ mail: 'test_mail' }),
    },
    {
      name: 'editDarkMode',
      path: 'options/dark_mode',
      method: 'POST',
      body: { dark_mode_enabled: true },
      response: okResponse,
      act: () => service.editDarkMode({ dark_mode_enabled: true }),
    },
    {
      name: 'editLanguage',
      path: 'options/language',
      method: 'POST',
      body: { language: 'en' },
      response: okResponse,
      act: () => service.editLanguage({ language: 'en' }),
    },
    {
      name: 'deleteAccount',
      path: 'options/delete',
      method: 'POST',
      body: { password: 'test_password' },
      response: okResponse,
      act: () => service.deleteAccount({ password: 'test_password' }),
    },
    {
      name: 'createPlaylist',
      path: 'playlist-creer',
      method: 'POST',
      response: {
        success: true,
        id_playlist: 'test_id_playlist',
        titre: 'test_titre',
        error: '',
      } as CreatePlaylistResponse,
      act: () => service.createPlaylist({ titre: 'test_titre' }),
    },
    {
      name: 'editTitlePlaylist',
      path: 'edit_title',
      method: 'POST',
      response: okResponse,
      act: () =>
        service.editTitlePlaylist({ id_playlist: 'test_id_playlist', titre: 'test_titre' }),
    },
    {
      name: 'associateGoogleAccount',
      path: 'options/associate_google_account',
      method: 'POST',
      body: { id_token: 'test_id_token' },
      response: okResponse,
      act: () => service.associateGoogleAccount({ id_token: 'test_id_token' }),
    },
  ];

  it.each(endpointCases)('$name should $method to "$path" and forward the response', tc => {
    // Arrange / Act
    let received: unknown;
    tc.act().subscribe(data => {
      received = data;
    });

    // Assert
    const req = httpMock.expectOne(environment.URL_SERVER + tc.path);
    expect(req.request.method).toBe(tc.method);
    if (tc.body !== undefined) {
      expect(req.request.body).toEqual(tc.body);
    }

    req.flush(tc.response);
    expect(received).toEqual(tc.response);
  });
});
