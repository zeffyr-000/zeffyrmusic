import { Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';

@Directive({ selector: '[appLazyLoadImage]' })
export class LazyLoadImageDirective implements OnInit, OnDestroy {
  @Input('appLazyLoadImage') src: string;
  private observer: IntersectionObserver;

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  ngOnInit() {
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