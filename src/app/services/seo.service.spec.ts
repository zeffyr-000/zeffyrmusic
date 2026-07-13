import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';

import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeoService);
    document = TestBed.inject(DOCUMENT);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setJsonLd', () => {
    afterEach(() => {
      service.removeJsonLd();
    });

    it('should inject a script tag with JSON-LD content', () => {
      service.setJsonLd({ '@context': 'https://schema.org', '@type': 'FAQPage' });
      const script = document.getElementById('structured-data-json-ld');
      expect(script).toBeTruthy();
      expect(script?.getAttribute('type')).toBe('application/ld+json');
      expect(JSON.parse(script!.textContent!)).toEqual({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
      });
    });

    it('should replace existing JSON-LD when called again', () => {
      service.setJsonLd({ '@type': 'FAQPage' });
      service.setJsonLd({ '@type': 'HowTo' });
      const scripts = document.querySelectorAll('#structured-data-json-ld');
      expect(scripts).toHaveLength(1);
      expect(JSON.parse(scripts[0].textContent!)).toEqual({ '@type': 'HowTo' });
    });

    it('should not remove breadcrumb when replacing JSON-LD', () => {
      service.setBreadcrumbJsonLd([{ name: 'Home', url: 'https://example.com' }]);
      service.setJsonLd({ '@type': 'FAQPage' });
      expect(document.getElementById('structured-data-breadcrumb')).toBeTruthy();
    });
  });

  describe('removeJsonLd', () => {
    it('should remove the JSON-LD script tag', () => {
      service.setJsonLd({ '@type': 'FAQPage' });
      service.removeJsonLd();
      expect(document.getElementById('structured-data-json-ld')).toBeNull();
    });

    it('should remove the breadcrumb script tag', () => {
      service.setBreadcrumbJsonLd([{ name: 'Home', url: 'https://example.com' }]);
      service.removeJsonLd();
      expect(document.getElementById('structured-data-breadcrumb')).toBeNull();
    });

    it('should remove both JSON-LD and breadcrumb script tags', () => {
      service.setJsonLd({ '@type': 'FAQPage' });
      service.setBreadcrumbJsonLd([{ name: 'Home', url: 'https://example.com' }]);
      service.removeJsonLd();
      expect(document.getElementById('structured-data-json-ld')).toBeNull();
      expect(document.getElementById('structured-data-breadcrumb')).toBeNull();
    });

    it('should not throw if no JSON-LD exists', () => {
      expect(() => service.removeJsonLd()).not.toThrow();
    });
  });

  describe('setBreadcrumbJsonLd', () => {
    afterEach(() => {
      service.removeJsonLd();
    });

    it('should inject a BreadcrumbList script tag', () => {
      service.setBreadcrumbJsonLd([
        { name: 'Home', url: 'https://example.com' },
        { name: 'Help', url: 'https://example.com/help' },
      ]);
      const script = document.getElementById('structured-data-breadcrumb');
      expect(script).toBeTruthy();
      expect(script?.getAttribute('type')).toBe('application/ld+json');
      const data = JSON.parse(script!.textContent!);
      expect(data['@type']).toBe('BreadcrumbList');
      expect(data.itemListElement).toHaveLength(2);
      expect(data.itemListElement[0]).toEqual({
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://example.com',
      });
      expect(data.itemListElement[1]).toEqual({
        '@type': 'ListItem',
        position: 2,
        name: 'Help',
        item: 'https://example.com/help',
      });
    });

    it('should replace existing breadcrumb when called again', () => {
      service.setBreadcrumbJsonLd([{ name: 'A', url: 'https://a.com' }]);
      service.setBreadcrumbJsonLd([{ name: 'B', url: 'https://b.com' }]);
      const scripts = document.querySelectorAll('#structured-data-breadcrumb');
      expect(scripts).toHaveLength(1);
      const data = JSON.parse(scripts[0].textContent!);
      expect(data.itemListElement[0].name).toBe('B');
    });

    it('should coexist with main JSON-LD', () => {
      service.setJsonLd({ '@type': 'FAQPage' });
      service.setBreadcrumbJsonLd([{ name: 'Home', url: 'https://example.com' }]);
      expect(document.getElementById('structured-data-json-ld')).toBeTruthy();
      expect(document.getElementById('structured-data-breadcrumb')).toBeTruthy();
    });
  });
});
