import type { MockedObject } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoService } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { FollowItem } from '../models/follow.model';
import { UserPlaylist } from '../models/playlist.model';
import { UserLibraryService } from '../services/user-library.service';
import { HeaderComponent } from './header.component';
import { of } from 'rxjs';
import { InitService } from '../services/init.service';
import { UserVideo, VideoItem } from '../models/video.model';
import { Component, NO_ERRORS_SCHEMA, TemplateRef } from '@angular/core';
import { UserService } from '../services/user.service';
import { LoginResponse } from '../models/user.model';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { environment } from 'src/environments/environment';
import { RouterTestingModule } from '@angular/router/testing';
import { MockTestComponent } from '../mock-test.component';
import { UiStore } from '../store/ui/ui.store';
import type { MockInitService } from '../models/test-mocks.model';

import { SearchService } from '../services/search.service';
import { SearchResults1, SearchResults2, SearchResults3 } from '../models/search.model';

@Component({
  selector: 'app-search-bar',
  template: '',
  standalone: true,
  imports: [],
})
class MockSearchBarComponent {}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let initService: InitService;
  let userLibraryService: UserLibraryService;
  let userService: UserService;
  let googleAnalyticsServiceSpy: MockedObject<GoogleAnalyticsService>;
  let translocoService: TranslocoService;
  let activeModalSpy: MockedObject<NgbActiveModal>;
  let modalService: NgbModal;
  let routerSpyObj: MockedObject<Router>;
  let routeSpyObj: MockedObject<ActivatedRoute>;
  let userServiceMock: MockedObject<UserService>;
  let modalServiceSpyObj: MockedObject<NgbModal>;
  let googleAnalyticsServiceSpyObj: MockedObject<GoogleAnalyticsService>;
  let activeModalSpyObj: MockedObject<NgbActiveModal>;
  let initServiceMock: Partial<MockInitService>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userLibraryServiceMock: any;
  let searchServiceMock: Partial<SearchService>;
  const mockEvent = { preventDefault: vi.fn() } as unknown as Event;

  const searchResults1: SearchResults1 = {
    artist: [
      { id_artiste: '1', artiste: 'Test Artist', artist: 'Test Artist', id_artiste_deezer: '123' },
    ],
    playlist: [
      {
        id_playlist: '1',
        artiste: 'Test Artist',
        ordre: '1',
        titre: 'Test Album',
        url_image: '',
        year_release: 2021,
      },
    ],
  };
  const searchResults2: SearchResults2 = {
    tab_video: [
      {
        id_video: '1',
        artiste: 'Test Artist',
        artists: [{ id_artist: '1', label: 'Test Artist' }],
        duree: '100',
        id_playlist: '1',
        key: 'XXX-XXX',
        ordre: '1',
        titre: 'Test Track',
        titre_album: 'Test Album',
      },
    ],
  };
  const searchResults3: SearchResults3 = {
    tab_extra: [{ key: 'TEST', title: 'TITLE', duree: 100 }],
  };

  beforeEach(async () => {
    // Create service mocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initServiceMock = { onMessageUnlog: vi.fn() } as any;
    userLibraryServiceMock = {
      initializeFromLogin: vi.fn(),
      addVideoToPlaylist: vi.fn().mockReturnValue(of(true)),
    };
    userServiceMock = {
      register: vi.fn(),
      login: vi.fn(),
      resetPass: vi.fn(),
      editPass: vi.fn(),
      editMail: vi.fn(),
      createPlaylist: vi.fn(),
      logout: vi.fn(),
      editTitlePlaylist: vi.fn(),
    } as MockedObject<UserService>;

    googleAnalyticsServiceSpyObj = { pageView: vi.fn() } as MockedObject<GoogleAnalyticsService>;
    modalServiceSpyObj = { open: vi.fn(), dismissAll: vi.fn() } as MockedObject<NgbModal>;
    activeModalSpyObj = { dismiss: vi.fn() } as MockedObject<NgbActiveModal>;
  });

  beforeEach(async () => {
    routerSpyObj = { navigate: vi.fn() } as MockedObject<Router>;
    routeSpyObj = {
      snapshot: {
        paramMap: {
          get: () => '123',
          has: () => true,
          getAll: () => ['123'],
          keys: ['id'],
        },
      },
    } as unknown as MockedObject<ActivatedRoute>;

    searchServiceMock = {
      fullSearch1: vi.fn().mockReturnValue(of(searchResults1)),
      fullSearch2: vi.fn().mockReturnValue(of(searchResults2)),
      fullSearch3: vi.fn().mockReturnValue(of(searchResults3)),
    };

    await TestBed.configureTestingModule({
      imports: [
        NgbModalModule,
        HeaderComponent,
        FontAwesomeTestingModule,
        RouterTestingModule.withRoutes([{ path: 'test', component: MockTestComponent }]),
        MockSearchBarComponent,
      ],
      providers: [
        getTranslocoTestingProviders(),
        { provide: InitService, useValue: initServiceMock },
        { provide: UserLibraryService, useValue: userLibraryServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: RouterTestingModule, useValue: routerSpyObj },
        { provide: ActivatedRoute, useValue: routeSpyObj },
        { provide: GoogleAnalyticsService, useValue: googleAnalyticsServiceSpyObj },
        { provide: NgbModal, useValue: modalServiceSpyObj },
        { provide: NgbActiveModal, useValue: activeModalSpyObj },
        {
          provide: SearchService,
          useValue: searchServiceMock,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    initService = TestBed.inject(InitService);
    userLibraryService = TestBed.inject(UserLibraryService);
    userService = TestBed.inject(UserService);
    googleAnalyticsServiceSpy = TestBed.inject(
      GoogleAnalyticsService
    ) as MockedObject<GoogleAnalyticsService>;
    activeModalSpy = TestBed.inject(NgbActiveModal) as MockedObject<NgbActiveModal>;
    modalService = TestBed.inject(NgbModal);
    translocoService = TestBed.inject(TranslocoService);
    translocoService.setDefaultLang('en');

    // Create component for each test (complete isolation)
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Reset component properties to initial state
    component.isRegistered.set(false);
    component.error.set('');
    component.isSuccess.set(false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update values when uiStore.addVideoData changes', () => {
    // Prepare test data
    const data = {
      key: 'XXXX-XXX',
      artist: 'testArtist',
      title: 'testTitle',
      duration: 100,
    } as VideoItem;

    // Create spy for openModal
    const openModalSpy = vi.spyOn(component, 'openModal');

    // Simulate modal opening via UiStore
    const uiStore = TestBed.inject(UiStore);
    uiStore.openAddVideoModal(data);

    // Trigger effect detection
    fixture.detectChanges();

    // Verify values were updated correctly
    expect(component.addKey).toBe(data.key);
    expect(component.addArtist).toBe(data.artist);
    expect(component.addTitle).toBe(data.title);
    expect(component.addDuration).toBe(data.duration);

    // Verify openModal was called
    expect(openModalSpy).toHaveBeenCalled();
  });

  it('should call modalService.open with the correct arguments when openModal is called', () => {
    const content = {} as TemplateRef<unknown>;
    component.openModal(content);
    expect(modalService.open).toHaveBeenCalledWith(content, { size: 'lg' });
  });

  it('should call userLibraryService.addVideoToPlaylist and modal.dismiss when onAddVideo is called', () => {
    const idPlaylist = '123';
    const modal = { dismiss: vi.fn(), update: vi.fn(), close: vi.fn() };
    component.addKey = 'key';
    component.addTitle = 'title';
    component.addArtist = 'artist';
    component.addDuration = 100;

    component.onAddVideo(idPlaylist, modal);

    expect(userLibraryService.addVideoToPlaylist).toHaveBeenCalledWith(
      idPlaylist,
      'key',
      'title',
      'artist',
      100
    );
    expect(modal.dismiss).toHaveBeenCalled();
  });

  describe('onSubmitRegister', () => {
    it('should call userService.register and set isRegistered on success', () => {
      // Signal Forms: set model values directly
      component.registerModel.set({
        pseudo: 'testuser',
        mail: 'test@example.com',
        password: 'password',
      });

      const registerResponse = { success: true, error: '' };
      vi.spyOn(userService, 'register').mockReturnValue(of(registerResponse));

      component.onSubmitRegister(mockEvent);

      expect(userService.register).toHaveBeenCalledWith({
        pseudo: 'testuser',
        mail: 'test@example.com',
        password: 'password',
      });
      expect(component.isRegistered()).toBe(true);
      expect(googleAnalyticsServiceSpy.pageView).toHaveBeenCalledWith('/inscription/succes');
    });

    it('should set error on register failure', () => {
      // Signal Forms: set model values directly
      component.registerModel.set({
        pseudo: 'testuser',
        mail: 'test@example.com',
        password: 'password',
      });

      const error = 'invalid_email';
      const registerResponse = { success: false, error };
      vi.spyOn(userService, 'register').mockReturnValue(of(registerResponse));

      component.onSubmitRegister(mockEvent);

      expect(userService.register).toHaveBeenCalledWith({
        pseudo: 'testuser',
        mail: 'test@example.com',
        password: 'password',
      });
      // The component uses translocoService.translate to display the error
      // but stores the result of translate, so we must verify that translate was called
      expect(component.error()).toBeTruthy();
    });
  });

  describe('onLogIn', () => {
    it('should login successfully and dismiss modal', () => {
      // Signal Forms: set model values directly
      component.loginModel.set({ pseudo: 'test@example.com', password: 'password' });

      const pseudo = 'testuser';
      const id_perso = '123';
      const mail = 'testuser@example.com';
      const liste_playlist: UserPlaylist[] = [];
      const liste_suivi: FollowItem[] = [];
      const like_video: UserVideo[] = [];
      const darkModeEnabled = false;
      const language = 'en';

      const loginResponse = {
        success: true,
        pseudo,
        id_perso,
        mail,
        dark_mode_enabled: darkModeEnabled,
        language,
        liste_playlist,
        liste_suivi,
        like_video,
      } as LoginResponse;
      vi.spyOn(userService, 'login').mockReturnValue(of(loginResponse));

      // Signal Forms: onLogIn now takes (modal, token) instead of (form, modal, token)
      component.onLogIn(mockEvent, activeModalSpy, '');

      expect(userService.login).toHaveBeenCalledWith(
        { pseudo: 'test@example.com', password: 'password' },
        ''
      );
      expect(component.authStore.isAuthenticated()).toBe(true);
      expect(component.authStore.mail()).toBe(mail);
      expect(userLibraryService.initializeFromLogin).toHaveBeenCalledWith(
        liste_playlist,
        liste_suivi,
        like_video
      );
      expect(activeModalSpy.dismiss).toHaveBeenCalledWith('');
    });

    it('should set error on login failure', () => {
      // Signal Forms: set model values directly
      component.loginModel.set({ pseudo: 'test@example.com', password: 'password' });

      const error = 'invalid_credentials';

      const loginResponse = { success: false, error } as LoginResponse;
      vi.spyOn(userService, 'login').mockReturnValue(of(loginResponse));

      // Signal Forms: onLogIn now takes (modal, token) instead of (form, modal, token)
      component.onLogIn(mockEvent, activeModalSpy, '');

      expect(userService.login).toHaveBeenCalledWith(
        { pseudo: 'test@example.com', password: 'password' },
        ''
      );
      expect(component.error()).toBeTruthy();
    });
  });

  describe('onSubmitResetPass', () => {
    it('should call userService.resetPass and set isSuccess on success', () => {
      // Signal Forms: set model values directly
      component.resetPassModel.set({ mail: 'test@example.com' });

      const successResponse = { success: true, error: '' };
      vi.spyOn(userService, 'resetPass').mockReturnValue(of(successResponse));

      component.onSubmitResetPass(mockEvent);

      expect(userService.resetPass).toHaveBeenCalledWith({ mail: 'test@example.com' });
      expect(component.isSuccess()).toBe(true);
    });

    it('should set error on reset password failure', () => {
      // Signal Forms: set model values directly
      component.resetPassModel.set({ mail: 'test@example.com' });

      const errorResponse = { success: false, error: 'Invalid credentials' };
      vi.spyOn(translocoService, 'translate').mockReturnValue('Invalid credentials');
      vi.spyOn(userService, 'resetPass').mockReturnValue(of(errorResponse));

      component.onSubmitResetPass(mockEvent);

      expect(userService.resetPass).toHaveBeenCalledWith({ mail: 'test@example.com' });
      expect(component.error()).toBe('Invalid credentials');
    });
  });

  describe('onLogout', () => {
    it('should call userService.logout and authStore.logout', () => {
      const successResponse = { success: true, error: '' };
      vi.spyOn(userService, 'logout').mockReturnValue(of(successResponse));
      const logoutSpy = vi.spyOn(component.authStore, 'logout');

      component.onLogout();

      expect(userService.logout).toHaveBeenCalled();
      expect(logoutSpy).toHaveBeenCalled();
    });
  });

  it('should initialize and render Google Sign-In button', () => {
    const google = {
      accounts: {
        id: {
          initialize: vi.fn(),
          renderButton: vi.fn(),
        },
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).google = google;

    const mockElement = document.createElement('div');
    mockElement.id = 'google-signin-button-header';
    document.body.appendChild(mockElement);

    component.renderGoogleSignInButton();

    expect(google.accounts.id.initialize).toHaveBeenCalledWith({
      client_id: environment.GOOGLE_CLIENT_ID,
      callback: expect.any(Function),
    });
    expect(google.accounts.id.renderButton).toHaveBeenCalledWith(mockElement, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
    });

    document.body.removeChild(mockElement);
  });

  it('should initialize and render Google Register button', () => {
    const google = {
      accounts: {
        id: {
          initialize: vi.fn(),
          renderButton: vi.fn(),
        },
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).google = google;

    const mockElement = document.createElement('div');
    mockElement.id = 'google-register-button-header';
    document.body.appendChild(mockElement);

    component.renderGoogleRegisterButton();

    expect(google.accounts.id.initialize).toHaveBeenCalledWith({
      client_id: environment.GOOGLE_CLIENT_ID,
      callback: expect.any(Function),
    });
    expect(google.accounts.id.renderButton).toHaveBeenCalledWith(mockElement, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
    });

    document.body.removeChild(mockElement);
  });

  it('should call onLogIn with credential when handleCredentialResponse is called', () => {
    // Mock userService.login for this specific test
    vi.mocked(userServiceMock.login).mockReturnValue(
      of({
        success: false,
        pseudo: '',
        id_perso: '',
        mail: '',
        dark_mode_enabled: false,
        language: 'en',
        liste_playlist: [],
        liste_suivi: [],
        like_video: [],
        error: undefined,
      })
    );

    vi.spyOn(component, 'onLogIn');
    const mockResponse = { credential: 'mockCredential' };

    component.handleCredentialResponse(mockResponse);

    // Signal Forms: onLogIn now takes (event, modal, token)
    expect(component.onLogIn).toHaveBeenCalledWith(null, null, 'mockCredential');
  });
});
