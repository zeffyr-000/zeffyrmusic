import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { Title } from '@angular/platform-browser';
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

  it('should create', () => {
    expect(component).toBeTruthy();
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
  });

  it('should inject HowTo JSON-LD for tutorial pages', () => {
    const seoService = TestBed.inject(SeoService);
    const spy = vi.spyOn(seoService, 'setJsonLd');
    getSpy.mockReturnValue('listen');
    component.ngOnInit();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ '@context': 'https://schema.org', '@type': 'HowTo' })
    );
  });

  it('should remove JSON-LD on destroy', () => {
    const seoService = TestBed.inject(SeoService);
    const spy = vi.spyOn(seoService, 'removeJsonLd');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });

  it('should not inject JSON-LD for legal page', () => {
    const seoService = TestBed.inject(SeoService);
    const spy = vi.spyOn(seoService, 'setJsonLd');
    getSpy.mockReturnValue('legal');
    component.ngOnInit();
    expect(spy).not.toHaveBeenCalled();
  });
});
