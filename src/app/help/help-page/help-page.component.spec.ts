import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { HelpPageComponent } from './help-page.component';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { SeoService } from 'src/app/services/seo.service';
import { getTranslocoTestingProviders } from 'src/app/transloco-testing';

describe('HelpPageComponent', () => {
  let component: HelpPageComponent;
  let fixture: ComponentFixture<HelpPageComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let getSpy: any;
  let googleAnalyticsServiceMock: { pageView: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    getSpy = vi.fn().mockReturnValue('listen');
    googleAnalyticsServiceMock = { pageView: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [HelpPageComponent],
      providers: [
        getTranslocoTestingProviders(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: getSpy } } } },
        { provide: GoogleAnalyticsService, useValue: googleAnalyticsServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should track pageView on init', () => {
    expect(googleAnalyticsServiceMock.pageView).toHaveBeenCalledWith(
      '/help/listen',
      expect.any(String)
    );
  });

  it('should set page on ngOnInit', () => {
    getSpy.mockReturnValue('listen');
    component.ngOnInit();
    expect(component.page).toEqual('listen');
  });

  it('should redirect to /help for unknown page slugs', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    getSpy.mockReturnValue('unknown-page');
    component.ngOnInit();
    expect(navigateSpy).toHaveBeenCalledWith(['/help'], { replaceUrl: true });
  });

  it.each([
    ['install-android', 'How to add this website to your Android home screen'],
    ['install-ios', 'How to add this website to your iPhone home screen'],
    ['locked-screen', 'How to keep playing music on mobile with screen locked'],
    ['listen', 'How to listen to music on Zeffyr Music'],
    ['legal', 'Is Zeffyr Music legal?'],
    ['download', 'Can I download music?'],
    ['issues', 'Troubleshooting common issues (login, playlists, favorites)'],
    ['playlists', 'Manage your playlists and library'],
    ['settings', 'Settings and customization'],
  ])('should set the correct title for %s', (slug, expectedTitle) => {
    const titleService = TestBed.inject(Title);
    getSpy.mockReturnValue(slug);
    component.ngOnInit();
    expect(component.page).toEqual(slug);
    expect(titleService.getTitle()).toContain(expectedTitle);
  });

  it('should inject FAQPage JSON-LD for issues page', () => {
    const seoService = TestBed.inject(SeoService);
    const spy = vi.spyOn(seoService, 'setJsonLd');
    getSpy.mockReturnValue('issues');
    component.ngOnInit();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ '@context': 'https://schema.org', '@type': 'FAQPage' })
    );
    const data = spy.mock.calls[0][0] as Record<string, unknown>;
    expect(data['mainEntity']).toBeInstanceOf(Array);
    expect((data['mainEntity'] as unknown[]).length).toBeGreaterThan(0);
  });

  it('should inject HowTo JSON-LD with step[] for tutorial pages', () => {
    const seoService = TestBed.inject(SeoService);
    const spy = vi.spyOn(seoService, 'setJsonLd');
    getSpy.mockReturnValue('listen');
    component.ngOnInit();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ '@context': 'https://schema.org', '@type': 'HowTo' })
    );
    const data = spy.mock.calls[0][0] as Record<string, unknown>;
    expect(data['step']).toBeInstanceOf(Array);
    const steps = data['step'] as Record<string, string>[];
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0]['@type']).toBe('HowToStep');
    expect(steps[0]['name']).toBeTruthy();
    expect(steps[0]['text']).toBeTruthy();
  });

  it('should inject HowTo JSON-LD with image for install-android', () => {
    const seoService = TestBed.inject(SeoService);
    const spy = vi.spyOn(seoService, 'setJsonLd');
    getSpy.mockReturnValue('install-android');
    component.ngOnInit();
    const data = spy.mock.calls[0][0] as Record<string, unknown>;
    expect(data['@type']).toBe('HowTo');
    expect(data['image']).toContain('assets/img/help/android_chrome_1.jpg');
  });

  it('should inject FAQPage JSON-LD for legal page', () => {
    const seoService = TestBed.inject(SeoService);
    const spy = vi.spyOn(seoService, 'setJsonLd');
    getSpy.mockReturnValue('legal');
    component.ngOnInit();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ '@context': 'https://schema.org', '@type': 'FAQPage' })
    );
  });

  it('should inject FAQPage JSON-LD for download page', () => {
    const seoService = TestBed.inject(SeoService);
    const spy = vi.spyOn(seoService, 'setJsonLd');
    getSpy.mockReturnValue('download');
    component.ngOnInit();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ '@context': 'https://schema.org', '@type': 'FAQPage' })
    );
  });

  it('should remove JSON-LD on destroy', () => {
    const seoService = TestBed.inject(SeoService);
    const spy = vi.spyOn(seoService, 'removeJsonLd');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });

  it('should set BreadcrumbList JSON-LD', () => {
    const seoService = TestBed.inject(SeoService);
    const spy = vi.spyOn(seoService, 'setBreadcrumbJsonLd');
    getSpy.mockReturnValue('listen');
    component.ngOnInit();
    expect(spy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: expect.any(String), url: expect.any(String) }),
      ])
    );
    const items = spy.mock.calls[0][0];
    expect(items).toHaveLength(3);
    expect(items[2].url).toContain('help/listen');
  });

  it('should set Open Graph meta tags', () => {
    const metaService = TestBed.inject(Meta);
    getSpy.mockReturnValue('listen');
    component.ngOnInit();
    expect(metaService.getTag('name="og:title"')?.content).toContain('Zeffyr Music');
    expect(metaService.getTag('name="og:type"')?.content).toBe('article');
    expect(metaService.getTag('name="og:site_name"')?.content).toBe('Zeffyr Music');
    expect(metaService.getTag('name="og:url"')?.content).toContain('help/listen');
  });

  it('should remove Open Graph meta tags on destroy', () => {
    const metaService = TestBed.inject(Meta);
    getSpy.mockReturnValue('listen');
    component.ngOnInit();
    expect(metaService.getTag('name="og:title"')).toBeTruthy();
    component.ngOnDestroy();
    expect(metaService.getTag('name="og:title"')).toBeNull();
  });
});
