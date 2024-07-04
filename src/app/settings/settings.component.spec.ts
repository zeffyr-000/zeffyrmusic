import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { NgbActiveModal, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { InitService } from '../services/init.service';
import { UserService } from '../services/user.service';
import { getTranslocoModule } from '../transloco-testing.module';
import { SettingsComponent } from './settings.component'
import { AuthGuard } from '../services/auth-guard.service';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let initService: InitService;
  let translocoService: TranslocoService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let modalService: NgbModal;
  let userServiceMock: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    const initServiceMock = jasmine.createSpyObj('InitService', ['loginSuccess', 'logOut', 'onMessageUnlog']);

    userServiceMock = jasmine.createSpyObj('UserService', ['register', 'login', 'resetPass', 'editPass', 'editMail', 'createPlaylist', 'logout', 'editTitlePlaylist']);
    const modalServiceSpyObj = jasmine.createSpyObj('NgbModal', ['open']);
    const activeModalSpyObj = jasmine.createSpyObj('NgbActiveModal', ['dismiss']);
    const authGuardMock = jasmine.createSpyObj('AuthGuard', ['canActivate']);

    initServiceMock.subjectConnectedChange = new BehaviorSubject({ isConnected: true, pseudo: '', id_perso: '' });
    initServiceMock.logOut = jasmine.createSpy('logOut');

    await TestBed.configureTestingModule({
      imports: [
        NgbModalModule,
        getTranslocoModule()
      ],
      declarations: [SettingsComponent],
      providers: [
        { provide: InitService, useValue: initServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: NgbModal, useValue: modalServiceSpyObj },
        { provide: NgbActiveModal, useValue: activeModalSpyObj },
        { provide: AuthGuard, useValue: authGuardMock },
      ],
      schemas: [NO_ERRORS_SCHEMA]
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
            passwordold: 'oldPassword'
          }
        }
      } as NgForm;
      const successResponse = { success: true, error: '' };
      const errorResponse = { success: false, error: 'Invalid credentials' };
      const expectedBody = {
        passwordold: 'oldPassword',
        passwordnew: 'testPassword'
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
            passwordold: 'oldPassword'
          }
        }
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
            passwordold: 'oldPassword'
          }
        }
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
            email: 'testEmail'
          }
        }
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
            email: 'testEmail'
          }
        }
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

});
