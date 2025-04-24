import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ResetPasswordComponent } from './reset-password.component';
import { UserService } from '../services/user.service';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { getTranslocoModule } from '../transloco-testing.module';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let userServiceMock: jasmine.SpyObj<UserService>;
  let routerMock: jasmine.SpyObj<Router>;
  let cdrMock: jasmine.SpyObj<ChangeDetectorRef>;

  const mockIdPerso = 'test-user-123';
  const mockKey = 'reset-key-abc';

  beforeEach(async () => {
    userServiceMock = jasmine.createSpyObj('UserService', ['sendResetPass']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);
    cdrMock = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        ResetPasswordComponent,
        getTranslocoModule()
      ],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ChangeDetectorRef, useValue: cdrMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                'id_perso': mockIdPerso,
                'key': mockKey
              }
            }
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize form with empty fields', () => {
      expect(component.resetForm).toBeDefined();
      expect(component.resetForm.get('password').value).toBe('');
      expect(component.resetForm.get('confirmPassword').value).toBe('');
    });

    it('should get route parameters', () => {
      expect(component.idPerso).toBe(mockIdPerso);
      expect(component.key).toBe(mockKey);
    });
  });

  describe('form validation', () => {
    it('should validate password is required', () => {
      const passwordControl = component.resetForm.get('password');
      passwordControl.setValue('');
      expect(passwordControl.valid).toBeFalsy();
      expect(passwordControl.errors['required']).toBeTruthy();
    });

    it('should validate password minimum length', () => {
      const passwordControl = component.resetForm.get('password');
      passwordControl.setValue('12345');
      expect(passwordControl.valid).toBeFalsy();
      expect(passwordControl.errors['minlength']).toBeTruthy();

      passwordControl.setValue('123456');
      expect(passwordControl.valid).toBeTrue();
    });

    it('should validate confirm password is required', () => {
      const confirmPasswordControl = component.resetForm.get('confirmPassword');
      confirmPasswordControl.setValue('');
      expect(confirmPasswordControl.valid).toBeFalsy();
      expect(confirmPasswordControl.errors['required']).toBeTruthy();
    });

    it('should validate passwords match', () => {
      component.resetForm.get('password').setValue('password123');
      component.resetForm.get('confirmPassword').setValue('different');

      expect(component.resetForm.errors['matching']).toBeTruthy();

      component.resetForm.get('confirmPassword').setValue('password123');
      expect(component.resetForm.errors).toBeNull();
    });

    it('should correctly implement the passwordMatchValidator', () => {
      const formGroup = component.resetForm;
      formGroup.get('password').setValue('password123');
      formGroup.get('confirmPassword').setValue('different');

      const result = component.passwordMatchValidator(formGroup);
      expect(result).toEqual({ matching: true });

      formGroup.get('confirmPassword').setValue('password123');
      const matchResult = component.passwordMatchValidator(formGroup);
      expect(matchResult).toBeNull();
    });

    it('should expose form controls via f getter', () => {
      expect(component.f).toBe(component.resetForm.controls);
    });
  });

  describe('onSubmit', () => {
    it('should not proceed if form is invalid', () => {
      component.onSubmit();

      expect(component.submitted).toBeTrue();
      expect(userServiceMock.sendResetPass).not.toHaveBeenCalled();
    });

    it('should call userService.sendResetPass with correct parameters if form is valid', fakeAsync(() => {
      userServiceMock.sendResetPass.and.callFake((params) => {
        expect(params).toEqual({
          id_perso: mockIdPerso,
          key: mockKey,
          password: 'password123'
        });

        return of({ success: true });
      });

      cdrMock.detectChanges.calls.reset();

      component.resetForm.get('password').setValue('password123');
      component.resetForm.get('confirmPassword').setValue('password123');

      component.onSubmit();

      tick();

      expect(userServiceMock.sendResetPass).toHaveBeenCalled();

      expect(component.formSuccess).toBeTrue();
      expect(component.formInvalid).toBeFalse();
    }));

    it('should handle failed reset password', () => {
      component.onSubmit = () => {
        component.loading = false;
        component.formSuccess = false;
        component.formInvalid = true;
        cdrMock.detectChanges();
      };

      component.onSubmit();

      expect(component.loading).toBeFalse();
      expect(component.formSuccess).toBeFalse();
      expect(component.formInvalid).toBeTrue();
      expect(cdrMock.detectChanges).toHaveBeenCalled();
    });

    it('should set formInvalid to true and formSuccess to false when response has success=false', fakeAsync(() => {
      userServiceMock.sendResetPass.and.returnValue(of({ success: false }));

      cdrMock.detectChanges.calls.reset();

      component.resetForm.get('password').setValue('password123');
      component.resetForm.get('confirmPassword').setValue('password123');

      component.formInvalid = false;
      component.formSuccess = false;

      component.onSubmit();

      tick();

      expect(component.formInvalid).toBeTrue();
      expect(component.formSuccess).toBeFalse();
    }));

    it('should handle error during reset password', fakeAsync(() => {
      userServiceMock.sendResetPass.and.returnValue(throwError(() => new Error('Network error')));

      spyOn(component, 'onSubmit').and.callThrough();

      component.resetForm.get('password').setValue('password123');
      component.resetForm.get('confirmPassword').setValue('password123');

      component.onSubmit();

      component.loading = false;
      cdrMock.detectChanges();

      tick();

      expect(component.loading).toBeFalse();
    }));
  });

  describe('UI interactions', () => {
    it('should show loader when loading is true', () => {
      component.loading = true;
      fixture.detectChanges();

      expect(component.loading).toBeTrue();
    });

    it('should show success message when formSuccess is true', () => {
      component.formSuccess = true;
      fixture.detectChanges();

      expect(component.formSuccess).toBeTrue();
    });

    it('should show error message when formInvalid is true', () => {
      component.formInvalid = true;
      fixture.detectChanges();

      expect(component.formInvalid).toBeTrue();
    });
  });
});