import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { AbstractAdminListPage } from '../abstract-admin-list-page';
import { AdminListShellComponent } from '../admin-list-shell/admin-list-shell.component';
import { AdminReportService } from '../../services/admin-report.service';
import { AlbumReport } from '../../models/album-report.model';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  imports: [DatePipe, RouterLink, TranslocoPipe, AdminListShellComponent],
})
export class ReportsComponent extends AbstractAdminListPage<AlbumReport> {
  private readonly adminReportService = inject(AdminReportService);

  protected readonly titleKey = 'admin_reports_title';
  protected readonly canonicalPath = 'admin/reports';

  protected fetchItems(): Observable<AlbumReport[]> {
    return this.adminReportService.getReports();
  }
}
