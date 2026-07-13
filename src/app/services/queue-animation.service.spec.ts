import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';

import { QueueAnimationService } from './queue-animation.service';

describe('QueueAnimationService', () => {
  let service: QueueAnimationService;
  let document: Document;
  let animateMock: ReturnType<typeof vi.fn>;

  /** Configure matchMedia so reduced-motion and mobile can be controlled per test. */
  const setMatchMedia = (reducedMotion: boolean, mobile: boolean): void => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('reduced-motion') ? reducedMotion : mobile,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );
  };

  const addTarget = (selector: 'sidebar' | 'controlBar'): HTMLElement => {
    const element = document.createElement('div');
    if (selector === 'sidebar') {
      element.id = 'queue-content';
    } else {
      element.id = 'header-burger';
    }
    document.body.appendChild(element);
    return element;
  };

  const createSource = (): HTMLElement => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    return button;
  };

  let originalAnimate: typeof Element.prototype.animate;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(QueueAnimationService);
    document = TestBed.inject(DOCUMENT);

    originalAnimate = Element.prototype.animate;
    animateMock = vi.fn().mockReturnValue({ onfinish: null, oncancel: null });
    Element.prototype.animate = animateMock as unknown as Element['animate'];

    // Make requestAnimationFrame deterministic under vi.useFakeTimers().
    vi.stubGlobal(
      'requestAnimationFrame',
      (cb: (time: number) => void) => globalThis.setTimeout(() => cb(0), 0) as unknown as number
    );
    vi.stubGlobal('cancelAnimationFrame', (id: number) => globalThis.clearTimeout(id));

    setMatchMedia(false, false);
  });

  afterEach(() => {
    vi.useRealTimers();
    Element.prototype.animate = originalAnimate;
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('flyToQueue', () => {
    it('should spawn one ghost and animate it', () => {
      addTarget('sidebar');
      const source = createSource();

      service.flyToQueue(source, 'abc123');

      const ghosts = document.querySelectorAll('.fly-ghost');
      expect(ghosts).toHaveLength(1);
      expect(ghosts[0].querySelector('img')?.getAttribute('src')).toContain('abc123');
      expect(animateMock).toHaveBeenCalledTimes(1);
    });

    it('should not animate when reduced motion is preferred', () => {
      setMatchMedia(true, false);
      addTarget('sidebar');
      const source = createSource();

      service.flyToQueue(source, 'abc123');

      expect(document.querySelectorAll('.fly-ghost')).toHaveLength(0);
      expect(animateMock).not.toHaveBeenCalled();
    });

    it('should do nothing when no queue target exists', () => {
      const source = createSource();

      service.flyToQueue(source, 'abc123');

      expect(document.querySelectorAll('.fly-ghost')).toHaveLength(0);
      expect(animateMock).not.toHaveBeenCalled();
    });

    it('should target the hamburger menu on mobile', () => {
      setMatchMedia(false, true);
      const burger = addTarget('controlBar');
      const rectSpy = vi.spyOn(burger, 'getBoundingClientRect');
      const source = createSource();

      service.flyToQueue(source, 'abc123');

      expect(rectSpy).toHaveBeenCalled();
      expect(document.querySelectorAll('.fly-ghost')).toHaveLength(1);
    });

    it('should add a "+N" badge on the ghost for a bulk add', () => {
      addTarget('sidebar');
      const source = createSource();

      service.flyToQueue(source, 'abc123', 12);

      const badge = document.querySelector('.fly-ghost-badge');
      expect(badge?.textContent).toBe('+12');
    });

    it('should not add a badge for a single add', () => {
      addTarget('sidebar');
      const source = createSource();

      service.flyToQueue(source, 'abc123', 1);

      expect(document.querySelector('.fly-ghost-badge')).toBeNull();
    });

    it('should pulse the last N rows of the queue list without scrolling', () => {
      const list = addTarget('sidebar');
      const items = ['t1', 't2', 't3'].map(() => {
        const item = document.createElement('div');
        item.className = 'track-item';
        list.appendChild(item);
        return item;
      });
      const source = createSource();

      service.flyToQueue(source, 'abc123', 2);
      vi.runAllTimers();

      expect(items[0].classList.contains('track-item-added')).toBe(false);
      expect(items[1].classList.contains('track-item-added')).toBe(true);
      expect(items[2].classList.contains('track-item-added')).toBe(true);
    });

    it('should glow the queue list container on arrival', () => {
      const list = addTarget('sidebar');
      const source = createSource();

      service.flyToQueue(source, 'abc123', 3);
      vi.runAllTimers();

      expect(list.classList.contains('queue-received')).toBe(true);
    });
  });
});
