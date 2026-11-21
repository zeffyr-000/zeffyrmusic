# ControlBar Component

Fixed bottom bar that provides playback controls, seek/volume sliders, and track info.

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [left: thumbnail + info + like]  [center: controls + seek]  [right: volume]  │
└─────────────────────────────────────────────────────────────────────┘
```

- **Left zone** (`cb-left`): Album artwork, track title/artist, like button.
- **Center zone** (`cb-center`): Transport buttons (prev/play/next), secondary actions (fullscreen, repeat, shuffle), seek slider with timestamps.
- **Right zone** (`cb-right`): Volume icon + slider.

On mobile (≤ 750px) the left/right zones are hidden and replaced by a compact title + play button. Tapping the title expands the bar into a full-screen mobile player.

## CSS Architecture

All selectors use the `cb-` prefix (short for **c**ontrol-**b**ar). No ID selectors — everything is class-based for specificity consistency.

### Selector Reference

| Selector                   | Purpose                                                        |
| -------------------------- | -------------------------------------------------------------- |
| `.cb-container`            | Root fixed bar (80px desktop, 64px mobile)                     |
| `.cb-collapse-btn`         | Arrow-down button to collapse expanded mobile view             |
| `.cb-left`                 | Left zone wrapper                                              |
| `.cb-thumbnail`            | Album artwork (56px square)                                    |
| `.cb-video-slot`           | Expanded mobile: 16:9 anchor the YouTube iframe sits over      |
| `.cb-video-poster`         | HD thumbnail shown in the slot until the video fades in        |
| `.cb-view-switch`          | Expanded mobile: Song / Video switcher (top center)            |
| `.cb-view-switch-btn`      | Switcher option (`.active` + `aria-pressed`)                   |
| `.cb-track-info`           | Title + artist column                                          |
| `.cb-track-title`          | Track title text                                               |
| `.cb-track-artist`         | Artist name text                                               |
| `.cb-btn-icon`             | Base icon button (40px circle)                                 |
| `.cb-btn-play`             | Play/pause button (44px, cyan background)                      |
| `.cb-center`               | Center zone wrapper (max-width 650px)                          |
| `.cb-controls`             | Transport button group                                         |
| `.cb-secondary-actions`    | Fullscreen, repeat, shuffle group                              |
| `.cb-seek`                 | Seek row: current time + slider + total time                   |
| `.cb-seek-track`           | Seek slider container                                          |
| `.cb-slider-bar`           | Shared track background (seek & volume)                        |
| `.cb-slider-range`         | Invisible native `<input type="range">` overlay                |
| `.cb-progress-buffered`    | Buffered progress bar (seek)                                   |
| `.cb-progress-current`     | Current position bar (seek)                                    |
| `.cb-time-current`         | Current time label                                             |
| `.cb-time-total`           | Duration label                                                 |
| `.cb-right`                | Right zone wrapper                                             |
| `.cb-volume`               | Volume icon + slider group                                     |
| `.cb-volume-track`         | Volume slider container                                        |
| `.cb-volume-level`         | Volume fill bar                                                |
| `.cb-mobile-title`         | Compact mobile title button (tap to expand)                    |
| `.cb-mobile-track-title`   | Mobile title text                                              |
| `.cb-mobile-track-artist`  | Mobile artist text                                             |
| `.desktop-only`            | Helper class hidden on mobile                                  |
| `.btn-fullscreen`          | Desktop fullscreen button (hidden on mobile)                   |
| `.cb-video-fullscreen-btn` | Mobile fullscreen button: expanded header row, Video mode only |
| `.btn-lyrics`              | Lyrics button hook (hidden on mobile)                          |
| `.btn-like`                | Like button modifier (`.active` → cyan)                        |

### Design Tokens

Defined in `src/styling/_custom.scss`:

| Token                         | Default                        | Purpose               |
| ----------------------------- | ------------------------------ | --------------------- |
| `--control-bar-height`        | `80px`                         | Desktop bar height    |
| `--control-bar-height-mobile` | `64px`                         | Mobile compact height |
| `--control-bar-bg`            | `#2c2c2c`                      | Surface color         |
| `--control-bar-text`          | `rgba(255,255,255,0.92)`       | Primary text          |
| `--control-bar-text-muted`    | `rgba(255,255,255,0.65)`       | Secondary text        |
| `--control-bar-border`        | `rgba(255,255,255,0.08)`       | Border color          |
| `--control-bar-shadow`        | `0 -4px 16px rgba(0,0,0,0.15)` | Top shadow            |

