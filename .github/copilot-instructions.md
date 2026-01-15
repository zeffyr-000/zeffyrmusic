# Copilot Instructions - Zeffyr Music

> Repository-wide custom instructions for GitHub Copilot.
> These guidelines ensure consistent, production-ready code quality.

## Project Overview

- **Framework**: Angular 21 with SSR (Server-Side Rendering)
- **State Management**: @ngrx/signals (Signal Stores)
- **Testing**: Vitest (unit), Cypress (E2E)
- **Styling**: SCSS + Bootstrap 5
- **i18n**: Transloco (fr/en)
- **Change Detection**: OnPush everywhere (zoneless-ready)

## Critical Rules

### State Management

- Use Signal Stores (`@ngrx/signals`) for all shared state
- Never use `BehaviorSubject`/`Subject` for application state
- Inject stores with `inject(StoreName)`

### Change Detection

- Use `signal()` for local component state
- Never use `ChangeDetectorRef.markForCheck()` with signals
- All components must use `ChangeDetectionStrategy.OnPush`

### Dependency Injection

- Always use the `inject()` function
- Never use constructor injection

### Signals Syntax

- Access signal values with function call syntax: `this.isLoading()`, not `this.isLoading`
- Use `computed()` for derived state
- Use `effect()` sparingly for side effects

### SSR Compatibility

- Always check platform before accessing browser APIs
- Use `withSsrSafety()` feature in stores
- Never access `window`, `document`, `localStorage` directly without platform checks

### Comments & Documentation

- Write all comments in English (no French)
- Keep JSDoc concise - avoid verbose examples
- One-line summary for simple functions

### Testing

- Framework: Vitest
- Minimum coverage: 80%
- Use typed mocks from `src/app/models/test-mocks.model.ts`
- Test signal values with function call syntax: `expect(component.isLoading()).toBe(false)`

### Transloco i18n

- Use arrow functions for validation messages in Signal Forms:
  ```typescript
  message: () => this.translocoService.translate('key', { param: value });
  ```
- Never call `translate()` directly in form schema definitions

## Architecture

### Folder Structure

```
src/app/
├── store/           # Signal Stores (centralized state)
├── services/        # Business logic & HTTP calls
├── models/          # TypeScript interfaces
├── utils/           # Shared utility functions
├── directives/      # Shared directives
├── pipes/           # Custom pipes
└── [feature]/       # Feature modules (lazy-loaded)
```

### Store vs Service Responsibilities

| Concern         | Store | Service |
| --------------- | ----- | ------- |
| State holding   | ✅    | ❌      |
| State mutations | ✅    | ❌      |
| HTTP calls      | ❌    | ✅      |
| Business logic  | ❌    | ✅      |

### Available Stores

| Store           | Purpose                                   |
| --------------- | ----------------------------------------- |
| `AuthStore`     | Authentication, user preferences          |
| `PlayerStore`   | Playback state (status, progress, volume) |
| `QueueStore`    | Playlist queue, current track             |
| `UserDataStore` | User playlists, follows, likes            |
| `UiStore`       | UI state (modals, notifications, mobile)  |

## Code Quality

- No dead code (remove unused imports, variables, methods)
- No code duplication (extract shared logic)
- Method length ≤ 30 lines
- Cyclomatic complexity ≤ 10
- No `any` types (use proper typing)

## Git Conventions

```
feat: add playlist sharing feature
fix: resolve SSR hydration mismatch
refactor: migrate SettingsComponent to signals
test: add coverage for AuthStore
docs: update documentation
```
