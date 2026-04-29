import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './errorInterceptor';
import { AuthStore } from '../store/auth/auth.store';
import { UiStore } from '../store/ui/ui.store';
import { TranslocoService } from '@jsverse/transloco';
import { provideRouter } from '@angular/router';
import { InitService } from '../services/init.service';
import { LoggingService } from '../services/logging.service';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authStore: InstanceType<typeof AuthStore>;
  let uiStore: InstanceType<typeof UiStore>;
  let initService: InitService;

  const translocoMock = {
    translate: vi.fn((key: string) => key),
    setActiveLang: vi.fn(),
    getActiveLang: vi.fn(() => 'fr'),
  };

  const loggingServiceMock = {
    captureError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        AuthStore,
        UiStore,
        InitService,
        { provide: TranslocoService, useValue: translocoMock },
        { provide: LoggingService, useValue: loggingServiceMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    authStore = TestBed.inject(AuthStore);
    uiStore = TestBed.inject(UiStore);
    initService = TestBed.inject(InitService);
  });

  it('should pass through successful requests', () => {
    http.get('/api/test').subscribe(data => {
      expect(data).toEqual({ ok: true });
    });

    httpTesting.expectOne('/api/test').flush({ ok: true });
  });

  it('should handle 401 by calling onMessageUnlog when authenticated', () => {
    // User must be authenticated for the guard to pass
    authStore.login(
      { pseudo: 'test', idPerso: '1', mail: 'a@b.com', isAdmin: false },
      { darkModeEnabled: false, language: 'fr' }
    );
    const onMessageUnlogSpy = vi.spyOn(initService, 'onMessageUnlog');

    http.get('/api/test').subscribe({ error: () => undefined });

    httpTesting.expectOne('/api/test').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(onMessageUnlogSpy).toHaveBeenCalled();
  });

  it('should not call onMessageUnlog on 401 if already logged out', () => {
    authStore.initializeAnonymous();
    const onMessageUnlogSpy = vi.spyOn(initService, 'onMessageUnlog');

    http.get('/api/test').subscribe({ error: () => undefined });

    httpTesting.expectOne('/api/test').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(onMessageUnlogSpy).not.toHaveBeenCalled();
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

  it('should handle network error (status 0) by showing connection lost toast', () => {
    const showErrorSpy = vi.spyOn(uiStore, 'showError');

    http.get('/api/test').subscribe({ error: () => undefined });

    httpTesting.expectOne('/api/test').error(new ProgressEvent('error'));

    expect(showErrorSpy).toHaveBeenCalledWith('perte_connexion');
  });

  it('should report non-401 errors to LoggingService with sanitized URL', () => {
    http.get('/api/test?token=secret&page=1').subscribe({ error: () => undefined });

    httpTesting
      .expectOne('/api/test?token=secret&page=1')
      .flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(loggingServiceMock.captureError).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        'http.url': '/api/test',
        'http.status_code': 500,
      })
    );
  });

  it('should NOT report 401 errors to LoggingService', () => {
    http.get('/api/test').subscribe({ error: () => undefined });

    httpTesting.expectOne('/api/test').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(loggingServiceMock.captureError).not.toHaveBeenCalled();
  });

  it('should NOT report network errors (status 0) to LoggingService', () => {
    http.get('/api/test').subscribe({ error: () => undefined });

    httpTesting.expectOne('/api/test').error(new ProgressEvent('error'));

    expect(loggingServiceMock.captureError).not.toHaveBeenCalled();
  });

  it('should NOT report 404 GET errors to LoggingService (resource removed by user)', () => {
    http.get('/api/playlist/99999').subscribe({ error: () => undefined });

    httpTesting
      .expectOne('/api/playlist/99999')
      .flush(null, { status: 404, statusText: 'Not Found' });

    expect(loggingServiceMock.captureError).not.toHaveBeenCalled();
  });

  it('should report 404 errors on POST to LoggingService (likely a real bug)', () => {
    http.post('/api/playlist/save', {}).subscribe({ error: () => undefined });

    httpTesting
      .expectOne('/api/playlist/save')
      .flush(null, { status: 404, statusText: 'Not Found' });

    expect(loggingServiceMock.captureError).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        'http.method': 'POST',
        'http.status_code': 404,
      })
    );
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
