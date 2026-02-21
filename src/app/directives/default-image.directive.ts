import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  Renderer2,
  PLATFORM_ID,
  inject,
  input,
  effect,
} from '@angular/core';
import { environment } from 'src/environments/environment';

@Directive({ selector: 'img[appDefaultImage]' })
export class DefaultImageDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private platformId = inject(PLATFORM_ID);

  readonly src = input<string>('');
  private defaultImage: string;
  private loadingImage: string;
  private isBrowser: boolean;
  private currentSrc: string | null = null;
  private isLoading = false;
  private pendingSrc: string | null = null;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.defaultImage = `${environment.URL_ASSETS}assets/img/default.jpg`;
    this.loadingImage = `${environment.URL_ASSETS}assets/img/loading.jpg`;

    // Set up fade-in transition on the host element
    if (this.isBrowser) {
      const el = this.el.nativeElement;
      this.renderer.setStyle(el, 'transition', 'opacity 0.2s ease');
      this.renderer.setStyle(el, 'opacity', '0');
    }

    effect(() => {
      const newSrc = this.src();
      if (!this.isBrowser) {
        this.renderer.setAttribute(this.el.nativeElement, 'src', newSrc);
        return;
      }

      if (newSrc && newSrc !== this.currentSrc) {
        if (this.isLoading) {
          // Queue the new src to load after current completes
          this.pendingSrc = newSrc;
        } else {
          this.currentSrc = newSrc;
          this.loadImage(newSrc);
        }
      }
    });
  }

  private loadImage(src: string) {
    this.isLoading = true;
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.loadingImage);

    const img = new Image();
    img.src = src;
    img.onload = () => {
      this.handleLoadComplete(src);
    };
    img.onerror = () => {
      this.isLoading = false;
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.defaultImage);
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
      this.processPendingSrc();
    };
  }

  private handleLoadComplete(src: string) {
    this.isLoading = false;
    // Only apply if this is still the current src (not superseded by pending)
    if (src === this.currentSrc) {
      this.renderer.setAttribute(this.el.nativeElement, 'src', src);
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
    }
    this.processPendingSrc();
  }

  private processPendingSrc() {
    if (this.pendingSrc && this.pendingSrc !== this.currentSrc) {
      const nextSrc = this.pendingSrc;
      this.pendingSrc = null;
      this.currentSrc = nextSrc;
      this.loadImage(nextSrc);
    }
  }
}
