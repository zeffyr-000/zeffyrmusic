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
      expect(scripts.length).toBe(1);
      expect(JSON.parse(scripts[0].textContent!)).toEqual({ '@type': 'HowTo' });
    });
  });

  describe('removeJsonLd', () => {
    it('should remove the JSON-LD script tag', () => {
      service.setJsonLd({ '@type': 'FAQPage' });
      service.removeJsonLd();
      expect(document.getElementById('structured-data-json-ld')).toBeNull();
    });

    it('should not throw if no JSON-LD exists', () => {
      expect(() => service.removeJsonLd()).not.toThrow();
    });
  });
});
