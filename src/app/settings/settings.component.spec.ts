import { ChangeDetectorRef, NO_ERRORS_SCHEMA, TemplateRef } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { NgbActiveModal, NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { InitService } from '../services/init.service';
import { UserService } from '../services/user.service';
import { getTranslocoModule } from '../transloco-testing.module';
import { SettingsComponent } from './settings.component';
import { AuthGuard } from '../services/auth-guard.service';
import { UserReponse } from '../models/user.model';
import { environment } from 'src/environments/environment';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let initService: InitService;
  let translocoService: TranslocoService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;

  let modalService: NgbModal;
  let userServiceMock: jasmine.SpyObj<UserService>;
  let initServiceMock: jasmine.SpyObj<InitService>;
  let modalServiceSpyObj: jasmine.SpyObj<NgbModal>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let cdrMock: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    initServiceMock = jasmine.createSpyObj('InitService', [
      'loginSuccess',
      'logOut',
      'onMessageUnlog',
    ]);

    userServiceMock = jasmine.createSpyObj('UserService', [
      'register',
      'login',
      'resetPass',
      'editPass',
      'editMail',
      'createPlaylist',
      'logout',
      'editTitlePlaylist',
      'editDarkMode',
      'editLanguage',
      'deleteAccount',
      'associateGoogleAccount',
    ]);
    modalServiceSpyObj = jasmine.createSpyObj('NgbModal', ['open']);
    const activeModalSpyObj = jasmine.createSpyObj('NgbActiveModal', ['dismiss']);
    const authGuardMock = jasmine.createSpyObj('AuthGuard', ['canActivate']);

    initServiceMock.subjectConnectedChange = new BehaviorSubject({
      isConnected: true,
      pseudo: '',
      idPerso: '',
      mail: '',
      darkModeEnabled: false,
      language: 'fr',
    });
    initServiceMock.logOut = jasmine.createSpy('logOut');
    cdrMock = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      imports: [NgbModalModule, getTranslocoModule(), SettingsComponent],
      providers: [
        { provide: InitService, useValue: initServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: NgbModal, useValue: modalServiceSpyObj },
        { provide: NgbActiveModal, useValue: activeModalSpyObj },
        { provide: AuthGuard, useValue: authGuardMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    initService = TestBed.inject(InitService);
    activeModalSpy = TestBed.inject(NgbActiveModal) as jasmine.SpyObj<NgbActiveModal>;
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
    jasmine.clock().uninstall();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).google;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onSubmitEditPass', () => {
    it('should call httpClient.post with the correct arguments and update this.successPass or this.error based on the server response', fakeAsync(() => {
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

      userServiceMock.editPass.and.returnValue(of(successResponse));

      // Act
      component.onSubmitEditPass(form);

      // Assert
      expect(userServiceMock.editPass).toHaveBeenCalledWith(expectedBody);
      tick(10000);
      expect(component.successPass).toBe(false);

      userServiceMock.editPass.and.returnValue(of(errorResponse));
      // Act
      component.onSubmitEditPass(form);

      // Assert
      expect(userServiceMock.editPass).toHaveBeenCalledWith(expectedBody);
      expect(component.error).toBe('Invalid credentials');
    }));

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
      expect(component.error).toBe('Confirmation password is incorrect');
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
      userServiceMock.editPass.and.returnValue(throwError('error'));

      // Act
      component.onSubmitEditPass(form);

      // Assert
      expect(userServiceMock.editPass).toHaveBeenCalled();
      expect(component.isConnected).toBe(false);
      expect(initService.onMessageUnlog).toHaveBeenCalled();
    });
  });

  describe('onSubmitEditMail', () => {
    it('should call httpClient.post with the correct arguments and update this.successMail or this.error based on the server response', fakeAsync(() => {
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
      userServiceMock.editMail.and.returnValue(of(successResponse));

      // Act
      component.onSubmitEditMail(form);

      // Assert
      expect(userServiceMock.editMail).toHaveBeenCalledWith(form.form.value);
      tick(10000);
      expect(component.successMail).toBe(false);

      userServiceMock.editMail.and.returnValue(of(errorResponse));
      // Act
      component.onSubmitEditMail(form);

      // Assert
      expect(userServiceMock.editMail).toHaveBeenCalledWith(form.form.value);
      expect(component.error).toBe('Invalid email');
    }));

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
      userServiceMock.editMail.and.returnValue(throwError(errorResponse));

      // Act
      component.onSubmitEditMail(form);

      // Assert
      expect(userServiceMock.editMail).toHaveBeenCalledWith(form.form.value);
      expect(component.isConnected).toBe(false);
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
    userServiceMock.editDarkMode.and.returnValue(of(mockResponse));

    component.onSwitchDarkMode();

    expect(userServiceMock.editDarkMode).toHaveBeenCalledWith({
      dark_mode_enabled: component.darkModeEnabled,
    });
  });

  it('should set error message on failure', () => {
    const mockResponse = { success: false, error: 'some_error' } as UserReponse;
    userServiceMock.editDarkMode.and.returnValue(of(mockResponse));

    component.onSwitchDarkMode();

    expect(userServiceMock.editDarkMode).toHaveBeenCalledWith({
      dark_mode_enabled: component.darkModeEnabled,
    });
    expect(component.error).toBe('some_error');
  });

  it('should handle error response', () => {
    userServiceMock.editDarkMode.and.returnValue(throwError(() => new Error('error')));

    component.onSwitchDarkMode();

    expect(userServiceMock.editDarkMode).toHaveBeenCalledWith({
      dark_mode_enabled: component.darkModeEnabled,
    });
    expect(component.isConnected).toBeFalse();
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
    userServiceMock.editLanguage.and.returnValue(of(mockResponse));
    jasmine.clock().install();

    component.onSubmitEditLanguage(mockForm);

    expect(userServiceMock.editLanguage).toHaveBeenCalledWith(mockForm.form.value);
    expect(component.successLanguage).toBeTrue();

    jasmine.clock().tick(10000);

    expect(component.successLanguage).toBeFalse();
  });

  it('should handle error response correctly', () => {
    const mockForm = {
      valid: true,
      form: {
        value: { language: 'en' },
      },
    } as NgForm;

    const mockResponse = { success: false, error: 'Some error' } as UserReponse;
    userServiceMock.editLanguage.and.returnValue(of(mockResponse));

    component.onSubmitEditLanguage(mockForm);

    expect(userServiceMock.editLanguage).toHaveBeenCalledWith(mockForm.form.value);
    expect(component.error).toBe('Some error');
  });

  it('should handle HTTP error correctly', () => {
    const mockForm = {
      valid: true,
      form: {
        value: { language: 'en' },
      },
    } as NgForm;

    userServiceMock.editLanguage.and.returnValue(throwError(() => new Error('HTTP error')));

    component.onSubmitEditLanguage(mockForm);

    expect(userServiceMock.editLanguage).toHaveBeenCalledWith(mockForm.form.value);
    expect(component.isConnected).toBeFalse();
    expect(initServiceMock.onMessageUnlog).toHaveBeenCalled();
  });

  it('should handle successful account deletion', () => {
    jasmine.clock().install();

    const form = {
      valid: true,
      form: {
        value: {
          /* form values */
        },
      },
    } as NgForm;

    const response = { success: true } as UserReponse;
    userServiceMock.deleteAccount.and.returnValue(of(response));

    component.onSubmitDeleteAccount(form);

    expect(userServiceMock.deleteAccount).toHaveBeenCalledWith(form.form.value);
    expect(component.successDelete).toBeTrue();

    jasmine.clock().tick(10000);

    expect(component.successDelete).toBeFalse();
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
    userServiceMock.deleteAccount.and.returnValue(of(response));

    component.onSubmitDeleteAccount(form);

    expect(userServiceMock.deleteAccount).toHaveBeenCalledWith(form.form.value);
    expect(component.successDelete).toBeFalse();
    expect(component.error).toBe('error_message');
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

    userServiceMock.deleteAccount.and.returnValue(throwError(() => new Error('Network error')));

    component.onSubmitDeleteAccount(form);

    expect(userServiceMock.deleteAccount).toHaveBeenCalledWith(form.form.value);
    expect(component.isConnected).toBeFalse();
    expect(initServiceMock.onMessageUnlog).toHaveBeenCalled();
  });

  it('should initialize Google Sign-In', () => {
    const googleMock = {
      accounts: {
        id: {
          initialize: jasmine.createSpy('initialize'),
        },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).google = googleMock;

    component.initializeGoogleSignIn();

    expect(googleMock.accounts.id.initialize).toHaveBeenCalledWith({
      client_id: environment.GOOGLE_CLIENT_ID,
      callback: jasmine.any(Function),
    });
  });

  it('should render Google Sign-In button', () => {
    const googleMock = {
      accounts: {
        id: {
          renderButton: jasmine.createSpy('renderButton'),
        },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).google = googleMock;
    const buttonElement = document.createElement('div');
    buttonElement.id = 'google-signin-button';
    document.body.appendChild(buttonElement);

    component.renderGoogleSignInButton();

    expect(googleMock.accounts.id.renderButton).toHaveBeenCalledWith(buttonElement, {});

    document.body.removeChild(buttonElement);
  });

  it('should open Google account modal and render Google Sign-In button in both success and error cases', fakeAsync(() => {
    const renderSpy = spyOn(component, 'renderGoogleSignInButton');

    let resolveCallback: () => void;
    const successPromise = new Promise<void>(resolve => {
      resolveCallback = resolve;
    });

    const modalRefSuccess = {
      result: successPromise,
    } as NgbModalRef;

    modalServiceSpyObj.open.and.returnValue(modalRefSuccess);

    component.openGoogleAccountModal();

    expect(modalServiceSpyObj.open).toHaveBeenCalledWith(
      component.contentModalAssociateGoogleAccount,
      { size: 'lg' }
    );

    resolveCallback!();
    tick();

    expect(component.renderGoogleSignInButton).toHaveBeenCalledTimes(2);

    renderSpy.calls.reset();
    modalServiceSpyObj.open.calls.reset();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rejectCallback: (reason?: any) => void;
    const errorPromise = new Promise<void>((_, reject) => {
      rejectCallback = reject;
    });

    const modalRefError = {
      result: errorPromise,
    } as NgbModalRef;

    modalServiceSpyObj.open.and.returnValue(modalRefError);

    component.openGoogleAccountModal();

    expect(modalServiceSpyObj.open).toHaveBeenCalledWith(
      component.contentModalAssociateGoogleAccount,
      { size: 'lg' }
    );

    rejectCallback!('Modal dismissed');
    tick();

    expect(renderSpy).toHaveBeenCalledTimes(2);
  }));

  it('should handle successful Google account association', () => {
    jasmine.clock().install();

    const response = { credential: 'test_credential' };
    const userResponse = { success: true } as UserReponse;

    userServiceMock.associateGoogleAccount.and.returnValue(of(userResponse));
    spyOn(component, 'renderGoogleSignInButton');

    component.handleCredentialResponse(response);

    expect(userServiceMock.associateGoogleAccount).toHaveBeenCalledWith({
      id_token: response.credential,
    });
    expect(component.successGoogleAccount).toBeTrue();

    jasmine.clock().tick(10000);
    expect(component.successGoogleAccount).toBeFalse();
  });

  it('should handle network error during Google account association', () => {
    const response = { success: false, error: 'error_message' } as UserReponse;

    userServiceMock.associateGoogleAccount.and.returnValue(of(response));

    component.handleCredentialResponse({ credential: 'test_credential' });

    expect(component.successGoogleAccount).toBeFalse();
  });
});
