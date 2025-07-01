import { isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, OnDestroy, OnInit, PLATFORM_ID, Renderer2, inject, input } from '@angular/core';

@Directive({ selector: '[appLazyLoadImage]' })
export class LazyLoadImageDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  readonly src = input<string>(undefined, { alias: "appLazyLoadImage" });
  private observer: IntersectionObserver;
  private isBrowser: boolean;

  constructor() {
    const platformId = inject(PLATFORM_ID);

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
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.src());
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}