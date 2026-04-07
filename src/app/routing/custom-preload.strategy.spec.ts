import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Route } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { CustomPreloadStrategy } from './custom-preload.strategy';

describe('CustomPreloadStrategy', () => {
  let strategy: CustomPreloadStrategy;

  beforeEach(() => {
    strategy = new CustomPreloadStrategy();
  });

  it('should preload routes without noPreload flag', async () => {
    const route: Route = { path: 'playlist/:id' };
    const load = vi.fn(() => of(true));

    const result = await firstValueFrom(strategy.preload(route, load));

    expect(load).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should not preload routes with noPreload flag', async () => {
    const route: Route = { path: 'admin/dashboard', data: { noPreload: true } };
    const load = vi.fn(() => of(true));

    const result = await firstValueFrom(strategy.preload(route, load));

    expect(load).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
