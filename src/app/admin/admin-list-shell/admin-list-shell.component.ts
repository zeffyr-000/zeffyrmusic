import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AdminNavComponent } from '../admin-nav/admin-nav.component';

/**
 * Shared chrome for admin list pages (duplicate albums / artists):
 * admin bar, sub-navigation, page header with refresh button, intro text and
 * the loading / error / empty states. The page-specific content (tables) is
 * projected into the loaded state via <ng-content>.
 */
@Component({
  selector: 'app-admin-list-shell',
  templateUrl: './admin-list-shell.component.html',
  styleUrl: './admin-list-shell.component.scss',
  imports: [TranslocoPipe, AdminNavComponent],
})
export class AdminListShellComponent {
  readonly icon = input.required<string>();
  readonly titleKey = input.required<string>();
  readonly introKey = input.required<string>();
  readonly emptyKey = input.required<string>();
  readonly loading = input.required<boolean>();
  readonly error = input.required<boolean>();
  readonly empty = input.required<boolean>();

  readonly refresh = output<void>();

  readonly skeletonItems = [0, 1, 2];
}
