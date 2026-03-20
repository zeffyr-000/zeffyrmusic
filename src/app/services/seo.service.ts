import { Injectable, DOCUMENT, inject } from '@angular/core';

const JSON_LD_ID = 'structured-data-json-ld';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly document = inject<Document>(DOCUMENT);

  updateCanonicalUrl(url: string): void {
    let canonicalLink = this.document.querySelector('link[rel="canonical"]');

    if (!canonicalLink) {
      canonicalLink = this.document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      this.document.head.appendChild(canonicalLink);
    }

    canonicalLink.setAttribute('href', url);
  }

  setJsonLd(data: Record<string, unknown>): void {
    this.removeJsonLd();
    const script = this.document.createElement('script');
    script.id = JSON_LD_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  removeJsonLd(): void {
    this.document.getElementById(JSON_LD_ID)?.remove();
  }
}
