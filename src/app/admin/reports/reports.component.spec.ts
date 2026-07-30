import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportsComponent } from './reports.component';
import { AdminReportService } from '../../services/admin-report.service';
import { SeoService } from '../../services/seo.service';
import { getTranslocoTestingProviders } from '../../transloco-testing';
import { AlbumReport } from '../../models/album-report.model';

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;
  let reportServiceMock: { getReports: ReturnType<typeof vi.fn> };
  let seoServiceMock: { updateCanonicalUrl: ReturnType<typeof vi.fn> };

  const mockReports: AlbumReport[] = [
    {
      id: '412',
      reportedAt: 1753876320,
      albumId: '8371',
      albumTitle: 'Random Access Memories',
      albumArtist: 'Daft Punk',
      reason: 'missing_tracks',
      userPseudo: 'jdoe',
      status: 'pending',
    },
    {
      id: '399',
      reportedAt: 1753790000,
      albumId: '5120',
      albumTitle: 'Nevermind',
      albumArtist: 'Nirvana',
      reason: 'wrong_album',
      userPseudo: 'alice',
      status: 'processed',
    },
  ];

  beforeEach(async () => {
    reportServiceMock = {
      getReports: vi.fn().mockReturnValue(of(mockReports)),
    };
    seoServiceMock = { updateCanonicalUrl: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [
        getTranslocoTestingProviders(),
        provideRouter([]),
        { provide: AdminReportService, useValue: reportServiceMock },
        { provide: SeoService, useValue: seoServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
  });

  it('should load reports on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reportServiceMock.getReports).toHaveBeenCalled();
    expect(component.items()).toEqual(mockReports);
    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBe(false);
  });

  it('should show loading state initially', () => {
    expect(component.isLoading()).toBe(true);
  });

  it('should set error state on failure', async () => {
    reportServiceMock.getReports.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.error()).toBe(true);
    expect(component.isLoading()).toBe(false);
    expect(component.items()).toEqual([]);
  });

  it('should refresh data when onRefresh is called', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(reportServiceMock.getReports).toHaveBeenCalledTimes(1);

    component.onRefresh();
    await fixture.whenStable();
    expect(reportServiceMock.getReports).toHaveBeenCalledTimes(2);
  });

  it('should set canonical URL', () => {
    fixture.detectChanges();
    expect(seoServiceMock.updateCanonicalUrl).toHaveBeenCalledWith(
      'http://localhost:4200/admin/reports'
    );
  });

  it('should render one row per report, linking to the album', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows: HTMLTableRowElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('tbody tr')
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelector('a')?.getAttribute('href')).toBe('/playlist/8371');
    expect(rows[1].querySelector('a')?.getAttribute('href')).toBe('/playlist/5120');
  });

  it('should render the reason label from the shared report keys', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const firstRow: HTMLTableRowElement = fixture.nativeElement.querySelector('tbody tr');
    expect(firstRow.textContent).toContain("Tracks are missing or won't play");
  });

  it('should render a coloured status badge per report', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows: HTMLTableRowElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('tbody tr')
    );
    expect(rows[0].querySelector('.badge.text-bg-warning')).toBeTruthy();
    expect(rows[1].querySelector('.badge.text-bg-success')).toBeTruthy();
  });

  it('should fall back to placeholders when album and user are gone', async () => {
    reportServiceMock.getReports.mockReturnValue(
      of([{ ...mockReports[0], albumTitle: '', albumArtist: '', userPseudo: '' }])
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const firstRow: HTMLTableRowElement = fixture.nativeElement.querySelector('tbody tr');
    expect(firstRow.textContent).toContain('Deleted album');
    expect(firstRow.textContent).toContain('Deleted account');
    expect(firstRow.querySelector('a')?.getAttribute('href')).toBe('/playlist/8371');
  });
});
