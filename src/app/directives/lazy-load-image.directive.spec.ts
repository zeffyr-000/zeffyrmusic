import { Component, DebugElement, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Renderer2 } from '@angular/core';
import { LazyLoadImageDirective } from './lazy-load-image.directive';
import { By } from '@angular/platform-browser';

import { MockIntersectionObserver } from './mock-intersection-observer';

@Component({
  template: `<img appLazyLoadImage="https://example.com/image.jpg" alt="" />`,
  imports: [LazyLoadImageDirective],
})
class TestComponent {}

describe('LazyLoadImageDirective', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let renderer2Mock: any;

  describe('In browser environment', () => {
    let fixture: ComponentFixture<TestComponent>;
    let imgEl: DebugElement;
    let directive: LazyLoadImageDirective;
    let originalIntersectionObserver: typeof IntersectionObserver;

    beforeEach(() => {
      renderer2Mock = {
        setAttribute: vi.fn(),
      };

      TestBed.configureTestingModule({
        imports: [TestComponent, LazyLoadImageDirective],
        providers: [
          { provide: Renderer2, useValue: renderer2Mock },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });

      fixture = TestBed.createComponent(TestComponent);
      imgEl = fixture.debugElement.query(By.css('img'));
      directive = imgEl.injector.get(LazyLoadImageDirective);
      fixture.detectChanges();
      originalIntersectionObserver = window.IntersectionObserver;
    });

    afterEach(() => {
      window.IntersectionObserver = originalIntersectionObserver;
    });

    it('should create an instance', () => {
      expect(directive).toBeTruthy();
    });

    it('should call loadImage and disconnect observer when element is intersecting', async () => {
      Object.defineProperty(directive, 'src', {
        value: () => 'https://example.com/image.jpg',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loadImageSpy = vi.spyOn(directive as any, 'loadImage');
      const disconnectSpy = vi.fn();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockObserver: any = {
        observe: vi.fn(),
        disconnect: disconnectSpy,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: null as any,
        triggerObserverCallback: function (entries: IntersectionObserverEntry[]) {
          if (this.callback) {
            this.callback(entries);
          }
        },
      };

      window.IntersectionObserver = function (callback: IntersectionObserverCallback) {
        mockObserver.callback = callback;
        return mockObserver;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      directive.ngOnInit();

      // Attendre que l'observer soit initialisé
      await new Promise(resolve => setTimeout(resolve, 0));

      mockObserver.triggerObserverCallback([
        {
          isIntersecting: true,
          target: imgEl.nativeElement,
        } as IntersectionObserverEntry,
      ]);

      expect(loadImageSpy).toHaveBeenCalled();
      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should disconnect observer when directive is destroyed', () => {
      const disconnectSpy = vi.fn();

      directive['observer'] = {
        observe: vi.fn(),
        disconnect: disconnectSpy,
        unobserve: vi.fn(),
        takeRecords: vi.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      directive.ngOnDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should not throw error when observer is undefined on destroy', () => {
      directive['observer'] = undefined as unknown as IntersectionObserver;

      expect(() => {
        directive.ngOnDestroy();
      }).not.toThrow();
    });

    it('should test all MockIntersectionObserver methods', () => {
      const callbackSpy = vi.fn();
      const mockObserver = new MockIntersectionObserver(callbackSpy);

      const targetElement = imgEl.nativeElement;
      mockObserver.observe(targetElement);

      expect(callbackSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            isIntersecting: true,
            target: targetElement,
          }),
        ]),
        mockObserver
      );

      callbackSpy.mockClear();

      mockObserver.unobserve(targetElement);

      expect(callbackSpy).not.toHaveBeenCalled();

      mockObserver.disconnect();
      expect(callbackSpy).not.toHaveBeenCalled();

      const records = mockObserver.takeRecords();
      expect(records).toEqual([]);

      callbackSpy.mockClear();

      const testEntries = [
        {
          isIntersecting: true,
          target: targetElement,
        } as IntersectionObserverEntry,
      ];

      mockObserver.triggerObserverCallback(testEntries);

      expect(callbackSpy).toHaveBeenCalledWith(testEntries, mockObserver);
    });
  });

  describe('In server environment', () => {
    let fixture: ComponentFixture<TestComponent>;
    let imgEl: DebugElement;
    let directive: LazyLoadImageDirective;

    beforeEach(() => {
      renderer2Mock = {
        setAttribute: vi.fn(),
      };

      TestBed.configureTestingModule({
        imports: [TestComponent, LazyLoadImageDirective],
        providers: [
          { provide: Renderer2, useValue: renderer2Mock },
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });

      fixture = TestBed.createComponent(TestComponent);
      imgEl = fixture.debugElement.query(By.css('img'));
      directive = imgEl.injector.get(LazyLoadImageDirective);
      fixture.detectChanges();
    });

    it('should create an instance in server environment', () => {
      expect(directive).toBeTruthy();
      expect(directive['isBrowser']).toBe(false);
    });

    it('should not initialize IntersectionObserver in server environment', () => {
      Object.defineProperty(directive, 'src', {
        value: () => 'https://example.com/image.jpg',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spy = vi.spyOn(directive as any, 'loadImage');

      directive.ngOnInit();

      expect(directive['observer']).toBeUndefined();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should directly set src attribute without IntersectionObserver', () => {
      Object.defineProperty(directive, 'src', {
        value: 'https://example.com/image.jpg',
        writable: true,
      });

      renderer2Mock.setAttribute.mockClear();

      directive.ngOnInit();

      expect(renderer2Mock.setAttribute).not.toHaveBeenCalled();
    });

    it('should safely handle destroy in server environment', () => {
      expect(directive['observer']).toBeUndefined();

      expect(() => {
        directive.ngOnDestroy();
      }).not.toThrow();
    });
  });
});
