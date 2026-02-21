# Copilot Instructions - Zeffyr Music

> Repository-wide instructions for GitHub Copilot.
> For the complete guide, see `/AGENTS.md`.

## Quick Rules

- **Angular 21** — SSR, standalone components, zoneless (`provideZonelessChangeDetection()`)
- **OnPush** change detection on all components
- **Signal Stores** (`@ngrx/signals`) for shared state — never `BehaviorSubject`
- **`inject()`** function only — no constructor injection
- **Signals syntax**: `this.isLoading()` (function call), not `this.isLoading`
- **`readonly`** on all injected dependencies and signals
- **`styleUrl`** (singular) not `styleUrls`
- **English only** for comments — no French
- **Vitest** for tests — not Jest/Jasmine
- **Modern control flow**: `@if`, `@for`, `@switch` — not `*ngIf`, `*ngFor`

## Component Structure

```typescript
@Component({
  selector: 'app-my-feature',
  templateUrl: './my-feature.component.html',
  styleUrl: './my-feature.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, ...],
})
export class MyFeatureComponent {
  private readonly myService = inject(MyService);
  readonly authStore = inject(AuthStore);
  readonly playlistId = input.required<string>();
  readonly onClose = output<void>();
  readonly isLoading = signal(false);
  readonly displayName = computed(() => this.authStore.pseudo() || 'Guest');
}
```

## Key Patterns

- **SSR safety**: Use `withSsrSafety()` in stores — never access `window`/`document` directly
- **Transloco + Signal Forms**: Arrow functions for validation messages (`message: () => ...`)
- **SEO**: Every routed component sets title, meta description, canonical URL
- **Skeleton loaders**: `app-skeleton-card`, `app-skeleton-list`, `app-skeleton-artist`, `app-skeleton-playlist`
- **Empty state**: `.empty-state` + `.empty-state-icon` + `.empty-state-text` pattern
- **YouTube player CSS**: MUST be in `styles.scss` (global) — see `css-critical-rules.md`

## Architecture

| Concern        | Store | Service |
| -------------- | ----- | ------- |
| State holding  | ✅    | ❌      |
| HTTP calls     | ❌    | ✅      |
| Business logic | ❌    | ✅      |

Stores: `AuthStore`, `PlayerStore`, `QueueStore`, `UserDataStore`, `UiStore`

## Testing

```typescript
import { describe, it, expect, vi, type MockedObject } from 'vitest';
// Signal assertions: expect(component.isLoading()).toBe(false)
// Typed mocks from src/app/models/test-mocks.model.ts
```

## Code Quality

- No `any` types — use proper typing
- No dead code — remove unused imports/variables
- Method length ≤ 30 lines
- `@media (hover: hover)` guard for hover effects
- Bootstrap utilities over custom CSS
