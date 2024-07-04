import { Directive, ElementRef, Renderer2 } from '@angular/core';
import { environment } from 'src/environments/environment';

@Directive({
  selector: 'img[appDefaultImage]'
})
export class DefaultImageDirective {

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.renderer.listen(this.el.nativeElement, 'error', () => {
      const defaultImage = `${environment.URL_ASSETS}assets/img/default.jpg`;
      this.renderer.setAttribute(this.el.nativeElement, 'src', defaultImage);
    });
  }
}