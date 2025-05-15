import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SeoService {

  constructor(
    @Inject(DOCUMENT) private document: Document
  ) { }

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
