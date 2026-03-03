# Zeffyr Music — Architecture

## System Overview

Music streaming app built with **Angular 21** (SSR, zoneless, OnPush). Plays YouTube videos via IFrame API with a custom UI, centralized state via `@ngrx/signals`.

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│  Components ← Signal Stores ← Services      │
│       └── YouTube IFrame API                 │
└──────────────────┬──────────────────────────┘
                   │ HTTP
┌──────────────────▼──────────────────────────┐
│         Express.js SSR Server                │
│  Angular SSR + API Proxy                     │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│     PHP/Jelix Backend (snake_case API)       │
└─────────────────────────────────────────────┘
```

## Data Flows

### Playback

```
User clicks track → PlayerService → QueueStore.setQueue()
  → YouTubePlayerService → YouTube IFrame API
  → onStateChange → PlayerStore.setStatus() / updateProgress()
  → Components react via signals
```

### Authentication

```
InitService.ping() → API /ping → AuthStore.login()
  → Components read authStore.isAuthenticated()
  → Protected routes use AuthGuard
```

### User Actions (playlists, follows, likes)

```
Component → UserLibraryService.addLike() → API POST
  → UserDataStore.likeVideo() → Components react
```

### Cross-component notification via UiStore

When an action in one component must trigger a reload in another (e.g. adding a video to a playlist from the header modal while `PlaylistComponent` is visible), use a dedicated signal in `UiStore` rather than a `BehaviorSubject` or a forced router navigation.

```
HeaderComponent.onAddVideo() → API POST (success)
  → uiStore.notifyVideoAddedToPlaylist(idPlaylist)
  → PlaylistComponent effect() watches videoAddedToPlaylistId()
  → if id matches current playlist → loadPlaylist()
```

`videoAddedToPlaylistId` stores `{ id: string; ts: number }` — the `ts` field guarantees a new object reference on every notification, so the Angular effect fires even when the same playlist is targeted consecutively.

## State Management

5 Signal Stores in `src/app/store/`:

| Store           | Purpose                                               | Key Signals                                                                             |
| --------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `AuthStore`     | Auth, preferences, dark mode                          | `isAuthenticated()`, `pseudo()`, `isDarkMode()`                                         |
| `PlayerStore`   | Playback state                                        | `isPlaying()`, `volume()`, `progress()`, `duration()`                                   |
| `QueueStore`    | Track queue, shuffle                                  | `currentVideo()`, `items()`, `isShuffled()`, `hasNext()`                                |
| `UserDataStore` | Playlists, follows, likes                             | `playlists()`, `follows()`, `likedVideos()`                                             |
| `UiStore`       | Modals, notifications, mobile, cross-component events | `isPlayerExpanded()`, `hasActiveModal()`, `notifications()`, `videoAddedToPlaylistId()` |

All stores use `withSsrSafety()` for safe browser API access.

### Store Features (`src/app/store/features/`)

| Feature              | Methods                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `withSsrSafety()`    | `isBrowser()`, `runInBrowser()`, `getLocalStorage()`, `setLocalStorage()`, `setBodyAttribute()`, `checkIsMobile()` |
| `withLocalStorage()` | Automatic localStorage persistence                                                                                 |

## Design Decisions

### Zoneless

`provideZonelessChangeDetection()` — no Zone.js. Explicit change detection via signals. All components use `OnPush`.

### Signal Stores over NgRx

Smaller bundle, native signals integration, simpler boilerplate, type-safe.

### Signal Forms

`@angular/forms/signals` — `form()` + schema validators. Arrow functions for Transloco messages (deferred evaluation).

### SSR + Hydration

`provideClientHydration(withEventReplay())` — SEO + fast FCP. `TransferState` shares data.

### Standalone Components

100% standalone (Angular 21 default). No NgModules. Better tree-shaking and lazy loading.

## Routing

All routes lazy-loaded except `HomeComponent`. Protected routes: `like`, `settings`, `my-playlists`, `my-selection`.

```typescript
{ path: 'playlist/:id_playlist', loadComponent: () => import('./playlist/playlist.component').then(m => m.PlaylistComponent) }
```

Router configured with `withPreloading(PreloadAllModules)` and `withViewTransitions()` (200ms cross-fade, blur on navigate to prevent aria-hidden focus conflicts).

## Performance

| Strategy          | Impact                       |
| ----------------- | ---------------------------- |
| Lazy loading      | -40% initial bundle          |
| Zoneless          | -100KB (no Zone.js)          |
| OnPush            | Fewer CD cycles              |
| PreloadAllModules | Fast subsequent nav          |
| Image lazy load   | `appLazyLoadImage` directive |

Budgets: initial 1.2MB warning / 1.5MB error, component style 12kb / 16kb.

## Directory Structure

```
src/app/
├── store/          # 5 Signal Stores + features
├── services/       # 13 services (HTTP + business logic)
├── models/         # 10 TypeScript interface files
├── directives/     # 3 shared directives + 4 skeleton components
├── pipes/          # toMMSS pipe
├── utils/          # formatTime utility
├── interceptor/    # HTTP interceptors
├── routing/        # Route guards
└── [feature]/      # 15 feature components (mostly lazy-loaded)
    ├── home/  artist/  playlist/  search/
    ├── current/  my-playlists/  my-selection/
    ├── settings/  help/  reset-password/
    ├── header/  control-bar/  player/
    └── search-bar/  toast-container/
```

## Testing

- **Unit**: Vitest — 623+ tests across 45+ spec files
- **E2E**: Cypress — critical user flows
- **Coverage**: ≥ 80% target
- **Mocks**: Typed interfaces in `src/app/models/test-mocks.model.ts`
