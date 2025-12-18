import type { MockedObject } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { AuthGuard } from './auth-guard.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { InitService } from './init.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

describe('AuthGuardService', () => {
  let authGuard: AuthGuard;

  let initService: InitService;
  let router: MockedObject<Router>;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const initServiceMock: any = { init: vi.fn() };
    initServiceMock.getIsConnected = vi.fn().mockReturnValue(true);
    initServiceMock.subjectConnectedChange = new BehaviorSubject({
      isConnected: true,
      pseudo: 'test-pseudo',
      idPerso: 'test-idPerso',
      mail: 'test-mail',
    });
    const routerSpy = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        withInterceptorsFromDi(),
        AuthGuard,
        {
          provide: InitService,
          useValue: initServiceMock,
        },
        { provide: Router, useValue: routerSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    authGuard = TestBed.inject(AuthGuard);
    initService = TestBed.inject(InitService);
    router = TestBed.inject(Router) as MockedObject<Router>;
  });

  it('should be created', () => {
    expect(authGuard).toBeTruthy();
  });

  it('should allow the authenticated user to access app', () => {
    initService.getIsConnected = vi.fn().mockReturnValue(true);

    expect(authGuard.canActivate()).toBe(true);
  });

  it('should redirect the unauthenticated user to home page', () => {
    initService.getIsConnected = vi.fn().mockReturnValue(false);

    const result = authGuard.canActivate();

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
