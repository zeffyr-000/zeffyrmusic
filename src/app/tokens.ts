import { InjectionToken } from '@angular/core';

export type SentryLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

export interface SentryApi {
  captureException(error: unknown): string;
  captureMessage(message: string, level: SentryLevel): string;
  setUser(user: { id: string } | null): void;
  addBreadcrumb(breadcrumb: {
    message: string;
    category: string;
    data?: Record<string, unknown>;
    level: SentryLevel;
  }): void;
  setTag(key: string, value: string): void;
  withScope(callback: (scope: { setExtra(key: string, value: unknown): void }) => void): void;
}

export const SENTRY_API = new InjectionToken<SentryApi>('Sentry API');

export interface ServerRequest {
  url: string;
  method: string;
  baseUrl: string;
  originalUrl: string;
  path: string;

  headers: {
    cookie?: string;
    [key: string]: string | string[] | undefined;
  };
  cookies?: Record<string, string>;

  query: Record<string, string | string[]>;
  params: Record<string, string>;
  body?: unknown;

  protocol: string;
  secure: boolean;
  ip: string;

  [key: string]: unknown;
}

export const REQUEST = new InjectionToken<ServerRequest>('REQUEST');
