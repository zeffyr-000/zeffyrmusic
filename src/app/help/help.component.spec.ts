import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { HelpComponent } from './help.component';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { SeoService } from '../services/seo.service';

describe('HelpComponent', () => {
  let component: HelpComponent;
  let fixture: ComponentFixture<HelpComponent>;
  let googleAnalyticsServiceMock: { pageView: ReturnType<typeof vi.fn> };
  let seoServiceMock: {
    updateCanonicalUrl: ReturnType<typeof vi.fn>;
    setJsonLd: ReturnType<typeof vi.fn>;
    setBreadcrumbJsonLd: ReturnType<typeof vi.fn>;
    removeJsonLd: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    googleAnalyticsServiceMock = { pageView: vi.fn() };
    seoServiceMock = {
      updateCanonicalUrl: vi.fn(),
      setJsonLd: vi.fn(),
      setBreadcrumbJsonLd: vi.fn(),
      removeJsonLd: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [HelpComponent],
      providers: [
        getTranslocoTestingProviders(),
        provideRouter([]),
        { provide: GoogleAnalyticsService, useValue: googleAnalyticsServiceMock },
        { provide: SeoService, useValue: seoServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set page title', () => {
    const titleService = TestBed.inject(Title);
    expect(titleService.getTitle()).toBe('Directory of Tips and Tutorials - Zeffyr Music');
  });

  it('should set meta description', () => {
    const metaService = TestBed.inject(Meta);
    const tag = metaService.getTag('name="description"');
    expect(tag?.content).toBe(
      'Discover our directory of tips and tutorials. Find practical guides and advice to help you get the most out of our services. Explore now!'
    );
  });

  it('should set canonical URL', () => {
    expect(seoServiceMock.updateCanonicalUrl).toHaveBeenCalledWith(expect.stringContaining('help'));
  });

  it('should set CollectionPage JSON-LD with hasPart and publisher', () => {
    expect(seoServiceMock.setJsonLd).toHaveBeenCalledWith(
      expect.objectContaining({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        url: expect.stringContaining('help'),
        inLanguage: 'en',
        publisher: expect.objectContaining({
          '@type': 'Organization',
          name: 'Zeffyr Music',
        }),
        hasPart: expect.arrayContaining([
          expect.objectContaining({ '@type': 'WebPage', url: expect.stringContaining('help/') }),
        ]),
      })
    );
    const data = seoServiceMock.setJsonLd.mock.calls[0][0];
    expect(data.hasPart).toHaveLength(10);
  });

  it('should set BreadcrumbList JSON-LD', () => {
    expect(seoServiceMock.setBreadcrumbJsonLd).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: expect.any(String), url: expect.any(String) }),
      ])
    );
    const items = seoServiceMock.setBreadcrumbJsonLd.mock.calls[0][0];
    expect(items).toHaveLength(2);
  });

  it('should set Open Graph meta tags', () => {
    const metaService = TestBed.inject(Meta);
    expect(metaService.getTag('name="og:title"')?.content).toContain('Zeffyr Music');
    expect(metaService.getTag('name="og:type"')?.content).toBe('website');
    expect(metaService.getTag('name="og:site_name"')?.content).toBe('Zeffyr Music');
    expect(metaService.getTag('name="og:url"')?.content).toContain('help');
  });

  it('should remove JSON-LD and OG tags on destroy', () => {
    const metaService = TestBed.inject(Meta);
    expect(metaService.getTag('name="og:title"')).toBeTruthy();
    fixture.destroy();
    expect(seoServiceMock.removeJsonLd).toHaveBeenCalled();
    expect(metaService.getTag('name="og:title"')).toBeNull();
  });

  it('should track pageView on init', () => {
    expect(googleAnalyticsServiceMock.pageView).toHaveBeenCalledWith('/help', expect.any(String));
  });
});
