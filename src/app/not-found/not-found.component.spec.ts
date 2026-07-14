import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { NotFoundComponent } from './not-found.component';
import { SeoService } from '../services/seo.service';
import { RESPONSE } from '../tokens';
import { environment } from '../../environments/environment';
import { Subject } from 'rxjs';

describe('NotFoundComponent', () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;
  let googleAnalyticsServiceMock: {
    pageView: ReturnType<typeof vi.fn>;
    event: ReturnType<typeof vi.fn>;
  };
  let seoServiceMock: { updateCanonicalUrl: ReturnType<typeof vi.fn> };
  let responseMock: { status: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    googleAnalyticsServiceMock = { pageView: vi.fn(), event: vi.fn() };
    seoServiceMock = { updateCanonicalUrl: vi.fn() };
    responseMock = { status: vi.fn().mockReturnThis() };

    await TestBed.configureTestingModule({
      imports: [NotFoundComponent, RouterModule.forRoot([])],
      providers: [
        getTranslocoTestingProviders(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: GoogleAnalyticsService, useValue: googleAnalyticsServiceMock },
        { provide: SeoService, useValue: seoServiceMock },
        { provide: RESPONSE, useValue: null },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
  });

  it('should set page title and meta description on init', () => {
    fixture.detectChanges();
    const titleService = TestBed.inject(Title);
    expect(titleService.getTitle()).toContain('Zeffyr Music');
  });

  it('should set noindex meta tag', () => {
    fixture.detectChanges();
    const metaService = TestBed.inject(Meta);
    const robotsTag = metaService.getTag('name="robots"');
    expect(robotsTag?.content).toBe('noindex');
  });

  it('should update canonical URL to self-referencing URL', () => {
    fixture.detectChanges();
    const expectedUrl = new URL(component.attemptedUrl() || '/', environment.URL_BASE).toString();
    expect(seoServiceMock.updateCanonicalUrl).toHaveBeenCalledWith(expectedUrl);
  });

  it('should track GA pageView and event on browser', () => {
    fixture.detectChanges();
    expect(googleAnalyticsServiceMock.pageView).toHaveBeenCalledWith('/404', expect.any(String));
    expect(googleAnalyticsServiceMock.event).toHaveBeenCalledWith(
      '404_error',
      'navigation',
      component.attemptedUrl()
    );
  });

  it('should expose the attempted URL as sanitized path', () => {
    const router = TestBed.inject(Router);
    expect(component.attemptedUrl()).toBe(router.url);
  });

  it('should remove noindex meta tag on destroy', () => {
    fixture.detectChanges();
    const metaService = TestBed.inject(Meta);
    expect(metaService.getTag('name="robots"')?.content).toBe('noindex');
    fixture.destroy();
    expect(metaService.getTag('name="robots"')).toBeNull();
  });

  it('should strip query params and fragments from canonical URL and GA event', () => {
    const routerEvents$ = new Subject<NavigationEnd>();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'events', 'get').mockReturnValue(routerEvents$);
    Object.defineProperty(router, 'url', { get: () => '/unknown-page?token=secret#section' });

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(seoServiceMock.updateCanonicalUrl).toHaveBeenCalledWith(
      expect.stringContaining('/unknown-page')
    );
    expect(seoServiceMock.updateCanonicalUrl).not.toHaveBeenCalledWith(
      expect.stringContaining('token=secret')
    );
    expect(googleAnalyticsServiceMock.event).toHaveBeenCalledWith(
      '404_error',
      'navigation',
      '/unknown-page'
    );
  });

  it('should normalize protocol-relative paths to prevent external canonical', () => {
    const routerEvents$ = new Subject<NavigationEnd>();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'events', 'get').mockReturnValue(routerEvents$);
    Object.defineProperty(router, 'url', { get: () => '//evil.com/steal' });

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.attemptedUrl()).toBe('/evil.com/steal');
    expect(seoServiceMock.updateCanonicalUrl).toHaveBeenCalledWith(
      expect.stringContaining('/evil.com/steal')
    );
    expect(seoServiceMock.updateCanonicalUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^http:\/\/localhost/)
    );
  });

  describe('SSR', () => {
    let ssrFixture: ComponentFixture<NotFoundComponent>;

    beforeEach(async () => {
      const ssrResponseMock = { status: vi.fn().mockReturnThis() };

      await TestBed.resetTestingModule()
        .configureTestingModule({
          imports: [NotFoundComponent, RouterModule.forRoot([])],
          providers: [
            getTranslocoTestingProviders(),
            { provide: PLATFORM_ID, useValue: 'server' },
            { provide: GoogleAnalyticsService, useValue: { pageView: vi.fn(), event: vi.fn() } },
            { provide: SeoService, useValue: { updateCanonicalUrl: vi.fn() } },
            { provide: RESPONSE, useValue: ssrResponseMock },
          ],
          schemas: [NO_ERRORS_SCHEMA],
        })
        .compileComponents();

      ssrFixture = TestBed.createComponent(NotFoundComponent);
      ssrFixture.detectChanges();
      responseMock = ssrResponseMock;
    });

    it('should set HTTP status 404 on server', () => {
      expect(responseMock.status).toHaveBeenCalledWith(404);
    });

    it('should not track GA on server', () => {
      const gaService = TestBed.inject(
        GoogleAnalyticsService
      ) as unknown as typeof googleAnalyticsServiceMock;
      expect(gaService.pageView).not.toHaveBeenCalled();
    });
  });

  describe('SSR with null RESPONSE', () => {
    it('should not crash when RESPONSE is null on server', async () => {
      await TestBed.resetTestingModule()
        .configureTestingModule({
          imports: [NotFoundComponent, RouterModule.forRoot([])],
          providers: [
            getTranslocoTestingProviders(),
            { provide: PLATFORM_ID, useValue: 'server' },
            { provide: GoogleAnalyticsService, useValue: { pageView: vi.fn(), event: vi.fn() } },
            { provide: SeoService, useValue: { updateCanonicalUrl: vi.fn() } },
          ],
          schemas: [NO_ERRORS_SCHEMA],
        })
        .compileComponents();

      const nullFixture = TestBed.createComponent(NotFoundComponent);
      expect(() => nullFixture.detectChanges()).not.toThrow();
    });
  });
});
