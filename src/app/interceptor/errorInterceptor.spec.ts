import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './errorInterceptor';
import { AuthStore } from '../store/auth/auth.store';
import { UiStore } from '../store/ui/ui.store';
import { TranslocoService } from '@jsverse/transloco';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authStore: InstanceType<typeof AuthStore>;
  let uiStore: InstanceType<typeof UiStore>;

  const translocoMock = {
    translate: vi.fn((key: string) => key),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        AuthStore,
        UiStore,
        { provide: TranslocoService, useValue: translocoMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    authStore = TestBed.inject(AuthStore);
    uiStore = TestBed.inject(UiStore);
  });

  it('should pass through successful requests', () => {
    http.get('/api/test').subscribe(data => {
      expect(data).toEqual({ ok: true });
    });

    httpTesting.expectOne('/api/test').flush({ ok: true });
  });

  it('should handle 401 by logging out and showing session expired', () => {
    const logoutSpy = vi.spyOn(authStore, 'logout');
    const sessionSpy = vi.spyOn(uiStore, 'showSessionExpired');

    http.get('/api/test').subscribe({ error: () => undefined });

    httpTesting.expectOne('/api/test').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(logoutSpy).toHaveBeenCalled();
    expect(sessionSpy).toHaveBeenCalled();
  });

  it('should handle 403 by showing error toast', () => {
    const showErrorSpy = vi.spyOn(uiStore, 'showError');

    http.get('/api/test').subscribe({ error: () => undefined });

    httpTesting.expectOne('/api/test').flush(null, { status: 403, statusText: 'Forbidden' });

    expect(showErrorSpy).toHaveBeenCalledWith('generic_error');
  });

  it('should handle 500 by showing error toast', () => {
    const showErrorSpy = vi.spyOn(uiStore, 'showError');

    http.get('/api/test').subscribe({ error: () => undefined });

    httpTesting
      .expectOne('/api/test')
      .flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(showErrorSpy).toHaveBeenCalledWith('generic_error');
  });

  it('should skip ping requests', () => {
    const showErrorSpy = vi.spyOn(uiStore, 'showError');
    const logoutSpy = vi.spyOn(authStore, 'logout');

    http.get('/api/ping').subscribe({ error: () => undefined });

    httpTesting
      .expectOne('/api/ping')
      .flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(showErrorSpy).not.toHaveBeenCalled();
    expect(logoutSpy).not.toHaveBeenCalled();
  });

  it('should re-throw the error for downstream handling', () => {
    let caughtError = false;

    http.get('/api/test').subscribe({
      error: () => {
        caughtError = true;
      },
    });

    httpTesting.expectOne('/api/test').flush(null, { status: 403, statusText: 'Forbidden' });

    expect(caughtError).toBe(true);
  });
});
