import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, ApplicationRef } from '@angular/core';
import { PageLifecycleService, ResumeEvent, ResumeSource } from './page-lifecycle.service';

describe('PageLifecycleService', () => {
  describe('Browser environment', () => {
    let service: PageLifecycleService;
    let appRefMock: { tick: ReturnType<typeof vi.fn> };
    let windowEventListeners: Map<string, EventListener>;
    let documentEventListeners: Map<string, EventListener>;
    let originalAddEventListener: typeof window.addEventListener;
    let originalDocumentAddEventListener: typeof document.addEventListener;

    beforeEach(() => {
      windowEventListeners = new Map();
      documentEventListeners = new Map();

      // Mock window.addEventListener
      originalAddEventListener = window.addEventListener;
      window.addEventListener = vi.fn((event: string, handler: EventListener) => {
        windowEventListeners.set(event, handler);
      }) as typeof window.addEventListener;

      // Mock document.addEventListener
      originalDocumentAddEventListener = document.addEventListener;
      document.addEventListener = vi.fn((event: string, handler: EventListener) => {
        documentEventListeners.set(event, handler);
      }) as typeof document.addEventListener;

      appRefMock = { tick: vi.fn() };

      TestBed.configureTestingModule({
        providers: [
          PageLifecycleService,
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: ApplicationRef, useValue: appRefMock },
        ],
      });

      service = TestBed.inject(PageLifecycleService);
    });

    afterEach(() => {
      window.addEventListener = originalAddEventListener;
      document.addEventListener = originalDocumentAddEventListener;
      vi.clearAllMocks();
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should register event listeners in browser environment', () => {
      expect(windowEventListeners.has('pageshow')).toBe(true);
      expect(windowEventListeners.has('online')).toBe(true);
      expect(documentEventListeners.has('visibilitychange')).toBe(true);
    });

    describe('resumed$ observable', () => {
      it('should emit on bfcache restoration', () => {
        const resumeSpy = vi.fn();
        service.resumed$.subscribe(resumeSpy);

        const pageshowHandler = windowEventListeners.get('pageshow')!;
        pageshowHandler({ persisted: true } as PageTransitionEvent);

        expect(resumeSpy).toHaveBeenCalledTimes(1);
        expect(resumeSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            source: 'bfcache',
            wasFromCache: true,
          })
        );
      });

      it('should NOT emit on pageshow without persisted flag', () => {
        const resumeSpy = vi.fn();
        service.resumed$.subscribe(resumeSpy);

        const pageshowHandler = windowEventListeners.get('pageshow')!;
        pageshowHandler({ persisted: false } as PageTransitionEvent);

        expect(resumeSpy).not.toHaveBeenCalled();
      });

      it('should emit on visibility change to visible', () => {
        const resumeSpy = vi.fn();
        service.resumed$.subscribe(resumeSpy);

        // Mock document.visibilityState
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true,
          configurable: true,
        });

        const visibilityHandler = documentEventListeners.get('visibilitychange')!;
        visibilityHandler(new Event('visibilitychange'));

        expect(resumeSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            source: 'visibility',
          })
        );
      });

      it('should NOT emit on visibility change to hidden', () => {
        const resumeSpy = vi.fn();
        service.resumed$.subscribe(resumeSpy);

        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true,
          configurable: true,
        });

        const visibilityHandler = documentEventListeners.get('visibilitychange')!;
        visibilityHandler(new Event('visibilitychange'));

        expect(resumeSpy).not.toHaveBeenCalled();
      });

      it('should emit on online event', () => {
        const resumeSpy = vi.fn();
        service.resumed$.subscribe(resumeSpy);

        const onlineHandler = windowEventListeners.get('online')!;
        onlineHandler(new Event('online'));

        expect(resumeSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            source: 'online',
            wasFromCache: false,
          })
        );
      });
    });

    describe('debouncing', () => {
      it('should debounce rapid resume events within 1000ms', () => {
        vi.useFakeTimers();
        const resumeSpy = vi.fn();
        service.resumed$.subscribe(resumeSpy);

        const onlineHandler = windowEventListeners.get('online')!;

        // First event should emit
        onlineHandler(new Event('online'));
        expect(resumeSpy).toHaveBeenCalledTimes(1);

        // Rapid second event within debounce window should be ignored
        vi.advanceTimersByTime(500);
        onlineHandler(new Event('online'));
        expect(resumeSpy).toHaveBeenCalledTimes(1);

        // Event after debounce window should emit
        vi.advanceTimersByTime(1001);
        onlineHandler(new Event('online'));
        expect(resumeSpy).toHaveBeenCalledTimes(2);

        vi.useRealTimers();
      });
    });

    describe('forceChangeDetection', () => {
      it('should call ApplicationRef.tick in browser', async () => {
        service.forceChangeDetection();

        // Wait for setTimeout to execute
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(appRefMock.tick).toHaveBeenCalled();
      });

      it('should be called after resume event', async () => {
        const onlineHandler = windowEventListeners.get('online')!;
        onlineHandler(new Event('online'));

        // Wait for setTimeout to execute
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(appRefMock.tick).toHaveBeenCalled();
      });
    });

    describe('isStandalonePwa', () => {
      it('should return false when not in standalone mode', () => {
        // Default mock returns false for matchMedia
        Object.defineProperty(window, 'matchMedia', {
          value: vi.fn().mockReturnValue({ matches: false }),
          writable: true,
          configurable: true,
        });

        expect(service.isStandalonePwa()).toBe(false);
      });

      it('should return true when display-mode is standalone', () => {
        Object.defineProperty(window, 'matchMedia', {
          value: vi.fn().mockReturnValue({ matches: true }),
          writable: true,
          configurable: true,
        });

        expect(service.isStandalonePwa()).toBe(true);
      });

      it('should return true when navigator.standalone is true (iOS Safari)', () => {
        Object.defineProperty(window, 'matchMedia', {
          value: vi.fn().mockReturnValue({ matches: false }),
          writable: true,
          configurable: true,
        });
        Object.defineProperty(window.navigator, 'standalone', {
          value: true,
          writable: true,
          configurable: true,
        });

        expect(service.isStandalonePwa()).toBe(true);
      });
    });

    describe('ResumeEvent structure', () => {
      it('should include timestamp in resume event', () => {
        const resumeSpy = vi.fn();
        service.resumed$.subscribe(resumeSpy);

        const beforeTime = Date.now();

        const onlineHandler = windowEventListeners.get('online')!;
        onlineHandler(new Event('online'));

        const afterTime = Date.now();

        const event: ResumeEvent = resumeSpy.mock.calls[0][0];
        expect(event.timestamp).toBeGreaterThanOrEqual(beforeTime);
        expect(event.timestamp).toBeLessThanOrEqual(afterTime);
      });

      it('should correctly type source as ResumeSource', () => {
        const resumeSpy = vi.fn();
        service.resumed$.subscribe(resumeSpy);

        const onlineHandler = windowEventListeners.get('online')!;
        onlineHandler(new Event('online'));

        const event: ResumeEvent = resumeSpy.mock.calls[0][0];
        const validSources: ResumeSource[] = ['bfcache', 'visibility', 'lifecycle', 'online'];
        expect(validSources).toContain(event.source);
      });
    });
  });

  describe('Server environment', () => {
    let service: PageLifecycleService;
    let appRefMock: { tick: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      appRefMock = { tick: vi.fn() };

      TestBed.configureTestingModule({
        providers: [
          PageLifecycleService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: ApplicationRef, useValue: appRefMock },
        ],
      });

      service = TestBed.inject(PageLifecycleService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should NOT call forceChangeDetection on server', async () => {
      service.forceChangeDetection();

      // Wait for potential setTimeout to execute
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(appRefMock.tick).not.toHaveBeenCalled();
    });

    it('should return false for isStandalonePwa on server', () => {
      expect(service.isStandalonePwa()).toBe(false);
    });
  });
});
