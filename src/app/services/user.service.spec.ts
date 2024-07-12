import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../../environments/environment';
import { CreatePlaylistResponse, ICreatePlaylist, IEditMail, IEditPass, IEditTitlePlaylist, ILogin, IPass, LoginResponse, UserReponse } from '../models/user.model';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [UserService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should perform a POST request for registration', () => {
    const mockData = {
      pseudo: 'test_pseudo',
      mail: 'test_mail',
      password: 'test_password',
    };

    service.register(mockData).subscribe();

    const req = httpMock.expectOne(environment.URL_SERVER + 'inscription');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should perform a POST request for login', () => {
    const mockLoginData: ILogin = {
      pseudo: 'test_pseudo',
      password: 'test_password',
    };

    const mockLoginResponse: LoginResponse = {
      success: true,
      pseudo: 'test_pseudo',
      id_perso: 'test_id_perso',
      mail: 'test_mail',
      dark_mode_enabled: false,
      liste_playlist: [],
      liste_suivi: [],
      error: '',
    };

    service.login(mockLoginData).subscribe(data => {
      expect(data).toEqual(mockLoginResponse);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'login');

    expect(req.request.method).toBe('POST');

    req.flush(mockLoginResponse);
  });

  it('should perform a GET request for logout', () => {
    const mockLogoutResponse: UserReponse = {
      success: true,
      error: '',
    };

    service.logout().subscribe(data => {
      expect(data).toEqual(mockLogoutResponse);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'deconnexion');

    expect(req.request.method).toBe('GET');

    req.flush(mockLogoutResponse);
  });

  it('should perform a POST request for reset password', () => {
    const mockResetPassData: IPass = {
      mail: 'test_mail',
    };

    const mockResetPassResponse: UserReponse = {
      success: true,
      error: '',
    };

    service.resetPass(mockResetPassData).subscribe(data => {
      expect(data).toEqual(mockResetPassResponse);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'pass');

    expect(req.request.method).toBe('POST');

    req.flush(mockResetPassResponse);
  });

  it('should perform a POST request for edit password', () => {
    const mockEditPassData: IEditPass = {
      passwordold: 'test_passwordold',
      passwordnew: 'test_passwordnew',
    };

    const mockEditPassResponse: UserReponse = {
      success: true,
      error: '',
    };

    service.editPass(mockEditPassData).subscribe(data => {
      expect(data).toEqual(mockEditPassResponse);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'options/passe');

    expect(req.request.method).toBe('POST');

    req.flush(mockEditPassResponse);
  });

  it('should perform a POST request for edit mail', () => {
    const mockEditMailData: IEditMail = {
      mail: 'test_mail'
    };

    const mockEditMailResponse: UserReponse = {
      success: true,
      error: '',
    };

    service.editMail(mockEditMailData).subscribe(data => {
      expect(data).toEqual(mockEditMailResponse);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'options/mail');

    expect(req.request.method).toBe('POST');

    req.flush(mockEditMailResponse);
  });

  it('should perform a POST request for create playlist', () => {
    const mockCreatePlaylistData: ICreatePlaylist = {
      titre: 'test_titre',
    };

    const mockCreatePlaylistResponse: CreatePlaylistResponse = {
      success: true,
      id_playlist: 'test_id_playlist',
      titre: 'test_titre',
      error: '',
    };

    service.createPlaylist(mockCreatePlaylistData).subscribe(data => {
      expect(data).toEqual(mockCreatePlaylistResponse);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'playlist-creer');

    expect(req.request.method).toBe('POST');

    req.flush(mockCreatePlaylistResponse);
  });

  it('should perform a POST request for edit title playlist', () => {
    const mockEditTitlePlaylistData: IEditTitlePlaylist = {
      id_playlist: 'test_id_playlist',
      titre: 'test_titre',
    };

    const mockEditTitlePlaylistResponse: UserReponse = {
      success: true,
      error: '',
    };

    service.editTitlePlaylist(mockEditTitlePlaylistData).subscribe(data => {
      expect(data).toEqual(mockEditTitlePlaylistResponse);
    });

    const req = httpMock.expectOne(environment.URL_SERVER + 'edit_title');

    expect(req.request.method).toBe('POST');

    req.flush(mockEditTitlePlaylistResponse);
  });
});