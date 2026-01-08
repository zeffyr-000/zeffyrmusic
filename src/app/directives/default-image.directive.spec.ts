import { Component, DebugElement, PLATFORM_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DefaultImageDirective } from './default-image.directive';
import { By } from '@angular/platform-browser';

@Component({
  imports: [DefaultImageDirective],
  template: `<img [src]="imageSrc()" alt="" appDefaultImage defaultSrc="assets/img/default.jpg" />`,
})
class TestComponent {
  imageSrc = signal('url/image/invalide.jpg');
}

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

    it('should set loading image on init', () => {
      expect(setAttributeSpy).toHaveBeenCalledWith(
        directive['el'].nativeElement,
        'src',
        'assets/img/loading.jpg'
      );
    });

    it('should set the original src when image loads successfully', () => {
      const testSrc = 'assets/img/test-image.jpg';

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
        // Reset isLoading to allow loadImage to run
        directive['isLoading'] = false;
        directive['currentSrc'] = testSrc; // Set currentSrc to match what loadImage will check
        setAttributeSpy.mockClear();

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
      expect(directive['isBrowser']).toBeFalsy();

      setAttributeSpy.mockClear();
      imgEl.triggerEventHandler('error', null);
      expect(setAttributeSpy).not.toHaveBeenCalled();
    });

    it('should set src directly without loading image in server environment', () => {
      expect(directive['isBrowser']).toBeFalsy();

      // In server environment, the effect sets src directly without calling loadImage
      expect(setAttributeSpy).toHaveBeenCalledWith(
        directive['el'].nativeElement,
        'src',
        'url/image/invalide.jpg'
      );
    });
  });
});
