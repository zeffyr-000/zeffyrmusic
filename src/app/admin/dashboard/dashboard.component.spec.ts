import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { AdminDashboardService } from '../../services/admin-dashboard.service';
import { SeoService } from '../../services/seo.service';
import { getTranslocoTestingProviders } from '../../transloco-testing';
import { DashboardResponse } from '../../models/admin-dashboard.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardServiceMock: { getDashboard: ReturnType<typeof vi.fn> };
  let seoServiceMock: { updateCanonicalUrl: ReturnType<typeof vi.fn> };

  const mockResponse: DashboardResponse = {
    stats: {
      newUsersLast24h: 12,
      totalUsers: 5000,
      activeUsersLast7d: 320,
      activeUsersLast30d: 1200,
      totalPlaylists: 800,
      totalAlbums: 3500,
      totalArtists: 1500,
      totalTracks: 25000,
      totalLikes: 15000,
      playlistsCreatedLast24h: 5,
      likesLast24h: 42,
      usersByLanguage: { fr: 120, en: 45 },
      usersByDarkMode: { enabled: 80, disabled: 90 },
    },
    growth: {
      signups: [
        { date: '2026-03-01', count: 3 },
        { date: '2026-03-02', count: 7 },
        { date: '2026-03-03', count: 5 },
      ],
    },
  };

  beforeEach(async () => {
    dashboardServiceMock = {
      getDashboard: vi.fn().mockReturnValue(of(mockResponse)),
    };
    seoServiceMock = {
      updateCanonicalUrl: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: AdminDashboardService, useValue: dashboardServiceMock },
        { provide: SeoService, useValue: seoServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load dashboard data on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dashboardServiceMock.getDashboard).toHaveBeenCalled();
    expect(component.stats()).toEqual(mockResponse.stats);
    expect(component.growth()).toEqual(mockResponse.growth);
    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBe(false);
  });

  it('should show loading state initially', () => {
    dashboardServiceMock.getDashboard.mockReturnValue(of(mockResponse));
    expect(component.isLoading()).toBe(true);
  });

  it('should set error state on failure', async () => {
    dashboardServiceMock.getDashboard.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.error()).toBe(true);
    expect(component.isLoading()).toBe(false);
    expect(component.stats()).toBeNull();
  });

  it('should build user stat cards from stats', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cards = component.userCards();
    expect(cards).toHaveLength(4);
    expect(cards[0].value).toBe(12);
    expect(cards[1].value).toBe(5000);
    expect(cards[2].value).toBe(320);
    expect(cards[3].value).toBe(1200);
  });

  it('should build content stat cards from stats', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cards = component.contentCards();
    expect(cards).toHaveLength(4);
    expect(cards[0].value).toBe(800);
    expect(cards[3].value).toBe(25000);
  });

  it('should build engagement stat cards from stats', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cards = component.engagementCards();
    expect(cards).toHaveLength(3);
    expect(cards[0].value).toBe(15000);
    expect(cards[2].value).toBe(42);
  });

  it('should build chart data from growth', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const chartData = component.signupChartData();
    expect(chartData.labels).toHaveLength(3);
    expect(chartData.labels![0]).toBe('01/03');
    expect(chartData.datasets[0].data).toEqual([3, 7, 5]);
  });

  it('should refresh data when onRefresh is called', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dashboardServiceMock.getDashboard).toHaveBeenCalledTimes(1);

    component.onRefresh();
    await fixture.whenStable();

    expect(dashboardServiceMock.getDashboard).toHaveBeenCalledTimes(2);
  });

  it('should set page title and canonical URL', () => {
    fixture.detectChanges();
    expect(seoServiceMock.updateCanonicalUrl).toHaveBeenCalledWith(
      'http://localhost:4200/admin/dashboard'
    );
  });

  it('should return empty cards when stats is null', () => {
    expect(component.userCards()).toEqual([]);
    expect(component.contentCards()).toEqual([]);
    expect(component.engagementCards()).toEqual([]);
  });

  it('should return empty chart data when growth is null', () => {
    const chartData = component.signupChartData();
    expect(chartData.labels).toEqual([]);
    expect(chartData.datasets).toEqual([]);
  });

  it('should build langItems with correct percentages and order', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const items = component.langItems();
    expect(items).toHaveLength(2);
    // fr has 120 / 165 = 73%
    expect(items[0].labelKey).toBe('admin_dashboard_lang_fr_FR');
    expect(items[0].count).toBe(120);
    expect(items[0].percent).toBe(73);
    // en has 45 / 165 = 27%
    expect(items[1].labelKey).toBe('admin_dashboard_lang_en_US');
    expect(items[1].count).toBe(45);
    expect(items[1].percent).toBe(27);
  });

  it('should build darkModeItems with correct label keys', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const items = component.darkModeItems();
    expect(items).toHaveLength(2);
    // disabled (90) > enabled (80)
    expect(items[0].labelKey).toBe('admin_dashboard_dark_mode_off');
    expect(items[0].count).toBe(90);
    expect(items[0].percent).toBe(53);
    expect(items[1].labelKey).toBe('admin_dashboard_dark_mode_on');
    expect(items[1].count).toBe(80);
    expect(items[1].percent).toBe(47);
  });

  it('should return empty distribution items when stats is null', () => {
    expect(component.langItems()).toEqual([]);
    expect(component.darkModeItems()).toEqual([]);
  });
});
