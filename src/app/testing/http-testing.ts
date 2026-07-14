/**
 * Shared HTTP testing setup — replaces the provideHttpClient +
 * provideHttpClientTesting boilerplate repeated across service specs.
 *
 * Usage:
 * ```ts
 * TestBed.configureTestingModule({
 *   providers: [MyService, ...provideHttpTesting()],
 * });
 * const httpMock = TestBed.inject(HttpTestingController);
 * afterEach(() => httpMock.verify());
 * ```
 */
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type { EnvironmentProviders, Provider } from '@angular/core';

export function provideHttpTesting(): (EnvironmentProviders | Provider)[] {
  return [provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()];
}
