import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../store/auth/auth.store';
import { UiStore } from '../store/ui/ui.store';
import { TranslocoService } from '@jsverse/transloco';
import { InitService } from '../services/init.service';
import { LoggingService } from '../services/logging.service';
import { sanitizeUrl } from '../utils';

/**
 * Global HTTP error interceptor.
 * Handles 401, 403, 500+ and timeout errors centrally.
 * Individual services can still add their own catchError for specific handling.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const uiStore = inject(UiStore);
  const translocoService = inject(TranslocoService);
  const injector = inject(Injector);
  const loggingService = inject(LoggingService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Skip ping requests — they have their own error handling (reload modal)
      if (req.url.includes('ping')) {
        return throwError(() => error);
      }

      // Report to Sentry — skip 401 (session expiry is a normal flow)
      if (error.status !== 401) {
        const path = sanitizeUrl(req.url);
        loggingService.captureError(new Error(`HTTP ${error.status} on ${req.method} ${path}`), {
          'http.url': path,
          'http.method': req.method,
          'http.status_code': error.status,
          'http.status_text': error.statusText,
        });
      }

      switch (error.status) {
        case 401:
          // Guard: run session-expiration flow only once per event
          if (authStore.isAuthenticated()) {
            injector.get(InitService).onMessageUnlog();
          }
          break;

        case 403:
          uiStore.showError(translocoService.translate('generic_error'));
          break;

        case 0:
          // Network error or timeout
          uiStore.showError(translocoService.translate('perte_connexion'));
          break;

        default:
          if (error.status >= 500) {
            uiStore.showError(translocoService.translate('generic_error'));
          }
          break;
      }

      return throwError(() => error);
    })
  );
};
