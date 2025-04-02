import { isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, Inject, Input, OnDestroy, OnInit, PLATFORM_ID, Renderer2 } from '@angular/core';

@Directive({ selector: '[appLazyLoadImage]' })
export class LazyLoadImageDirective implements OnInit, OnDestroy {
  @Input('appLazyLoadImage') src: string;
  private observer: IntersectionObserver;
  private isBrowser: boolean;

  constructor(private el: ElementRef, private renderer: Renderer2, @Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) {
      return;
    }

    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage();
          this.observer.disconnect();
        }
      });
    });

    this.observer.observe(this.el.nativeElement);
  }

  private loadImage() {
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.src);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}