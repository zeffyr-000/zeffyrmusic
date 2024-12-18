import { Component, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Renderer2 } from '@angular/core';
import { LazyLoadImageDirective } from './lazy-load-image.directive';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MockIntersectionObserver } from './mock-intersection-observer';

@Component({
  template: `<img appLazyLoadImage="https://example.com/image.jpg" alt="" />`,
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false
})
class TestComponent { }

describe('LazyLoadImageDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let imgEl: ElementRef;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let renderer2Mock: any;

  beforeEach(() => {
    renderer2Mock = {
      setAttribute: jasmine.createSpy('setAttribute')
    };

    TestBed.configureTestingModule({
      declarations: [TestComponent, LazyLoadImageDirective],
      providers: [
        { provide: Renderer2, useValue: renderer2Mock }
      ]
    });

    fixture = TestBed.createComponent(TestComponent);
    imgEl = fixture.debugElement.children[0];
    fixture.detectChanges();
  });

  it('should create an instance', () => {
    const directive = new LazyLoadImageDirective(imgEl, TestBed.inject(Renderer2));
    expect(directive).toBeTruthy();
  });

  it('should set src attribute when image is in viewport', () => {
    const directive = new LazyLoadImageDirective(imgEl, TestBed.inject(Renderer2));
    directive.src = 'https://example.com/image.jpg';

    // Mock IntersectionObserver
    directive['observer'] = new MockIntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          directive['loadImage']();
        }
      });
    });

    // Simulate the image being in the viewport
    directive['observer'].observe(imgEl.nativeElement);
    directive.ngOnInit();

    expect(renderer2Mock.setAttribute).toHaveBeenCalledWith(imgEl.nativeElement, 'src', 'https://example.com/image.jpg');
  });
});