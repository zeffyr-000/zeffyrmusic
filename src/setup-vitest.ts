import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

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
    constructor(_callback?: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
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
  (globalThis as any).Touch = class Touch {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(config: any) {
      Object.assign(this, config);
    }
  };
}

// Mock window.scrollTo for jsdom (not implemented)
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  window.scrollTo = () => {};
}

// Ensure there's at least one script tag in the document for player.service.ts
if (typeof document !== 'undefined' && document.getElementsByTagName('script').length === 0) {
  const script = document.createElement('script');
  document.head.appendChild(script);
}

// First, initialize the Angular testing environment only once
try {
  getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
} catch {
  // Platform already initialized, ignore
}
