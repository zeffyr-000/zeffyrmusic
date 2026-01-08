import type { MockedObject } from 'vitest';
import { NO_ERRORS_SCHEMA, TemplateRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { NgbActiveModal, NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';
import { InitService } from '../services/init.service';
import { UserService } from '../services/user.service';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { SettingsComponent } from './settings.component';
import { AuthGuard } from '../services/auth-guard.service';
import { UserReponse } from '../models/user.model';
import { environment } from 'src/environments/environment';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let initService: InitService;
  let translocoService: TranslocoService;

  let modalService: NgbModal;
  let userServiceMock: MockedObject<UserService>;
  let initServiceMock: MockedObject<InitService>;
  let modalServiceSpyObj: MockedObject<NgbModal>;

  beforeEach(async () => {
    initServiceMock = {
      loginSuccess: vi.fn(),
      logOut: vi.fn(),
      onMessageUnlog: vi.fn(),
    } as MockedObject<InitService>;

    userServiceMock = {
      register: vi.fn(),
      login: vi.fn(),
      resetPass: vi.fn(),
      editPass: vi.fn(),
      editMail: vi.fn(),
      createPlaylist: vi.fn(),
      logout: vi.fn(),
      editTitlePlaylist: vi.fn(),
      editDarkMode: vi.fn(),
      editLanguage: vi.fn(),
      deleteAccount: vi.fn(),
      associateGoogleAccount: vi.fn(),
    } as MockedObject<UserService>;
    modalServiceSpyObj = { open: vi.fn() } as MockedObject<NgbModal>;
    const activeModalSpyObj = { dismiss: vi.fn() } as MockedObject<NgbActiveModal>;
    const authGuardMock = { canActivate: vi.fn() } as MockedObject<AuthGuard>;

    initServiceMock.logOut = vi.fn();

    await TestBed.configureTestingModule({
      imports: [NgbModalModule, SettingsComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: InitService, useValue: initServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: NgbModal, useValue: modalServiceSpyObj },
        { provide: NgbActiveModal, useValue: activeModalSpyObj },
        { provide: AuthGuard, useValue: authGuardMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    initService = TestBed.inject(InitService);
    modalService = TestBed.inject(NgbModal);
    translocoService = TestBed.inject(TranslocoService);
    translocoService.setDefaultLang('en');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).google;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onSubmitEditPass', () => {
    it('should call httpClient.post with the correct arguments and update this.successPass or this.error based on the server response', async () => {
      vi.useFakeTimers();

      // Arrange
      const form = {
        valid: true,
        form: {
          value: {
            password1: 'testPassword',
            password2: 'testPassword',
            passwordold: 'oldPassword',
          },
        },
      } as NgForm;
      const successResponse = { success: true, error: '' };
      const errorResponse = { success: false, error: 'Invalid credentials' };
      const expectedBody = {
        passwordold: 'oldPassword',
        passwordnew: 'testPassword',
      };

      userServiceMock.editPass.mockReturnValue(of(successResponse));

      // Act
      component.onSubmitEditPass(form);

      // Assert
      expect(userServiceMock.editPass).toHaveBeenCalledWith(expectedBody);

      await vi.advanceTimersByTimeAsync(10000);

      expect(component.successPass()).toBe(false);

      userServiceMock.editPass.mockReturnValue(of(errorResponse));
      // Act
      component.onSubmitEditPass(form);

      // Assert
      expect(userServiceMock.editPass).toHaveBeenCalledWith(expectedBody);
      expect(component.error()).toBe('Invalid credentials');

      vi.useRealTimers();
    });

    it('should set this.error to "mot_de_passe_confirmer_invalide" when the passwords are not identical', () => {
      // Arrange
      const form = {
        valid: true,
        form: {
          value: {
            password1: 'testPassword',
            password2: 'differentPassword',
            passwordold: 'oldPassword',
          },
        },
      } as NgForm;

      // Act
      component.onSubmitEditPass(form);

      // Assert
      expect(component.error()).toBe('Confirmation password is incorrect');
    });

    it('should set this.isConnected to false and call initService.onMessageUnlog when an error occurs', () => {
      // Arrange
      const form = {
        valid: true,
        form: {
          value: {
            password1: 'testPassword',
            password2: 'testPassword',
            passwordold: 'oldPassword',
          },
        },
      } as NgForm;
      userServiceMock.editPass.mockReturnValue(throwError('error'));

      // Act
      component.onSubmitEditPass(form);

      // Assert
      expect(userServiceMock.editPass).toHaveBeenCalled();
      expect(initService.onMessageUnlog).toHaveBeenCalled();
    });
  });

  describe('onSubmitEditMail', () => {
    it('should call httpClient.post with the correct arguments and update this.successMail or this.error based on the server response', async () => {
      vi.useFakeTimers();

      // Arrange
      const form = {
        valid: true,
        form: {
          value: {
            email: 'testEmail',
          },
        },
      } as NgForm;
      const successResponse = { success: true, error: '' };
      const errorResponse = { success: false, error: 'Invalid email' };
      userServiceMock.editMail.mockReturnValue(of(successResponse));

      // Act
      component.onSubmitEditMail(form);

      // Assert
      expect(userServiceMock.editMail).toHaveBeenCalledWith(form.form.value);

      await vi.advanceTimersByTimeAsync(10000);

      expect(component.successMail()).toBe(false);

      userServiceMock.editMail.mockReturnValue(of(errorResponse));
      // Act
      component.onSubmitEditMail(form);

      // Assert
      expect(userServiceMock.editMail).toHaveBeenCalledWith(form.form.value);
      expect(component.error()).toBe('Invalid email');

      vi.useRealTimers();
    });

    it('should set this.isConnected to false and call initService.onMessageUnlog when an error occurs', () => {
      // Arrange
      const form = {
        valid: true,
        form: {
          value: {
            email: 'testEmail',
          },
        },
      } as NgForm;
      const errorResponse = { success: false, error: 'Invalid email' };
      userServiceMock.editMail.mockReturnValue(throwError(errorResponse));

      // Act
      component.onSubmitEditMail(form);

      // Assert
      expect(userServiceMock.editMail).toHaveBeenCalledWith(form.form.value);
      expect(initService.onMessageUnlog).toHaveBeenCalled();
    });
  });

  it('should open the modal with the correct content and size', () => {
    const content: TemplateRef<unknown> = {} as TemplateRef<unknown>;
    component.openModal(content);
    expect(modalService.open).toHaveBeenCalledWith(content, { size: 'lg' });
  });

  it('should update dark mode and emit connected change on success', () => {
    const mockResponse = { success: true } as UserReponse;
    userServiceMock.editDarkMode.mockReturnValue(of(mockResponse));

    // darkModeEnabled is false initially, so it should send true (the inverted value)
    component.onSwitchDarkMode();

    expect(userServiceMock.editDarkMode).toHaveBeenCalledWith({
      dark_mode_enabled: true,
    });
  });

  it('should set error message on failure', () => {
    const mockResponse = { success: false, error: 'some_error' } as UserReponse;
    userServiceMock.editDarkMode.mockReturnValue(of(mockResponse));

    component.onSwitchDarkMode();

    expect(userServiceMock.editDarkMode).toHaveBeenCalledWith({
      dark_mode_enabled: true,
    });
    expect(component.error()).toBe('some_error');
  });

  it('should handle error response', () => {
    userServiceMock.editDarkMode.mockReturnValue(throwError(() => new Error('error')));

    component.onSwitchDarkMode();

    expect(userServiceMock.editDarkMode).toHaveBeenCalledWith({
      dark_mode_enabled: true,
    });
    expect(initServiceMock.onMessageUnlog).toHaveBeenCalled();
  });

  it('should call editLanguage with correct parameters and handle success response', () => {
    const mockForm = {
      valid: true,
      form: {
        value: { language: 'en' },
      },
    } as NgForm;

    const mockResponse = { success: true } as UserReponse;
    userServiceMock.editLanguage.mockReturnValue(of(mockResponse));
    vi.useFakeTimers();

    component.onSubmitEditLanguage(mockForm);

    expect(userServiceMock.editLanguage).toHaveBeenCalledWith(mockForm.form.value);
    expect(component.successLanguage()).toBe(true);

    vi.advanceTimersByTime(10000);

    expect(component.successLanguage()).toBe(false);
  });

  it('should handle error response correctly', () => {
    const mockForm = {
      valid: true,
      form: {
        value: { language: 'en' },
      },
    } as NgForm;

    const mockResponse = { success: false, error: 'Some error' } as UserReponse;
    userServiceMock.editLanguage.mockReturnValue(of(mockResponse));

    component.onSubmitEditLanguage(mockForm);

    expect(userServiceMock.editLanguage).toHaveBeenCalledWith(mockForm.form.value);
    expect(component.error()).toBe('Some error');
  });

  it('should handle HTTP error correctly', () => {
    const mockForm = {
      valid: true,
      form: {
        value: { language: 'en' },
      },
    } as NgForm;

    userServiceMock.editLanguage.mockReturnValue(throwError(() => new Error('HTTP error')));

    component.onSubmitEditLanguage(mockForm);

    expect(userServiceMock.editLanguage).toHaveBeenCalledWith(mockForm.form.value);
    expect(initServiceMock.onMessageUnlog).toHaveBeenCalled();
  });

  it('should handle successful account deletion', () => {
    vi.useFakeTimers();

    const form = {
      valid: true,
      form: {
        value: {
          /* form values */
        },
      },
    } as NgForm;

    const response = { success: true } as UserReponse;
    userServiceMock.deleteAccount.mockReturnValue(of(response));

    component.onSubmitDeleteAccount(form);

    expect(userServiceMock.deleteAccount).toHaveBeenCalledWith(form.form.value);
    expect(component.successDelete()).toBe(true);

    vi.advanceTimersByTime(10000);

    expect(component.successDelete()).toBe(false);
    expect(initServiceMock.logOut).toHaveBeenCalled();
  });

  it('should handle account deletion error from server', () => {
    const form = {
      valid: true,
      form: {
        value: {
          /* form values */
        },
      },
    } as NgForm;

    const response = { success: false, error: 'error_message' } as UserReponse;
    userServiceMock.deleteAccount.mockReturnValue(of(response));

    component.onSubmitDeleteAccount(form);

    expect(userServiceMock.deleteAccount).toHaveBeenCalledWith(form.form.value);
    expect(component.successDelete()).toBe(false);
    expect(component.error()).toBe('error_message');
  });

  it('should handle network error during account deletion', () => {
    const form = {
      valid: true,
      form: {
        value: {
          /* form values */
        },
      },
    } as NgForm;

    userServiceMock.deleteAccount.mockReturnValue(throwError(() => new Error('Network error')));

    component.onSubmitDeleteAccount(form);

    expect(userServiceMock.deleteAccount).toHaveBeenCalledWith(form.form.value);
    expect(initServiceMock.onMessageUnlog).toHaveBeenCalled();
  });

  it('should initialize Google Sign-In', () => {
    const googleMock = {
      accounts: {
        id: {
          initialize: vi.fn(),
        },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).google = googleMock;

    component.initializeGoogleSignIn();

    expect(googleMock.accounts.id.initialize).toHaveBeenCalledWith({
      client_id: environment.GOOGLE_CLIENT_ID,
      callback: expect.any(Function),
    });
  });

  it('should render Google Sign-In button', () => {
    const googleMock = {
      accounts: {
        id: {
          renderButton: vi.fn(),
        },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).google = googleMock;
    const buttonElement = document.createElement('div');
    buttonElement.id = 'google-signin-button';
    document.body.appendChild(buttonElement);

    component.renderGoogleSignInButton();

    expect(googleMock.accounts.id.renderButton).toHaveBeenCalledWith(buttonElement, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
    });

    document.body.removeChild(buttonElement);
  });

  it('should open Google account modal and render Google Sign-In button in both success and error cases', async () => {
    const renderSpy = vi.spyOn(component, 'renderGoogleSignInButton');

    let resolveCallback: () => void;
    const successPromise = new Promise<void>(resolve => {
      resolveCallback = resolve;
    });

    const modalRefSuccess = {
      result: successPromise,
    } as NgbModalRef;

    modalServiceSpyObj.open.mockReturnValue(modalRefSuccess);

    component.openGoogleAccountModal();

    expect(modalServiceSpyObj.open).toHaveBeenCalledWith(
      component.contentModalAssociateGoogleAccount,
      { size: 'lg' }
    );

    // Wait for setTimeout(0)
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(renderSpy).toHaveBeenCalledTimes(1);

    resolveCallback!();
    await successPromise;

    expect(component.renderGoogleSignInButton).toHaveBeenCalledTimes(2);

    renderSpy.mockClear();
    modalServiceSpyObj.open.mockClear();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rejectCallback: (reason?: any) => void;
    const errorPromise = new Promise<void>((_, reject) => {
      rejectCallback = reject;
    });

    const modalRefError = {
      result: errorPromise,
    } as NgbModalRef;

    modalServiceSpyObj.open.mockReturnValue(modalRefError);

    component.openGoogleAccountModal();

    expect(modalServiceSpyObj.open).toHaveBeenCalledWith(
      component.contentModalAssociateGoogleAccount,
      { size: 'lg' }
    );

    // Wait for setTimeout(0)
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(renderSpy).toHaveBeenCalledTimes(1);

    rejectCallback!('Modal dismissed');
    await errorPromise.catch(() => {
      // Ignore expected error
    });

    expect(renderSpy).toHaveBeenCalledTimes(2);
  });

  it('should handle successful Google account association', () => {
    vi.useFakeTimers();

    const response = { credential: 'test_credential' };
    const userResponse = { success: true } as UserReponse;

    userServiceMock.associateGoogleAccount.mockReturnValue(of(userResponse));
    vi.spyOn(component, 'renderGoogleSignInButton');

    component.handleCredentialResponse(response);

    expect(userServiceMock.associateGoogleAccount).toHaveBeenCalledWith({
      id_token: response.credential,
    });
    expect(component.successGoogleAccount()).toBe(true);

    vi.advanceTimersByTime(10000);
    expect(component.successGoogleAccount()).toBe(false);
  });

  it('should handle network error during Google account association', () => {
    const response = { success: false, error: 'error_message' } as UserReponse;

    userServiceMock.associateGoogleAccount.mockReturnValue(of(response));

    component.handleCredentialResponse({ credential: 'test_credential' });

    expect(component.successGoogleAccount()).toBe(false);
  });
});
