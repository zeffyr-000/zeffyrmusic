import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../store/auth/auth.store';
import { UiStore } from '../store/ui/ui.store';
import { TranslocoService } from '@jsverse/transloco';

/**
 * Global HTTP error interceptor.
 * Handles 401, 403, 500+ and timeout errors centrally.
 * Individual services can still add their own catchError for specific handling.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const uiStore = inject(UiStore);
  const translocoService = inject(TranslocoService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Skip ping requests — they have their own error handling (reload modal)
      if (req.url.includes('ping')) {
        return throwError(() => error);
      }

      switch (error.status) {
        case 401:
          uiStore.showSessionExpired();
          authStore.logout();
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
