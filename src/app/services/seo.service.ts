import { Injectable, DOCUMENT, inject } from '@angular/core';

const JSON_LD_ID = 'structured-data-json-ld';
const BREADCRUMB_ID = 'structured-data-breadcrumb';

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
    this.document.getElementById(JSON_LD_ID)?.remove();
    const script = this.document.createElement('script');
    script.id = JSON_LD_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  setBreadcrumbJsonLd(items: { name: string; url: string }[]): void {
    this.document.getElementById(BREADCRUMB_ID)?.remove();
    const script = this.document.createElement('script');
    script.id = BREADCRUMB_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    });
    this.document.head.appendChild(script);
  }

  removeJsonLd(): void {
    this.document.getElementById(JSON_LD_ID)?.remove();
    this.document.getElementById(BREADCRUMB_ID)?.remove();
  }
}
