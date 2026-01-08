import type { MockedObject } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { AuthGuard } from './auth-guard.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../store';
import { getTranslocoTestingProviders } from '../transloco-testing';

describe('AuthGuardService', () => {
  let authGuard: AuthGuard;
  let authStore: InstanceType<typeof AuthStore>;
  let router: MockedObject<Router>;

  beforeEach(() => {
    const routerSpy = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        getTranslocoTestingProviders(),
        provideHttpClient(),
        withInterceptorsFromDi(),
        AuthGuard,
        { provide: Router, useValue: routerSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    authGuard = TestBed.inject(AuthGuard);
    authStore = TestBed.inject(AuthStore);
    router = TestBed.inject(Router) as MockedObject<Router>;
  });

  it('should be created', () => {
    expect(authGuard).toBeTruthy();
  });

  it('should allow the authenticated user to access app', () => {
    authStore.login(
      { pseudo: 'test', idPerso: '123', mail: 'test@test.com' },
      { darkModeEnabled: false, language: 'fr' }
    );

    expect(authGuard.canActivate()).toBe(true);
  });

  it('should redirect the unauthenticated user to home page', () => {
    authStore.logout();

    const result = authGuard.canActivate();

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
