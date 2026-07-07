import { NgModule, provideZonelessChangeDetection } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

// The app runs zoneless (provideZonelessChangeDetection in app.config.ts), so
// tests do too — no zone.js import. This module provides zoneless change
// detection to every TestBed via the test environment.
@NgModule({ providers: [provideZonelessChangeDetection()] })
class ZonelessTestModule {}

// Define global fail function for Vitest
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).fail = (reason?: string) => {
  throw new Error(reason || 'Test failed');
};

// Mock IntersectionObserver for jsdom
if (typeof IntersectionObserver === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).IntersectionObserver = class IntersectionObserver {
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    observe(_target: Element) {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    unobserve(_target: Element) {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  };
}

// Mock Touch for jsdom
if (typeof Touch === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Touch = function Touch(this: Touch, config: TouchInit) {
    Object.assign(this, config);
  };
}

// Mock scrollTo for jsdom — jsdom defines it but throws "Not implemented",
// so always override to a no-op for tests.
// eslint-disable-next-line @typescript-eslint/no-empty-function
globalThis.scrollTo = () => {};

// Ensure there's at least one script tag in the document for player.service.ts
if (typeof document !== 'undefined' && document.getElementsByTagName('script').length === 0) {
  const script = document.createElement('script');
  document.head.appendChild(script);
}

// First, initialize the Angular testing environment only once
try {
  getTestBed().initTestEnvironment(
    [BrowserTestingModule, ZonelessTestModule],
    platformBrowserTesting()
  );
} catch {
  // Platform already initialized, ignore
}
