import { TestBed } from '@angular/core/testing';

import { AuthGuard } from './auth-guard.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { InitService } from './init.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

describe('AuthGuardService', () => {
  let authGuard: AuthGuard;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let initService: InitService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const initServiceMock = jasmine.createSpyObj('InitService', ['init']);
    initServiceMock.getIsConnected = jasmine.createSpy().and.returnValue(true);
    initServiceMock.subjectConnectedChange = new BehaviorSubject({ isConnected: true, pseudo: 'test-pseudo', idPerso: 'test-idPerso', mail: 'test-mail' });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), withInterceptorsFromDi(),
        AuthGuard,
      {
        provide: InitService,
        useValue: initServiceMock,
      },
      { provide: Router, useValue: routerSpy }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    authGuard = TestBed.inject(AuthGuard);
    initService = TestBed.inject(InitService);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(authGuard).toBeTruthy();
  });

  it('should allow the authenticated user to access app', () => {
    initService.getIsConnected = jasmine.createSpy().and.returnValue(true);

    expect(authGuard.canActivate()).toBeTrue();
  });

  it('should redirect the unauthenticated user to home page', () => {
    initService.getIsConnected = jasmine.createSpy().and.returnValue(false);

    const result = authGuard.canActivate();

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
