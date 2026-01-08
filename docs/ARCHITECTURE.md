# ZeffyrMusic - Architecture Documentation

## Table of Contents

- [System Overview](#system-overview)
- [Data Flow Diagrams](#data-flow-diagrams)
- [Design Decisions](#design-decisions)
- [Performance Strategy](#performance-strategy)
- [Directory Structure](#directory-structure)

---

## System Overview

ZeffyrMusic is a modern music streaming web application built with **Angular 21** using a **zoneless architecture** for optimal performance. The application follows a component-based architecture with centralized state management using **@ngrx/signals**.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Angular   │  │   Signal    │  │     YouTube Player      │  │
│  │ Components  │◄─┤   Stores    │  │         API             │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                      │                │
│         └────────────────┼──────────────────────┘                │
│                          │                                       │
│                   ┌──────▼──────┐                                │
│                   │  Services   │                                │
│                   └──────┬──────┘                                │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────────────┐
│                    Express.js SSR Server                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │  Angular SSR    │  │   API Proxy     │                       │
│  │   Rendering     │  │   Middleware    │                       │
│  └─────────────────┘  └────────┬────────┘                       │
└────────────────────────────────┼────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                      Backend API Server                          │
│             (PHP/Jelix - External Service)                       │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component            | Technology            | Purpose                        |
| -------------------- | --------------------- | ------------------------------ |
| **Frontend**         | Angular 21            | SPA with SSR support           |
| **State Management** | @ngrx/signals         | Reactive state with signals    |
| **Player**           | YouTube IFrame API    | Music video playback           |
| **Styling**          | Bootstrap 5 + SCSS    | Responsive UI                  |
| **i18n**             | Transloco             | Multi-language support (FR/EN) |
| **SSR**              | Angular SSR + Express | Server-side rendering          |

---

## Data Flow Diagrams

### 1. Authentication Flow

```
┌──────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────┐
│  User    │───▶│   Header    │───▶│ UserService │───▶│  Backend │
│  Login   │    │  Component  │    │             │    │   API    │
└──────────┘    └──────┬──────┘    └──────┬──────┘    └────┬─────┘
                       │                  │                 │
                       │                  │    Response     │
                       │                  │◀────────────────┘
                       │                  │
                       │           ┌──────▼──────┐
                       │           │  AuthStore  │
                       │           │  (signals)  │
                       │           └──────┬──────┘
                       │                  │
                       ▼                  ▼
              ┌─────────────────────────────────┐
              │    UI Updates (Reactive)        │
              │  - User menu visible            │
              │  - Protected routes accessible  │
              └─────────────────────────────────┘
```

### 2. Music Playback Flow

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│  Playlist    │────▶│ PlayerService │────▶│   QueueStore     │
│  Component   │     │               │     │  (current track) │
└──────────────┘     └───────┬───────┘     └────────┬─────────┘
                             │                       │
                             ▼                       ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │  YouTubePlayer  │◀───│   PlayerStore   │
                    │    Service      │    │ (playing state) │
                    └────────┬────────┘    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  YouTube IFrame │
                    │      API        │
                    └─────────────────┘
```

### 3. State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Signal Stores                            │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│  AuthStore  │ PlayerStore │ QueueStore  │  UserDataStore   │
│             │             │             │                  │
│ • pseudo    │ • isPlaying │ • queue     │ • playlists      │
│ • idPerso   │ • volume    │ • currentKey│ • follows        │
│ • isAuth    │ • duration  │ • sourceId  │ • likedVideos    │
│ • isDarkMode│ • position  │ • shuffle   │                  │
└─────────────┴─────────────┴─────────────┴──────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        Components     Components      Components
        (reactive)     (reactive)      (reactive)
```

---

## Design Decisions

### 1. Zoneless Architecture

**Decision**: Use Angular's experimental zoneless change detection.

**Rationale**:

- Eliminates Zone.js overhead (~100KB bundle reduction)
- Explicit change detection via signals
- Better performance for real-time updates (music player)
- Prepares codebase for Angular's future direction

**Implementation**:

```typescript
// app.config.ts
provideExperimentalZonelessChangeDetection();
```

### 2. Signal-Based State Management

**Decision**: Use @ngrx/signals instead of traditional NgRx Store.

**Rationale**:

- Smaller bundle size compared to full NgRx
- Native Angular signals integration
- Simpler boilerplate
- Type-safe by default
- Better tree-shaking

**Stores implemented**:

- `AuthStore` - Authentication state
- `PlayerStore` - Player state (volume, playing, etc.)
- `QueueStore` - Music queue management
- `UserDataStore` - User playlists and preferences
- `UiStore` - UI state (modals, alerts)

### 3. OnPush Change Detection Everywhere

**Decision**: All components use `ChangeDetectionStrategy.OnPush`.

**Rationale**:

- Reduces change detection cycles
- Works well with signals and immutable data
- Required for zoneless mode

### 4. SSR with Hydration

**Decision**: Server-side rendering with client hydration.

**Rationale**:

- Better SEO for music content
- Faster First Contentful Paint (FCP)
- Improved Core Web Vitals

**Implementation**:

```typescript
// app.config.server.ts
provideClientHydration(withEventReplay());
```

### 5. Standalone Components

**Decision**: 100% standalone components (no NgModules).

**Rationale**:

- Simpler dependency management
- Better tree-shaking
- Easier lazy loading
- Angular 21 best practice

### 6. Signal Forms (Experimental)

**Decision**: Use Angular's experimental Signal Forms API (`@angular/forms/signals`) for all forms.

**Rationale**:

- Native signal integration for reactive form state
- Type-safe form models
- Simplified validation with declarative validators
- Better performance with fine-grained reactivity
- Preparation for Angular's future forms direction

**Implementation with Transloco i18n**:

```typescript
import { form, Field, required, minLength } from '@angular/forms/signals';
import { TranslocoService } from '@jsverse/transloco';

private transloco = inject(TranslocoService);

readonly formModel = signal({
  email: '',
  password: '',
});

readonly myForm = form(this.formModel, schemaPath => {
  // required() without message - submit button is disabled when form is invalid
  required(schemaPath.email);
  required(schemaPath.password);
  // minLength with message - shown when user enters invalid value
  minLength(schemaPath.password, 6, {
    message: this.transloco.translate('validation_password_minlength', { min: 6 })
  });
});
```

Translation files use Transloco interpolation for dynamic values:

```json
{
  "validation_password_minlength": "Password must be at least {{ min }} characters"
}
```

Templates display the pre-translated message directly:

```html
<input type="password" [field]="myForm.password" />
@for (error of myForm.password().errors(); track error.kind) {
<div>{{ error.message }}</div>
}
```

### 7. Feature-Based Folder Structure

**Decision**: Organize code by feature, not by type.

**Rationale**:

- Easier navigation
- Better encapsulation
- Simpler refactoring
- Co-location of related files

---

## Performance Strategy

### 1. Bundle Optimization

| Strategy           | Implementation          | Impact              |
| ------------------ | ----------------------- | ------------------- |
| **Lazy Loading**   | Routes loaded on demand | -40% initial bundle |
| **Tree Shaking**   | Standalone components   | -15% unused code    |
| **Zoneless**       | No Zone.js              | -100KB              |
| **Code Splitting** | Per-route chunks        | Faster navigation   |

### 2. Performance Budgets

```json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "1.2MB",
      "maximumError": "1.5MB"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "6kb",
      "maximumError": "10kb"
    }
  ]
}
```

### 3. Runtime Optimizations

| Optimization               | Description                         |
| -------------------------- | ----------------------------------- |
| **OnPush Detection**       | Only check when inputs change       |
| **Signal Reactivity**      | Fine-grained updates                |
| **TrackBy Functions**      | Efficient list rendering            |
| **Lazy Loading Images**    | Custom `appLazyLoadImage` directive |
| **Default Image Fallback** | `appDefaultImage` directive         |

### 4. Caching Strategy

- **TransferState**: Share data between SSR and client
- **HTTP Interceptors**: Cache API responses
- **LocalStorage**: Persist user preferences and auth state

### 5. Core Web Vitals Targets

| Metric  | Target  | Strategy                  |
| ------- | ------- | ------------------------- |
| **LCP** | < 2.5s  | SSR + image optimization  |
| **FID** | < 100ms | Zoneless + code splitting |
| **CLS** | < 0.1   | Reserved image dimensions |

---

## Directory Structure

```
src/
├── app/
│   ├── artist/              # Artist feature
│   ├── current/             # Current queue feature
│   ├── directives/          # Shared directives
│   │   ├── default-image.directive.ts
│   │   ├── lazy-load-image.directive.ts
│   │   └── swipe-down.directive.ts
│   ├── header/              # Header component
│   ├── help/                # Help pages
│   ├── home/                # Home page
│   ├── interceptor/         # HTTP interceptors
│   ├── models/              # TypeScript interfaces
│   ├── my-playlists/        # User playlists
│   ├── my-selection/        # User selection
│   ├── pipes/               # Custom pipes
│   ├── player/              # Player component
│   ├── playlist/            # Playlist feature
│   ├── reset-password/      # Password reset
│   ├── routing/             # Route guards
│   ├── search/              # Search feature
│   ├── search-bar/          # Search bar component
│   ├── services/            # Business logic
│   │   ├── artist.service.ts
│   │   ├── init.service.ts
│   │   ├── player.service.ts
│   │   ├── playlist.service.ts
│   │   ├── search.service.ts
│   │   ├── user.service.ts
│   │   ├── user-library.service.ts
│   │   └── youtube-player.service.ts
│   ├── settings/            # User settings
│   ├── store/               # Signal stores
│   │   ├── auth/
│   │   ├── player/
│   │   ├── queue/
│   │   ├── ui/
│   │   ├── user-data/
│   │   └── features/        # Shared store features
│   └── utils/               # Utility functions
├── assets/
│   ├── i18n/                # Translation files
│   ├── img/                 # Images
│   └── font/                # Fonts
├── environments/            # Environment configs
└── styling/                 # Global SCSS
```

---

## Testing Strategy

### Unit Tests (Vitest)

- **527 tests** covering all components and services
- Signal stores fully tested
- Mock providers for external dependencies

### E2E Tests (Cypress)

- Critical user flows tested
- Artist page navigation
- Playlist interactions

### Coverage Targets

| Type       | Target | Current |
| ---------- | ------ | ------- |
| Statements | > 80%  | ✅      |
| Branches   | > 75%  | ✅      |
| Functions  | > 80%  | ✅      |

---

_Last updated: January 2026_
