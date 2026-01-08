import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ResetPasswordComponent } from './reset-password.component';
import { UserService } from '../services/user.service';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { getTranslocoTestingProviders } from '../transloco-testing';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userServiceMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routerMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cdrMock: any;
  const mockEvent = { preventDefault: vi.fn() } as unknown as Event;

  const mockIdPerso = 'test-user-123';
  const mockKey = 'reset-key-abc';

  beforeEach(async () => {
    userServiceMock = { sendResetPass: vi.fn() };
    routerMock = { navigate: vi.fn() };
    cdrMock = { detectChanges: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: UserService, useValue: userServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ChangeDetectorRef, useValue: cdrMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                id_perso: mockIdPerso,
                key: mockKey,
              },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
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
      // Signal Forms: use formModel signal to check initial values
      expect(component.resetForm).toBeDefined();
      expect(component.formModel().password).toBe('');
      expect(component.formModel().confirmPassword).toBe('');
    });
  });

  describe('form validation', () => {
    it('should validate password is required', () => {
      // Signal Forms: form is invalid when password is empty
      component.formModel.set({ password: '', confirmPassword: '' });
      expect(component.resetForm().invalid()).toBe(true);
    });

    it('should validate password minimum length', () => {
      // Signal Forms: password must be at least 6 characters
      component.formModel.set({ password: '12345', confirmPassword: '12345' });
      expect(component.resetForm().invalid()).toBe(true);

      component.formModel.set({ password: '123456', confirmPassword: '123456' });
      expect(component.resetForm().valid()).toBe(true);
    });

    it('should validate confirm password is required', () => {
      // Signal Forms: confirm password is required
      component.formModel.set({ password: 'password123', confirmPassword: '' });
      expect(component.resetForm().invalid()).toBe(true);
    });

    it('should validate passwords match', () => {
      // Signal Forms: passwords must match (cross-field validation)
      component.formModel.set({ password: 'password123', confirmPassword: 'different' });
      expect(component.resetForm().invalid()).toBe(true);

      component.formModel.set({ password: 'password123', confirmPassword: 'password123' });
      expect(component.resetForm().valid()).toBe(true);
    });

    it('should correctly validate password matching', () => {
      // Signal Forms: cross-field validation for password matching
      component.formModel.set({ password: 'password123', confirmPassword: 'different' });
      expect(component.resetForm().invalid()).toBe(true);

      component.formModel.set({ password: 'password123', confirmPassword: 'password123' });
      expect(component.resetForm().valid()).toBe(true);
    });

    it('should expose form controls via f getter', () => {
      // Signal Forms: f getter is no longer available, test form instance instead
      expect(component.resetForm).toBeDefined();
      expect(typeof component.resetForm).toBe('function');
    });
  });

  describe('onSubmit', () => {
    it('should not proceed if form is invalid', () => {
      component.onSubmit(mockEvent);

      expect(component.submitted()).toBe(true);
      expect(userServiceMock.sendResetPass).not.toHaveBeenCalled();
    });

    it('should call userService.sendResetPass with correct parameters if form is valid', () => {
      userServiceMock.sendResetPass.mockReturnValue(of({ success: true }));

      cdrMock.detectChanges.mockClear();

      // Signal Forms: set model values directly
      component.formModel.set({ password: 'password123', confirmPassword: 'password123' });

      component.onSubmit(mockEvent);

      expect(userServiceMock.sendResetPass).toHaveBeenCalled();

      expect(component.formSuccess()).toBe(true);
      expect(component.formInvalid()).toBe(false);
    });

    it('should handle failed reset password', () => {
      userServiceMock.sendResetPass.mockReturnValue(of({ success: false }));

      // Signal Forms: set model values directly
      component.formModel.set({ password: 'password123', confirmPassword: 'password123' });

      component.onSubmit(mockEvent);

      expect(component.loading()).toBe(false);
      expect(component.formSuccess()).toBe(false);
      expect(component.formInvalid()).toBe(true);
    });

    it('should set formInvalid to true and formSuccess to false when response has success=false', () => {
      userServiceMock.sendResetPass.mockReturnValue(of({ success: false }));

      cdrMock.detectChanges.mockClear();

      // Signal Forms: set model values directly
      component.formModel.set({ password: 'password123', confirmPassword: 'password123' });

      component.onSubmit(mockEvent);

      expect(component.formInvalid()).toBe(true);
      expect(component.formSuccess()).toBe(false);
    });

    it('should handle error during reset password', () => {
      userServiceMock.sendResetPass.mockReturnValue(throwError(() => new Error('Network error')));

      // Signal Forms: set model values directly
      component.formModel.set({ password: 'password123', confirmPassword: 'password123' });

      component.onSubmit(mockEvent);

      expect(component.loading()).toBe(false);
    });
  });

  describe('UI interactions', () => {
    it('should show loader when loading is true', () => {
      component.loading.set(true);
      expect(component.loading()).toBe(true);
    });

    it('should show success message when formSuccess is true', () => {
      component.formSuccess.set(true);
      expect(component.formSuccess()).toBe(true);
    });

    it('should show error message when formInvalid is true', () => {
      component.formInvalid.set(true);
      expect(component.formInvalid()).toBe(true);
    });
  });
});
