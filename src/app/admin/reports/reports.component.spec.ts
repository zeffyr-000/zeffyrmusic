import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportsComponent } from './reports.component';
import { AdminReportService } from '../../services/admin-report.service';
import { SeoService } from '../../services/seo.service';
import { getTranslocoTestingProviders } from '../../transloco-testing';
import { AlbumReport } from '../../models/album-report.model';
import { UiStore } from '../../store';

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;
  let reportServiceMock: {
    getReports: ReturnType<typeof vi.fn>;
    closeReport: ReturnType<typeof vi.fn>;
    retryReport: ReturnType<typeof vi.fn>;
  };
  let uiStore: InstanceType<typeof UiStore>;
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
      result: 'regenere_a_verifier',
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
      result: 'clos_admin',
    },
  ];

  beforeEach(async () => {
    reportServiceMock = {
      getReports: vi.fn().mockReturnValue(of(mockReports)),
      closeReport: vi.fn().mockReturnValue(of({ success: true })),
      retryReport: vi.fn().mockReturnValue(of({ success: true })),
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

    uiStore = TestBed.inject(UiStore);
    vi.spyOn(uiStore, 'showSuccess').mockReturnValue('mock-id');
    vi.spyOn(uiStore, 'showError').mockReturnValue('mock-id');

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
  });

  async function render(): Promise<HTMLTableRowElement[]> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return Array.from(fixture.nativeElement.querySelectorAll('tbody tr'));
  }

  function resultText(row: HTMLTableRowElement): string {
    return row.querySelector('[data-testid="report-result"]')?.textContent?.trim() ?? '';
  }

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

  describe('result column', () => {
    it('should render the label of a known result code', async () => {
      const rows = await render();
      expect(resultText(rows[0])).toBe('Regenerated, needs review');
      expect(resultText(rows[1])).toBe('Closed by an admin');
    });

    it('should render "Waiting" for an empty result', async () => {
      reportServiceMock.getReports.mockReturnValue(of([{ ...mockReports[0], result: '' }]));
      const rows = await render();
      expect(resultText(rows[0])).toBe('Waiting');
    });

    it('should render an unknown result code raw', async () => {
      reportServiceMock.getReports.mockReturnValue(
        of([{ ...mockReports[0], result: 'brand_new_code' }])
      );
      const rows = await render();
      expect(resultText(rows[0])).toBe('brand_new_code');
    });

    it('should highlight results waiting for an admin', async () => {
      const rows = await render();
      const pendingCell = rows[0].querySelector('[data-testid="report-result"]');
      const doneCell = rows[1].querySelector('[data-testid="report-result"]');
      expect(pendingCell?.classList).toContain('text-danger');
      expect(doneCell?.classList).not.toContain('text-danger');
    });
  });

  describe('actions', () => {
    it('should show Close and Retry only on pending reports', async () => {
      const rows = await render();
      expect(rows[0].querySelector('[data-testid="report-close"]')).toBeTruthy();
      expect(rows[0].querySelector('[data-testid="report-retry"]')).toBeTruthy();
      expect(rows[1].querySelector('[data-testid="report-close"]')).toBeNull();
      expect(rows[1].querySelector('[data-testid="report-retry"]')).toBeNull();
    });

    it('should close the report, toast and reload the list', async () => {
      await render();
      expect(reportServiceMock.getReports).toHaveBeenCalledTimes(1);

      await component.onClose(mockReports[0]);

      expect(reportServiceMock.closeReport).toHaveBeenCalledWith('412');
      expect(uiStore.showSuccess).toHaveBeenCalledWith('Reports closed');
      expect(reportServiceMock.getReports).toHaveBeenCalledTimes(2);
      expect(component.busyId()).toBeNull();
    });

    it('should retry the report, toast and reload the list', async () => {
      await render();

      await component.onRetry(mockReports[0]);

      expect(reportServiceMock.retryReport).toHaveBeenCalledWith('412');
      expect(uiStore.showSuccess).toHaveBeenCalledWith('Reports queued for the next run');
      expect(reportServiceMock.getReports).toHaveBeenCalledTimes(2);
    });

    it('should toast an error and keep the list on success:false', async () => {
      reportServiceMock.closeReport.mockReturnValue(
        of({ success: false, error: 'report_not_found' })
      );
      await render();

      await component.onClose(mockReports[0]);

      expect(uiStore.showError).toHaveBeenCalledWith('The action failed');
      expect(uiStore.showSuccess).not.toHaveBeenCalled();
      expect(reportServiceMock.getReports).toHaveBeenCalledTimes(1);
      expect(component.busyId()).toBeNull();
    });

    it('should toast an error when the request fails', async () => {
      reportServiceMock.retryReport.mockReturnValue(throwError(() => new Error('fail')));
      await render();

      await component.onRetry(mockReports[0]);

      expect(uiStore.showError).toHaveBeenCalledWith('The action failed');
      expect(component.busyId()).toBeNull();
    });

    it('should disable the buttons and ignore clicks while an action is running', async () => {
      const pending = new Subject<{ success: boolean }>();
      reportServiceMock.closeReport.mockReturnValue(pending);
      const rows = await render();

      const first = component.onClose(mockReports[0]);
      fixture.detectChanges();

      const closeButton: HTMLButtonElement = rows[0].querySelector('[data-testid="report-close"]')!;
      const retryButton: HTMLButtonElement = rows[0].querySelector('[data-testid="report-retry"]')!;
      expect(closeButton.disabled).toBe(true);
      expect(retryButton.disabled).toBe(true);

      await component.onClose(mockReports[0]);
      expect(reportServiceMock.closeReport).toHaveBeenCalledTimes(1);

      pending.next({ success: true });
      pending.complete();
      await first;
      expect(component.busyId()).toBeNull();
    });

    it('should trigger the action from the button click', async () => {
      const rows = await render();
      rows[0].querySelector<HTMLButtonElement>('[data-testid="report-retry"]')!.click();
      await fixture.whenStable();

      expect(reportServiceMock.retryReport).toHaveBeenCalledWith('412');
    });
  });
});
