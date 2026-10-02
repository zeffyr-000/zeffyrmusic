import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Observable, firstValueFrom } from 'rxjs';
import { AbstractAdminListPage } from '../abstract-admin-list-page';
import { AdminListShellComponent } from '../admin-list-shell/admin-list-shell.component';
import { AdminReportService } from '../../services/admin-report.service';
import {
  ALBUM_REPORT_ADMIN_RESULTS,
  ALBUM_REPORT_KNOWN_RESULTS,
  AlbumReport,
  AlbumReportActionResponse,
} from '../../models/album-report.model';
import { UiStore } from '../../store';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  imports: [DatePipe, RouterLink, TranslocoPipe, AdminListShellComponent],
})
export class ReportsComponent extends AbstractAdminListPage<AlbumReport> {
  private readonly adminReportService = inject(AdminReportService);
  private readonly uiStore = inject(UiStore);

  protected readonly titleKey = 'admin_reports_title';
  protected readonly canonicalPath = 'admin/reports';

  /** Id of the report whose action is in flight; disables every action button meanwhile. */
  readonly busyId = signal<string | null>(null);

  protected fetchItems(): Observable<AlbumReport[]> {
    return this.adminReportService.getReports();
  }

  /** Translation key of a result code, or null when the code is unknown (shown raw). */
  resultKey(result: string): string | null {
    if (!result) return 'admin_reports_result_none';
    return ALBUM_REPORT_KNOWN_RESULTS.has(result) ? `admin_reports_result_${result}` : null;
  }

  needsAdmin(result: string): boolean {
    return ALBUM_REPORT_ADMIN_RESULTS.has(result);
  }

  onClose(report: AlbumReport): Promise<void> {
    return this.runAction(
      report,
      id => this.adminReportService.closeReport(id),
      'admin_reports_close_success'
    );
  }

  onRetry(report: AlbumReport): Promise<void> {
    return this.runAction(
      report,
      id => this.adminReportService.retryReport(id),
      'admin_reports_retry_success'
    );
  }

  private async runAction(
    report: AlbumReport,
    action: (id: string) => Observable<AlbumReportActionResponse>,
    successKey: string
  ): Promise<void> {
    if (this.busyId() !== null) return;
    this.busyId.set(report.id);

    try {
      const result = await firstValueFrom(action(report.id));
      if (result.success) {
        this.uiStore.showSuccess(this.translocoService.translate(successKey));
        // The action applies to the whole album, so other rows may have changed too
        await this.load();
      } else {
        this.uiStore.showError(this.translocoService.translate('admin_reports_action_error'));
      }
    } catch {
      this.uiStore.showError(this.translocoService.translate('admin_reports_action_error'));
    } finally {
      this.busyId.set(null);
    }
  }
}