### Responsive Behavior

| Viewport           | Behavior                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| > 750px            | Full 3-zone layout with all controls                                                                                                                |
| ≤ 750px (compact)  | Title + play only, 64px height, 6px seek track                                                                                                      |
| ≤ 750px (expanded) | Full-screen overlay, 70vw artwork or live 16:9 video (Song / Video switcher), all controls visible except the desktop fullscreen and lyrics buttons |

### Expanded video

The expanded mobile view has a **Song / Video** switcher (`.cb-view-switch`, shown when a
track is loaded). The choice is the local `isVideoMode` signal: Song (the artwork) by default,
reset to Song by `collapsePlayer()` every time the panel closes. In Video mode the template
renders `.cb-video-slot` instead of the artwork.

The YouTube iframe can't be moved into the control bar (re-parenting an iframe reloads it),
so it stays in `#container-player`. While `.cb-video-slot` is rendered, global CSS
(`styles.scss`) pins it over the slot with CSS anchor positioning (`anchor-name: --cb-video`).
Where anchor positioning is unsupported (e.g. iOS < 26), `@supports not (anchor-name: --a)`
hides the switcher: the feature is simply absent, so the slot and the global rule never apply.

In Video mode a fullscreen button (`.cb-video-fullscreen-btn`) sits at the top right of the
header row, facing the collapse button. It is the mobile counterpart of the desktop
`.btn-fullscreen` (hidden on mobile): same `goFullscreen('player')`, real Fullscreen API. Two
buttons because they live in different layouts; moving one with CSS would fight the
`fade-in-up` transform of `.cb-center`. Orientation is left to
the user (no orientation lock). The button is hidden when `document.fullscreenEnabled` is
false (iPhone Safari).

### Dark Mode

The container overrides `--control-bar-bg` to `#1a1a1a` when `body[data-bs-theme='dark']` is set.

## Component API

### Injected Stores

| Store         | Usage                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `AuthStore`   | `isAuthenticated()` — show/hide like button                                                                                |
| `PlayerStore` | `isPlaying()`, `isRepeat()`, `progress()`, `volume()`, `currentTimeFormatted()`, `durationFormatted()`, `loadedProgress()` |
| `QueueStore`  | `currentKey()`, `currentVideo()`, `hasPrevious()`, `hasNext()`, `isShuffled()`                                             |

### Injected Services

| Service              | Usage                                                                |
| -------------------- | -------------------------------------------------------------------- |
| `PlayerService`      | Transport (play/pause, before, after, repeat, shuffle, seek, volume) |
| `UserLibraryService` | `isLiked()`, `addLike()`, `removeLike()`                             |

### Local Signals

| Signal             | Type                      | Purpose                                              |
| ------------------ | ------------------------- | ---------------------------------------------------- |
| `isPlayerExpanded` | `WritableSignal<boolean>` | Mobile expanded state                                |
| `isDraggingPlayer` | `WritableSignal<boolean>` | True while user drags seek slider                    |
| `dragProgress`     | `WritableSignal<number>`  | Visual progress during drag (0–100)                  |
| `displayProgress`  | `Signal<number>`          | Computed: drag value when dragging, else store value |

### Methods

| Method                                | Description                                    |
| ------------------------------------- | ---------------------------------------------- |
| `onPlayPause()`                       | Toggle play/pause                              |
| `onBefore()` / `onAfter()`            | Previous/next track                            |
| `repeat()` / `random()`               | Toggle repeat/shuffle                          |
| `goFullscreen(id)`                    | Request fullscreen on element by ID (SSR-safe) |
| `onPlayerSliderInput(e)`              | Real-time seek feedback during drag            |
| `onPlayerSliderChange(e)`             | Commit seek position on release                |
| `onVolumeInput(e)`                    | Update volume in real-time                     |
| `expandPlayer()` / `collapsePlayer()` | Toggle mobile expanded view                    |

## Testing

14 unit tests covering all public methods. Tests use `NO_ERRORS_SCHEMA` and mock `PlayerService` + `UserLibraryService`.

Run: `npx vitest run src/app/control-bar/control-bar.component.spec.ts`
