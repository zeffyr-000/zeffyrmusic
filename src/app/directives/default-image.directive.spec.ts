import { Component, DebugElement, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DefaultImageDirective } from './default-image.directive';
import { By } from '@angular/platform-browser';

@Component({
  imports: [DefaultImageDirective],
  template: `<img
    src="url/image/invalide.jpg"
    alt=""
    appDefaultImage
    defaultSrc="assets/img/default.jpg"
  />`,
})
class TestComponent {}

describe('DefaultImageDirective', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let imgEl: DebugElement;
  let directive: DefaultImageDirective;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let setAttributeSpy: any;

  describe('In browser environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [TestComponent],
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });
      fixture = TestBed.createComponent(TestComponent);
      component = fixture.componentInstance;
      imgEl = fixture.debugElement.query(By.css('img'));
      directive = imgEl.injector.get(DefaultImageDirective);

      setAttributeSpy = vi.spyOn(directive['renderer'], 'setAttribute');

      fixture.detectChanges();
    });

    it('should not replace src if the image is valid', () => {
      const src = 'url/image/valid.jpg';

      imgEl.nativeElement.src = src;
      imgEl.triggerEventHandler('error', null);
      fixture.detectChanges();
      expect(imgEl.nativeElement.src).toContain(src);
    });

    it('should set the src attribute with the provided value', () => {
      const testSrc = 'assets/img/test-image.jpg';

      setAttributeSpy.mockClear();

      directive.ngOnChanges({
        src: {
          currentValue: testSrc,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(directive['renderer'].setAttribute).toHaveBeenCalledWith(
        directive['el'].nativeElement,
        'src',
        'assets/img/loading.jpg'
      );
    });

    it('should set the original src when image loads successfully', () => {
      const testSrc = 'assets/img/test-image.jpg';

      setAttributeSpy.mockClear();

      const imgMock = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onload: null as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onerror: null as any,
        src: '',
      };

      const originalImage = window.Image;
      window.Image = function () {
        return imgMock;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      try {
        directive['loadImage'](testSrc);

        expect(imgMock.src).toBe(testSrc);

        expect(imgMock.onload).toEqual(expect.any(Function));
        expect(imgMock.onerror).toEqual(expect.any(Function));

        setAttributeSpy.mockClear();

        imgMock.onload();

        expect(setAttributeSpy).toHaveBeenCalledWith(directive['el'].nativeElement, 'src', testSrc);
      } finally {
        window.Image = originalImage;
      }
    });
  });

  describe('In server environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [TestComponent],
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });
      fixture = TestBed.createComponent(TestComponent);
      component = fixture.componentInstance;
      imgEl = fixture.debugElement.query(By.css('img'));
      directive = imgEl.injector.get(DefaultImageDirective);

      setAttributeSpy = vi.spyOn(directive['renderer'], 'setAttribute');

      fixture.detectChanges();
    });

    it('should handle server-side rendering safely', () => {
      const testSrc = 'assets/img/test-image.jpg';

      setAttributeSpy.mockClear();

      directive.ngOnChanges({
        src: {
          currentValue: testSrc,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(setAttributeSpy).not.toHaveBeenCalled();

      setAttributeSpy.mockClear();
      imgEl.triggerEventHandler('error', null);
      expect(setAttributeSpy).not.toHaveBeenCalled();
    });

    it('should exit loadImage() method early when not in browser', () => {
      expect(directive['isBrowser']).toBeFalsy();

      setAttributeSpy.mockClear();

      const imageSpy = vi.fn();
      const originalImage = window.Image;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.Image = imageSpy as any;

      try {
        directive['loadImage']('test-url.jpg');
        expect(imageSpy).not.toHaveBeenCalled();
      } finally {
        window.Image = originalImage;
      }
    });
  });
});
