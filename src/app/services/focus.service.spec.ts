import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { FocusService } from './focus.service';
import { getTranslocoTestingProviders } from '../transloco-testing';

describe('FocusService', () => {
  let service: FocusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FocusService,
        provideRouter([]),
        getTranslocoTestingProviders(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(FocusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create an aria-live announcer element on initialize', () => {
    service.initialize();

    const announcer = document.getElementById('route-announcer');
    expect(announcer).toBeTruthy();
    expect(announcer?.getAttribute('aria-live')).toBe('polite');
    expect(announcer?.getAttribute('role')).toBe('status');
    expect(announcer?.classList.contains('visually-hidden')).toBe(true);
  });
});
