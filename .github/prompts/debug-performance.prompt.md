# Debug Performance

Analyze and fix performance issues in the Zeffyr Music application.

## Performance Checklist

### 1. Bundle Size

- Initial bundle budget: warning 1.2MB, error 1.5MB
- Component style budget: warning 12kb, error 16kb
- Check current bundle size: `npm run build` and review output
- Use `npx ng build --stats-json` then `npx webpack-bundle-analyzer <stats.json path printed by ng build>` for detailed analysis

### 2. Lazy Loading

- All routes MUST be lazy-loaded (except `HomeComponent`)
- Check `app.routes.ts` for `loadComponent` usage
- Protected routes (`like`, `settings`, `my-playlists`, `my-selection`) need `AuthGuard`

### 3. Change Detection

- ALL components must use `ChangeDetectionStrategy.OnPush`
- Use signals (`signal()`, `computed()`) instead of mutable properties
- Never use `ChangeDetectorRef.markForCheck()` with signals
- App is **zoneless** (`provideZonelessChangeDetection()`) — signals drive all updates

### 4. Image Loading

- `lazy-load-image.directive.ts` uses `IntersectionObserver` — verify it's working
- `default-image.directive.ts` provides fallback on error

### 5. Skeleton Loaders

Every data-dependent page should show skeleton loaders while loading:

| Component               | Usage                           |
| ----------------------- | ------------------------------- |
| `app-skeleton-card`     | Card grids (home, search)       |
| `app-skeleton-list`     | Track lists (search tracks)     |
| `app-skeleton-artist`   | Artist profile page             |
| `app-skeleton-playlist` | Playlist page (header + tracks) |

### 6. SSR & Hydration

- SSR renders initial page quickly
- Use incremental hydration for AI/dynamic content
- Verify `allowedHosts` for production SSR

### 7. Common Issues

| Symptom             | Check                                                      |
| ------------------- | ---------------------------------------------------------- |
| Slow initial load   | Bundle size, lazy loading routes                           |
| Janky scrolling     | OnPush compliance, too many re-renders                     |
| Layout shifts (CLS) | Skeleton loader dimensions, image placeholders             |
| Slow navigation     | Preloading strategy, route-level lazy loading              |
| Memory leak         | Unsubscribed observables, event listeners in `ngOnDestroy` |

### 8. Verification

```bash
npm run build                    # Check bundle budgets
npx vitest run                   # Ensure no regressions
npm run lint                     # Check for optimization hints
```
