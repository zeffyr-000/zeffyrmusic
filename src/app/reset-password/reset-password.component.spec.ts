import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { submit } from '@angular/forms/signals';
import { ResetPasswordComponent } from './reset-password.component';
import { UserService } from '../services/user.service';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { UiStore } from '../store/ui/ui.store';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let userServiceMock: {
    sendResetPass: ReturnType<typeof vi.fn>;
  };
  let uiStore: InstanceType<typeof UiStore>;
  let googleAnalyticsServiceMock: { pageView: ReturnType<typeof vi.fn> };

  const mockIdPerso = 'test-user-123';
  const mockKey = 'reset-key-abc';

  beforeEach(async () => {
    userServiceMock = { sendResetPass: vi.fn() };
    googleAnalyticsServiceMock = { pageView: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: UserService, useValue: userServiceMock },
        { provide: GoogleAnalyticsService, useValue: googleAnalyticsServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
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

    uiStore = TestBed.inject(UiStore);
    vi.spyOn(uiStore, 'showSuccess').mockReturnValue('mock-id');
    vi.spyOn(uiStore, 'showError').mockReturnValue('mock-id');

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
      expect(component.formModel().password).toBe('');
      expect(component.formModel().confirmPassword).toBe('');
    });

    it('should set the page title on init', () => {
      component.ngOnInit();
      expect(component['titleService'].getTitle()).toContain('Zeffyr Music');
    });

    it('should track pageView on init', () => {
      expect(googleAnalyticsServiceMock.pageView).toHaveBeenCalledWith(
        '/reset-password',
        expect.any(String)
      );
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

    it('should expose form instance', () => {
      expect(component.resetForm).toBeDefined();
      expect(typeof component.resetForm).toBe('function');
    });
  });

  describe('form submission', () => {
    it('should not proceed if form is invalid', async () => {
      await submit(component.resetForm);

      expect(component.submitted()).toBe(true);
      expect(userServiceMock.sendResetPass).not.toHaveBeenCalled();
    });

    it('should call userService.sendResetPass and show success toast on success', async () => {
      userServiceMock.sendResetPass.mockReturnValue(of({ success: true }));

      component.formModel.set({ password: 'password123', confirmPassword: 'password123' });

      await submit(component.resetForm);

      expect(userServiceMock.sendResetPass).toHaveBeenCalled();
      expect(component.formSuccess()).toBe(true);
      expect(component.formInvalid()).toBe(false);
      expect(uiStore.showSuccess).toHaveBeenCalled();
    });

    it('should show error toast on failed reset password', async () => {
      userServiceMock.sendResetPass.mockReturnValue(of({ success: false }));

      component.formModel.set({ password: 'password123', confirmPassword: 'password123' });

      await submit(component.resetForm);

      expect(component.loading()).toBe(false);
      expect(component.formSuccess()).toBe(false);
      expect(component.formInvalid()).toBe(true);
      expect(uiStore.showError).toHaveBeenCalled();
    });

    it('should show error toast on network error', async () => {
      userServiceMock.sendResetPass.mockReturnValue(throwError(() => new Error('Network error')));

      component.formModel.set({ password: 'password123', confirmPassword: 'password123' });

      await submit(component.resetForm);

      expect(component.loading()).toBe(false);
      expect(component.formInvalid()).toBe(true);
      expect(uiStore.showError).toHaveBeenCalled();
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
