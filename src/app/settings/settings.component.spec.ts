import type { Mock, MockedObject } from 'vitest';
import { NO_ERRORS_SCHEMA, PLATFORM_ID, TemplateRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';
import { submit } from '@angular/forms/signals';
import { InitService } from '../services/init.service';
import { UserService } from '../services/user.service';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { SettingsComponent } from './settings.component';
import { AuthGuard } from '../services/auth-guard.service';
import { UserReponse } from '../models/user.model';
import { environment } from 'src/environments/environment';
import {
  createGoogleAnalyticsServiceMock,
  createInitServiceMock,
  createUserServiceMock,
} from '../testing/mock-factories';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let initService: InitService;
  let translocoService: TranslocoService;

  let modalService: NgbModal;
  let userServiceMock: MockedObject<UserService>;
  let initServiceMock: MockedObject<InitService>;
  let modalServiceSpyObj: MockedObject<NgbModal>;
  let googleAnalyticsServiceMock: MockedObject<GoogleAnalyticsService>;

  beforeEach(async () => {
    initServiceMock = createInitServiceMock();
    userServiceMock = createUserServiceMock();
    modalServiceSpyObj = { open: vi.fn() } as MockedObject<NgbModal>;
    const authGuardMock = { canActivate: vi.fn() } as MockedObject<AuthGuard>;
    googleAnalyticsServiceMock = createGoogleAnalyticsServiceMock();

    await TestBed.configureTestingModule({
      imports: [NgbModalModule, SettingsComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: InitService, useValue: initServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: NgbModal, useValue: modalServiceSpyObj },
        { provide: AuthGuard, useValue: authGuardMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: GoogleAnalyticsService, useValue: googleAnalyticsServiceMock },
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

  it('should track pageView on init', () => {
    expect(googleAnalyticsServiceMock.pageView).toHaveBeenCalledWith(
      '/settings',
      expect.any(String)
    );
  });

  describe('onSubmitEditPass', () => {
    const validModel = {
      passwordold: 'oldPassword',
      password1: 'testPassword',
      password2: 'testPassword',
    };
    const expectedBody = {
      passwordold: 'oldPassword',
      passwordnew: 'testPassword',
    };

    it('should call editPass and reset successPass after 10s on success', async () => {
      // Arrange
      vi.useFakeTimers();
      component.editPassModel.set(validModel);
      userServiceMock.editPass.mockReturnValue(of({ success: true, error: '' }));

      // Act
      await submit(component.editPassForm);

      // Assert
      expect(userServiceMock.editPass).toHaveBeenCalledWith(expectedBody);
      await vi.advanceTimersByTimeAsync(10000);
      expect(component.successPass()).toBe(false);

      vi.useRealTimers();
    });

    it('should set this.error when editPass returns a server error', async () => {
      // Arrange
      component.editPassModel.set(validModel);
      userServiceMock.editPass.mockReturnValue(
        of({ success: false, error: 'Invalid credentials' })
      );

      // Act
      await submit(component.editPassForm);

      // Assert
      expect(userServiceMock.editPass).toHaveBeenCalledWith(expectedBody);
      expect(component.error()).toBe('Invalid credentials');
    });

    it('should set this.error when the passwords are not identical (form invalid)', () => {
      // Signal Forms: password mismatch is handled by form validation
      // When passwords don't match, the form is invalid
      component.editPassModel.set({
        passwordold: 'oldPassword',
        password1: 'testPassword',
        password2: 'differentPassword',
      });

      // Form should be invalid due to password mismatch validation
      expect(component.editPassForm().invalid()).toBe(true);
    });

    it('should call initService.onMessageUnlog when editPass emits an error', async () => {
      // Signal Forms: set model values directly
      component.editPassModel.set({
        passwordold: 'oldPassword',
        password1: 'testPassword',
        password2: 'testPassword',
      });

      userServiceMock.editPass.mockReturnValue(throwError('error'));

      // Act
      await submit(component.editPassForm);

      // Assert
      expect(userServiceMock.editPass).toHaveBeenCalled();
      expect(initService.onMessageUnlog).toHaveBeenCalled();
    });
  });

  describe('onSubmitEditMail', () => {
    it('should call editMail and reset successMail after 10s on success', async () => {
      // Arrange
      vi.useFakeTimers();
      component.editMailModel.set({ mail: 'test@example.com' });
      userServiceMock.editMail.mockReturnValue(of({ success: true, error: '' }));

      // Act
      await submit(component.editMailForm);

      // Assert
      expect(userServiceMock.editMail).toHaveBeenCalledWith({ mail: 'test@example.com' });
      await vi.advanceTimersByTimeAsync(10000);
      expect(component.successMail()).toBe(false);

      vi.useRealTimers();
    });

    it('should set this.error when editMail returns a server error', async () => {
      // Arrange
      component.editMailModel.set({ mail: 'test@example.com' });
      userServiceMock.editMail.mockReturnValue(of({ success: false, error: 'Invalid email' }));

      // Act
      await submit(component.editMailForm);

      // Assert
      expect(component.error()).toBe('Invalid email');
    });

    it('should call initService.onMessageUnlog when editMail emits an error', async () => {
      // Signal Forms: set model values directly
      component.editMailModel.set({ mail: 'test@example.com' });

      const errorResponse = { success: false, error: 'Invalid email' };
      userServiceMock.editMail.mockReturnValue(throwError(errorResponse));

      // Act
      await submit(component.editMailForm);

      // Assert
      expect(userServiceMock.editMail).toHaveBeenCalledWith({ mail: 'test@example.com' });
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

  it('should call editLanguage with correct parameters and handle success response', async () => {
    // Signal Forms: set model values directly
    component.editLanguageModel.set({ language: 'en' });

    const mockResponse = { success: true } as UserReponse;
    userServiceMock.editLanguage.mockReturnValue(of(mockResponse));
    vi.useFakeTimers();

    await submit(component.editLanguageForm);

    expect(userServiceMock.editLanguage).toHaveBeenCalledWith({ language: 'en' });
    expect(component.successLanguage()).toBe(true);

    vi.advanceTimersByTime(10000);

    expect(component.successLanguage()).toBe(false);
  });

  it('should handle successful account deletion', async () => {
    vi.useFakeTimers();

    // Signal Forms: set model values directly
    component.deleteAccountModel.set({ password: 'testPassword' });

    const response = { success: true } as UserReponse;
    userServiceMock.deleteAccount.mockReturnValue(of(response));
    const logoutSpy = vi.spyOn(component.authStore, 'logout');

    await submit(component.deleteAccountForm);

    expect(userServiceMock.deleteAccount).toHaveBeenCalledWith({ password: 'testPassword' });
    expect(component.successDelete()).toBe(true);

    vi.advanceTimersByTime(10000);

    expect(component.successDelete()).toBe(false);
    expect(logoutSpy).toHaveBeenCalled();
  });

  // The three settings operations share the same error handling:
  // server error → component.error(), network error → initService.onMessageUnlog()
  const settingsOperations: [string, () => Mock, () => Promise<void>][] = [
    ['editDarkMode', () => userServiceMock.editDarkMode, async () => component.onSwitchDarkMode()],
    [
      'editLanguage',
      () => userServiceMock.editLanguage,
      async () => {
        component.editLanguageModel.set({ language: 'en' });
        await submit(component.editLanguageForm);
      },
    ],
    [
      'deleteAccount',
      () => userServiceMock.deleteAccount,
      async () => {
        component.deleteAccountModel.set({ password: 'testPassword' });
        await submit(component.deleteAccountForm);
      },
    ],
  ];

  it.each(settingsOperations)(
    'should set error message when %s returns a server error',
    async (_name, getMock, act) => {
      // Arrange
      getMock().mockReturnValue(of({ success: false, error: 'some_error' } as UserReponse));

      // Act
      await act();

      // Assert
      expect(component.error()).toBe('some_error');
    }
  );

  it.each(settingsOperations)(
    'should call initService.onMessageUnlog on %s network error',
    async (_name, getMock, act) => {
      // Arrange
      getMock().mockReturnValue(throwError(() => new Error('network')));

      // Act
      await act();

      // Assert
      expect(initServiceMock.onMessageUnlog).toHaveBeenCalled();
    }
  );

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
