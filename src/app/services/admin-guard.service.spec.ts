import type { MockedObject } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { AdminGuard } from './admin-guard.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../store';
import { getTranslocoTestingProviders } from '../transloco-testing';

describe('AdminGuard', () => {
  let adminGuard: AdminGuard;
  let authStore: InstanceType<typeof AuthStore>;
  let router: MockedObject<Router>;

  beforeEach(() => {
    const routerSpy = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        getTranslocoTestingProviders(),
        provideHttpClient(withInterceptorsFromDi()),
        AdminGuard,
        { provide: Router, useValue: routerSpy },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    adminGuard = TestBed.inject(AdminGuard);
    authStore = TestBed.inject(AuthStore);
    router = TestBed.inject(Router) as MockedObject<Router>;
  });

  it('should be created', () => {
    expect(adminGuard).toBeTruthy();
  });

  it('should allow admin user to access route', () => {
    authStore.login(
      { pseudo: 'admin', idPerso: '1', mail: 'admin@test.com', isAdmin: true },
      { darkModeEnabled: false, language: 'fr' }
    );

    expect(adminGuard.canActivate()).toBe(true);
  });

  it('should redirect non-admin authenticated user to home', () => {
    authStore.login(
      { pseudo: 'user', idPerso: '2', mail: 'user@test.com', isAdmin: false },
      { darkModeEnabled: false, language: 'fr' }
    );

    const result = adminGuard.canActivate();

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should redirect unauthenticated user to home', () => {
    authStore.logout();

    const result = adminGuard.canActivate();

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should return true on server (SSR)', () => {
    TestBed.resetTestingModule();
    const routerSpy = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        getTranslocoTestingProviders(),
        provideHttpClient(withInterceptorsFromDi()),
        AdminGuard,
        { provide: Router, useValue: routerSpy },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    const serverGuard = TestBed.inject(AdminGuard);
    expect(serverGuard.canActivate()).toBe(true);
  });
});
