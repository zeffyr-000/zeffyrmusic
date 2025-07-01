import { isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, Renderer2, OnInit, OnChanges, SimpleChanges, PLATFORM_ID, inject, input } from '@angular/core';
import { environment } from 'src/environments/environment';

@Directive({ selector: 'img[appDefaultImage]' })
export class DefaultImageDirective implements OnInit, OnChanges {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private platformId = inject(PLATFORM_ID);

  readonly src = input<string>(undefined);
  private defaultImage: string;
  private loadingImage: string;
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.defaultImage = `${environment.URL_ASSETS}assets/img/default.jpg`;
    this.loadingImage = `${environment.URL_ASSETS}assets/img/loading.jpg`;
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.setLoadingImage();
    } else {
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.src());
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.isBrowser && changes['src']) {
      this.setLoadingImage();
      this.loadImage(this.src());
    }
  }

  private setLoadingImage() {
    if (this.isBrowser) {
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.loadingImage);
    }
  }

  private loadImage(src: string) {
    if (!this.isBrowser) {
      return;
    }

    const img = new Image();
    img.src = src;
    img.onload = () => {
      this.renderer.setAttribute(this.el.nativeElement, 'src', src);
    };
    img.onerror = () => {
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.defaultImage);
    };
  }
}