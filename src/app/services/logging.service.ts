import { Injectable, inject } from '@angular/core';
import { SENTRY_API } from '../tokens';

/**
 * Centralized logging and error reporting service.
 * Abstracts Sentry SDK calls to decouple application code from the monitoring provider.
 * SSR-safe: SENTRY_API token is only provided in browser configs, so all methods
 * are automatic no-ops on the server with zero @sentry/angular in the SSR bundle.
 */
@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  private readonly sentry = inject(SENTRY_API, { optional: true });

  /**
   * Forward an exception to Sentry with optional scope extras.
   * Callers are responsible for passing a clean `Error` (not raw framework objects
   * like `HttpErrorResponse`) so issues group cleanly in Sentry. The `errorInterceptor`
   * is the canonical example: it builds `new Error('HTTP {status} on {method} {path}')`
   * with a sanitized URL and forwards HTTP fields via `context`.
   */
  captureError(error: unknown, context?: Record<string, unknown>): void {
    if (!this.sentry) return;
    this.withContext(context, undefined, () => this.sentry!.captureException(error));
  }

  captureWarning(message: string, context?: Record<string, unknown>, fingerprint?: string[]): void {
    if (!this.sentry) return;
    this.withContext(context, fingerprint, () => this.sentry!.captureMessage(message, 'warning'));
  }

  captureInfo(message: string, context?: Record<string, unknown>, fingerprint?: string[]): void {
    if (!this.sentry) return;
    this.withContext(context, fingerprint, () => this.sentry!.captureMessage(message, 'info'));
  }

  setUser(user: { id: string } | null): void {
    this.sentry?.setUser(user);
  }

  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    this.sentry?.addBreadcrumb({ message, category, data, level: 'info' });
  }

  setTag(key: string, value: string): void {
    this.sentry?.setTag(key, value);
  }

  private withContext(
    context: Record<string, unknown> | undefined,
    fingerprint: string[] | undefined,
    capture: () => void
  ): void {
    this.sentry!.withScope(scope => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => scope.setExtra(key, value));
      }
      if (fingerprint && fingerprint.length > 0) {
        scope.setFingerprint(fingerprint);
      }
      capture();
    });
  }
}
