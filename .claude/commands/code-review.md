---
description: Review code changes against Zeffyr Music project conventions
---

# Code Review

Review code changes against Zeffyr Music project conventions.

## Checklist

### Architecture

- [ ] Stores hold state, services handle HTTP + business logic — never mixed
- [ ] No `BehaviorSubject` for shared state — use Signal Stores
- [ ] No direct `Sentry.*` calls — use `LoggingService`

### Components

- [ ] `changeDetection` NOT set (OnPush is the Angular 22 zoneless default; flag any explicit `ChangeDetectionStrategy.OnPush`, and `.Eager` unless justified)
- [ ] `standalone: true` NOT set (default since Angular 19+)
- [ ] `styleUrl` (singular), not `styleUrls`
- [ ] `inject()` function — no constructor injection
- [ ] `readonly` on all injected dependencies and signals
- [ ] Signal values accessed with function call syntax: `this.value()`
- [ ] No `ChangeDetectorRef` / `markForCheck()` with signals (zoneless OnPush default — never needed)

### Templates

- [ ] Modern control flow: `@if`, `@for`, `@switch` — not `*ngIf`, `*ngFor`
- [ ] No redundant `tabindex`, `(keydown.enter)`, `role="button"` on ng-bootstrap directives
- [ ] Skeleton loaders for loading states
- [ ] Empty state pattern when no data

### Styles

- [ ] CSS custom properties from `_custom.scss` — not hardcoded values
- [ ] `@media (hover: hover)` guard for hover effects
- [ ] Bootstrap utilities over custom CSS when possible
- [ ] YouTube `#player` styles in `styles.scss` only (global) — CRITICAL

### SSR Safety

- [ ] `withSsrSafety()` in stores
- [ ] No direct `window`/`document` access — use `isPlatformBrowser()`
- [ ] New hostnames added to `allowedHosts` in `server.ts` if applicable

### Code Quality

- [ ] No `any` types
- [ ] No dead code (unused imports, variables, methods)
- [ ] Method length ≤ 30 lines
- [ ] English-only comments
- [ ] Transloco arrow functions for validation messages

### Testing

- [ ] Vitest (not Jest/Jasmine)
- [ ] Signal assertions use function call: `expect(signal()).toBe(value)`
- [ ] Typed mocks from `test-mocks.model.ts`

### SEO (routed components)

- [ ] Title set via `Title` service
- [ ] Meta description updated
- [ ] Canonical URL set via `SeoService`
