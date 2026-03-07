import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID } from '@angular/core';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';

import { UiStore } from '../store/ui/ui.store';
import { Notification } from '../store/ui/ui.models';

/** Global toast container. Place in app.component.html. */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [NgbToast],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  private readonly uiStore = inject(UiStore);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly notifications = this.uiStore.notifications;

  getToastClass(notification: Notification): string {
    return `toast-${notification.type}`;
  }

  onToastHidden(notification: Notification): void {
    this.uiStore.dismissNotification(notification.id);
  }
}
