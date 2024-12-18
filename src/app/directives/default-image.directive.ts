import { Directive, ElementRef, Renderer2, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { environment } from 'src/environments/environment';

@Directive({
  selector: 'img[appDefaultImage]',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false
})
export class DefaultImageDirective implements OnInit, OnChanges {
  @Input() src: string;
  private defaultImage: string;
  private loadingImage: string;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.defaultImage = `${environment.URL_ASSETS}assets/img/default.jpg`;
    this.loadingImage = `${environment.URL_ASSETS}assets/img/loading.jpg`;
  }

  ngOnInit() {
    this.setLoadingImage();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['src']) {
      this.setLoadingImage();
      this.loadImage(this.src);
    }
  }

  private setLoadingImage() {
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.loadingImage);
  }

  private loadImage(src: string) {
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