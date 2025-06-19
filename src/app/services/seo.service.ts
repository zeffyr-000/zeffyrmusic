import { Injectable, DOCUMENT, inject } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private document = inject<Document>(DOCUMENT);


  updateCanonicalUrl(url: string): void {
    let canonicalLink = this.document.querySelector('link[rel="canonical"]');

    if (!canonicalLink) {
      canonicalLink = this.document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      this.document.head.appendChild(canonicalLink);
    }

    canonicalLink.setAttribute('href', url);
  }
}
