import { Component, ElementRef, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Renderer2 } from '@angular/core';
import { LazyLoadImageDirective } from './lazy-load-image.directive';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MockIntersectionObserver } from './mock-intersection-observer';

@Component({ template: `<img appLazyLoadImage="https://example.com/image.jpg" alt="" />` })
class TestComponent { }

describe('LazyLoadImageDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let imgEl: ElementRef;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let renderer2Mock: any;

  describe('In browser environment', () => {
    beforeEach(() => {
      renderer2Mock = {
        setAttribute: jasmine.createSpy('setAttribute')
      };

      TestBed.configureTestingModule({
        imports: [TestComponent, LazyLoadImageDirective],
        providers: [
          { provide: Renderer2, useValue: renderer2Mock },
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });

      fixture = TestBed.createComponent(TestComponent);
      imgEl = fixture.debugElement.children[0];
      fixture.detectChanges();
    });

    it('should create an instance', () => {
      const directive = new LazyLoadImageDirective(imgEl, TestBed.inject(Renderer2), TestBed.inject(PLATFORM_ID));
      expect(directive).toBeTruthy();
    });

    it('should set src attribute when image is in viewport', () => {
      const directive = new LazyLoadImageDirective(imgEl, TestBed.inject(Renderer2), TestBed.inject(PLATFORM_ID));
      directive.src = 'https://example.com/image.jpg';

      // Mock IntersectionObserver
      directive['observer'] = new MockIntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            directive['loadImage']();
          }
        });
      });

      expect(directive['isBrowser']).toBeTrue();

      directive['observer'].observe(imgEl.nativeElement);
      directive.ngOnInit();

      expect(renderer2Mock.setAttribute).toHaveBeenCalledWith(
        imgEl.nativeElement,
        'src',
        'https://example.com/image.jpg'
      );
    });

    it('should handle image loading errors gracefully', () => {
      const directive = new LazyLoadImageDirective(imgEl, TestBed.inject(Renderer2), TestBed.inject(PLATFORM_ID));
      directive.src = 'https://example.com/broken-image.jpg';

      renderer2Mock.setAttribute.calls.reset();

      directive['loadImage']();

      expect(renderer2Mock.setAttribute).toHaveBeenCalledTimes(1);
      expect(renderer2Mock.setAttribute).toHaveBeenCalledWith(
        imgEl.nativeElement,
        'src',
        'https://example.com/broken-image.jpg'
      );

      renderer2Mock.setAttribute.calls.reset();

      const errorEvent = new ErrorEvent('error');
      imgEl.nativeElement.dispatchEvent(errorEvent);

      expect(renderer2Mock.setAttribute).not.toHaveBeenCalled();
    });

    it('should call loadImage and disconnect observer when element is intersecting', () => {
      const directive = new LazyLoadImageDirective(imgEl, TestBed.inject(Renderer2), TestBed.inject(PLATFORM_ID));
      directive.src = 'https://example.com/image.jpg';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loadImageSpy = spyOn<any>(directive, 'loadImage').and.callThrough();
      const disconnectSpy = jasmine.createSpy('disconnect');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockObserver: any = {
        observe: jasmine.createSpy('observe'),
        disconnect: disconnectSpy,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: null as any,
        triggerObserverCallback: function (entries: IntersectionObserverEntry[]) {
          if (this.callback) {
            this.callback(entries);
          }
        }
      };

      const originalIntersectionObserver = window.IntersectionObserver;
      window.IntersectionObserver = function (callback: IntersectionObserverCallback) {
        mockObserver.callback = callback;
        return mockObserver;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      try {
        directive.ngOnInit();

        mockObserver.triggerObserverCallback([{
          isIntersecting: true,
          target: imgEl.nativeElement
        } as IntersectionObserverEntry]);

        expect(loadImageSpy).toHaveBeenCalled();
        expect(disconnectSpy).toHaveBeenCalled();
      } finally {
        window.IntersectionObserver = originalIntersectionObserver;
      }
    });

    it('should disconnect observer when directive is destroyed', () => {
      const directive = new LazyLoadImageDirective(imgEl, TestBed.inject(Renderer2), TestBed.inject(PLATFORM_ID));

      const disconnectSpy = jasmine.createSpy('disconnect');

      directive['observer'] = {
        observe: jasmine.createSpy('observe'),
        disconnect: disconnectSpy,
        unobserve: jasmine.createSpy('unobserve'),
        takeRecords: jasmine.createSpy('takeRecords')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      directive.ngOnDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should not throw error when observer is undefined on destroy', () => {
      const directive = new LazyLoadImageDirective(imgEl, TestBed.inject(Renderer2), TestBed.inject(PLATFORM_ID));

      directive['observer'] = undefined;

      expect(() => {
        directive.ngOnDestroy();
      }).not.toThrow();
    });

    it('should test all MockIntersectionObserver methods', () => {
      // Créer une instance de MockIntersectionObserver
      const callbackSpy = jasmine.createSpy('callback');
      const mockObserver = new MockIntersectionObserver(callbackSpy);

      // 1. Test de la méthode observe()
      const targetElement = imgEl.nativeElement;
      mockObserver.observe(targetElement);

      // Vérifier que le callback a été appelé lors de observe()
      expect(callbackSpy).toHaveBeenCalledWith(
        jasmine.arrayContaining([
          jasmine.objectContaining({
            isIntersecting: true,
            target: targetElement
          })
        ]),
        mockObserver
      );

      // 2. Test de la méthode unobserve()
      // Réinitialiser le compteur d'appels
      callbackSpy.calls.reset();

      // Appeler unobserve() - c'est une opération sans effet (no-op) dans le mock
      mockObserver.unobserve(targetElement);

      // Vérifier qu'aucun callback n'a été déclenché
      expect(callbackSpy).not.toHaveBeenCalled();

      // 3. Test de la méthode disconnect()
      // C'est aussi une opération sans effet dans le mock
      mockObserver.disconnect();
      expect(callbackSpy).not.toHaveBeenCalled();

      // 4. Test de la méthode takeRecords()
      const records = mockObserver.takeRecords();
      expect(records).toEqual([]);

      // 5. Test de la méthode triggerObserverCallback()
      callbackSpy.calls.reset();

      const testEntries = [{
        isIntersecting: true,
        target: targetElement
      } as IntersectionObserverEntry];

      mockObserver.triggerObserverCallback(testEntries);

      expect(callbackSpy).toHaveBeenCalledWith(testEntries, mockObserver);
    });
  });

  describe('In server environment', () => {
    beforeEach(() => {
      renderer2Mock = {
        setAttribute: jasmine.createSpy('setAttribute')
      };

      TestBed.configureTestingModule({
        imports: [TestComponent, LazyLoadImageDirective],
        providers: [
          { provide: Renderer2, useValue: renderer2Mock },
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });

      fixture = TestBed.createComponent(TestComponent);
      imgEl = fixture.debugElement.children[0];
      fixture.detectChanges();
    });

    it('should create an instance in server environment', () => {
      const directive = new LazyLoadImageDirective(imgEl, TestBed.inject(Renderer2), TestBed.inject(PLATFORM_ID));
      expect(directive).toBeTruthy();
      expect(directive['isBrowser']).toBeFalse();
    });

    it('should not initialize IntersectionObserver in server environment', () => {
      const directive = new LazyLoadImageDirective(imgEl, TestBed.inject(Renderer2), TestBed.inject(PLATFORM_ID));
      directive.src = 'https://example.com/image.jpg';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spy = spyOn<any>(directive, 'loadImage');

      directive.ngOnInit();

      expect(directive['observer']).toBeUndefined();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should directly set src attribute without IntersectionObserver', () => {
      const directive = new LazyLoadImageDirective(imgEl, TestBed.inject(Renderer2), TestBed.inject(PLATFORM_ID));
      directive.src = 'https://example.com/image.jpg';

      renderer2Mock.setAttribute.calls.reset();

      directive.ngOnInit();

      expect(renderer2Mock.setAttribute).not.toHaveBeenCalled();
    });

    it('should safely handle destroy in server environment', () => {
      const directive = new LazyLoadImageDirective(imgEl, TestBed.inject(Renderer2), TestBed.inject(PLATFORM_ID));

      expect(directive['observer']).toBeUndefined();

      expect(() => {
        directive.ngOnDestroy();
      }).not.toThrow();
    });
  });
});