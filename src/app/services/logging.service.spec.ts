import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LoggingService } from './logging.service';
import { SENTRY_API } from '../tokens';

function createSentryMock() {
  const scopeSpy = { setExtra: vi.fn(), setFingerprint: vi.fn() };
  return {
    scopeSpy,
    withScope: vi.fn((callback: (scope: unknown) => void) => {
      callback(scopeSpy);
    }),
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    setUser: vi.fn(),
    addBreadcrumb: vi.fn(),
    setTag: vi.fn(),
  };
}

describe('LoggingService', () => {
  let service: LoggingService;
  let sentryMock: ReturnType<typeof createSentryMock>;

  beforeEach(() => {
    sentryMock = createSentryMock();

    TestBed.configureTestingModule({
      providers: [LoggingService, { provide: SENTRY_API, useValue: sentryMock }],
    });
    service = TestBed.inject(LoggingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('captureError', () => {
    it('should call Sentry.captureException', () => {
      const error = new Error('test error');
      service.captureError(error);

      expect(sentryMock.withScope).toHaveBeenCalled();
      expect(sentryMock.captureException).toHaveBeenCalledWith(error);
    });

    it('should set extras from context', () => {
      const error = new Error('test error');
      service.captureError(error, { 'http.url': '/api/test', 'http.status_code': 500 });

      expect(sentryMock.withScope).toHaveBeenCalled();
      expect(sentryMock.scopeSpy.setExtra).toHaveBeenCalledWith('http.url', '/api/test');
      expect(sentryMock.scopeSpy.setExtra).toHaveBeenCalledWith('http.status_code', 500);
    });
  });

  describe('captureWarning fingerprint', () => {
    it('should pass fingerprint to scope when provided', () => {
      service.captureWarning('YouTube Player Error: code 5', undefined, ['youtube-error', '5']);

      expect(sentryMock.scopeSpy.setFingerprint).toHaveBeenCalledWith(['youtube-error', '5']);
    });

    it('should not call setFingerprint when fingerprint is undefined', () => {
      service.captureWarning('plain warning');

      expect(sentryMock.scopeSpy.setFingerprint).not.toHaveBeenCalled();
    });

    it('should not call setFingerprint when fingerprint is an empty array', () => {
      service.captureWarning('plain warning', undefined, []);

      expect(sentryMock.scopeSpy.setFingerprint).not.toHaveBeenCalled();
    });
  });

  describe('captureWarning', () => {
    it('should call Sentry.captureMessage with warning level', () => {
      service.captureWarning('YouTube Player Error');

      expect(sentryMock.withScope).toHaveBeenCalled();
      expect(sentryMock.captureMessage).toHaveBeenCalledWith('YouTube Player Error', 'warning');
    });
  });

  describe('captureInfo', () => {
    it('should call Sentry.captureMessage with info level', () => {
      service.captureInfo('User navigated');

      expect(sentryMock.withScope).toHaveBeenCalled();
      expect(sentryMock.captureMessage).toHaveBeenCalledWith('User navigated', 'info');
    });

    it('should set extras from context', () => {
      service.captureInfo('event', { page: '/home', source: 'nav' });

      expect(sentryMock.withScope).toHaveBeenCalled();
      expect(sentryMock.scopeSpy.setExtra).toHaveBeenCalledWith('page', '/home');
      expect(sentryMock.scopeSpy.setExtra).toHaveBeenCalledWith('source', 'nav');
    });
  });

  describe('setUser', () => {
    it('should set user with id', () => {
      service.setUser({ id: '123' });
      expect(sentryMock.setUser).toHaveBeenCalledWith({ id: '123' });
    });

    it('should clear user with null', () => {
      service.setUser(null);
      expect(sentryMock.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('addBreadcrumb', () => {
    it('should add a breadcrumb', () => {
      service.addBreadcrumb('clicked button', 'ui', { buttonId: 'play' });

      expect(sentryMock.addBreadcrumb).toHaveBeenCalledWith({
        message: 'clicked button',
        category: 'ui',
        data: { buttonId: 'play' },
        level: 'info',
      });
    });
  });

  describe('setTag', () => {
    it('should set a tag', () => {
      service.setTag('environment', 'production');
      expect(sentryMock.setTag).toHaveBeenCalledWith('environment', 'production');
    });
  });
});

describe('LoggingService (SSR — no SENTRY_API provided)', () => {
  let service: LoggingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggingService],
    });
    service = TestBed.inject(LoggingService);
  });

  it('should not throw when captureError is called without Sentry', () => {
    expect(() => service.captureError(new Error('test'))).not.toThrow();
  });

  it('should not throw when captureWarning is called without Sentry', () => {
    expect(() => service.captureWarning('warn')).not.toThrow();
  });

  it('should not throw when captureInfo is called without Sentry', () => {
    expect(() => service.captureInfo('info')).not.toThrow();
  });

  it('should not throw when setUser is called without Sentry', () => {
    expect(() => service.setUser({ id: '123' })).not.toThrow();
  });

  it('should not throw when addBreadcrumb is called without Sentry', () => {
    expect(() => service.addBreadcrumb('msg', 'cat')).not.toThrow();
  });

  it('should not throw when setTag is called without Sentry', () => {
    expect(() => service.setTag('key', 'value')).not.toThrow();
  });
});
