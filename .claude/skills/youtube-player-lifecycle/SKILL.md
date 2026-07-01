---
name: youtube-player-lifecycle
description: 'Debug and develop the YouTube IFrame Player integration. Use when working on playback, player CSS, control bar, volume, seek, mobile player, iframe lifecycle, onStateChange, video loading, or player errors.'
---

# YouTube Player Lifecycle

## Architecture

```
User action → PlayerService (orchestrator)
  → YoutubePlayerService (IFrame API wrapper)
    → YT.Player instance (external iframe)
      → onStateChange / onReady / onError callbacks
        → PlayerStore (reactive state via signals)
          → Components react (ControlBarComponent, PlayerComponent)
```

### Key Files

| File                                           | Role                                                         |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `src/app/services/youtube-player.service.ts`   | IFrame API wrapper (init, load, controls, progress tracking) |
| `src/app/services/player.service.ts`           | Orchestrator (queue navigation, title, playlist management)  |
| `src/app/store/player/player.store.ts`         | Reactive state (status, progress, volume, mute, repeat)      |
| `src/app/store/queue/queue.store.ts`           | Queue state (items, currentIndex, shuffle, tabIndex)         |
| `src/app/player/player.component.ts`           | Player + queue list UI                                       |
| `src/app/control-bar/control-bar.component.ts` | Transport controls, seek slider, volume, mobile expand       |
| `src/styling/styles.scss`                      | **GLOBAL** player CSS (CRITICAL — see CSS Rules below)       |

## Player States (YT.PlayerState)

| State     | Value | Store / service handling                                                                    | Behavior                                 |
| --------- | ----- | ------------------------------------------------------------------------------------------- | ---------------------------------------- |
| UNSTARTED | -1    | `YoutubePlayerService.onStateChange()` → `playerStore.setIdle()` + `stopProgressTracking()` | Initial or reset state                   |
| ENDED     | 0     | `YoutubePlayerService.onStateChange()` → `playerStore.setEnded()` → `PlayerService.after()` | Marks track ended and advances the queue |
| PLAYING   | 1     | `YoutubePlayerService.onStateChange()` → `playerStore.play()` + `startProgressTracking()`   | Active playback; 200ms progress updates  |
| PAUSED    | 2     | `YoutubePlayerService.onStateChange()` → `playerStore.pause()` + `stopProgressTracking()`   | User or API pause                        |
| BUFFERING | 3     | `YoutubePlayerService.onStateChange()` → `playerStore.setLoading()`                         | Network buffering/loading                |
| CUED      | 5     | `YoutubePlayerService.onStateChange()` (no-op for store; player stays idle until PLAYING)   | Video loaded but not started             |

> **Note:** Raw `YT.PlayerState` events are handled in `YoutubePlayerService.onStateChange()`, which updates `PlayerStore` and starts/stops progress tracking via `startProgressTracking()` / `stopProgressTracking()`. `PlayerService` is only involved indirectly (e.g. ENDED → `PlayerService.after()` to advance the queue) and does not control progress tracking.

## Initialization Flow

1. `PlayerService` constructor calls `youtubePlayer.initPlayer('player')` (browser only)
2. `YoutubePlayerService.loadApi()` injects `<script src="//www.youtube.com/iframe_api">`
3. Uses `requestIdleCallback` (fallback: `setTimeout`) for deferred loading
4. `window.onYouTubeIframeAPIReady` → `createPlayer(elementId)`
5. `YT.Player` created with `{ playerVars: { controls: 0, origin: window.location.href, rel: 0 } }`
6. `onReady` → `playerReady$.next(true)` → `playerStore.setPlayerReady(true)` → cues pending video if any (no autoplay)
7. `PlayerService` effect watches `queueStore.items()` + `currentKey()` → `cueVideo()` on first init

## Pending Video Pattern

If `loadVideo()` or `cueVideo()` is called before the player is ready:

- Video key is stored in `pendingVideoKey`
- On `onReady`, the pending video is automatically cued

## Progress Tracking

- 200ms `setInterval` while PLAYING state
- Calls `player.getCurrentTime()`, `getDuration()`, `getVideoLoadedFraction()`
- Updates `PlayerStore.updateProgress(currentTime, duration, loadedFraction)`
- Stopped on PAUSED, ENDED, UNSTARTED, or ERROR

## Error Handling

| YouTube Error Code | Translation Key               | Meaning                   |
| ------------------ | ----------------------------- | ------------------------- |
| 2                  | `error_invalid_parameter`     | Invalid video ID          |
| 5                  | `error_html_player`           | HTML5 player error        |
| 100                | `error_request_not_found`     | Video not found / removed |
| 101 / 150          | `error_request_access_denied` | Embedding restricted      |

Errors → `playerStore.setError(message)` → displayed in control bar.

## Volume Management

- Stored in `localStorage('volume')` — range 0–100
- Initialized on player ready: reads localStorage, fallback to `player.getVolume()`
- `PlayerService.updateVolume()` → `YoutubePlayerService.setVolume()` + `PlayerStore.setVolume()`
- Mute/unmute toggles: `player.mute()` / `player.unMute()` + store sync

## Queue Navigation

- `PlayerService.lecture(indice, indexInitial)` — plays track at index
- `before()` / `after()` — navigate with bounds checking
- On ENDED: auto-call `after()`, wraps around if `isRepeat()` is true
- Shuffle: `QueueStore.tabIndex` maps logical order → actual item positions

## CSS Critical Rules (BREAKING)

> **Read the `css-critical-rules` skill for full details.**

1. **`#player` styles MUST be in `styles.scss` (global)** — YouTube iframe lacks Angular encapsulation attributes
2. **Mobile `#player { height: 1px }` MUST be global** — avoids "not attached to DOM" error
3. **Mobile `#container-player { padding-bottom: 0 }` in component CSS** — removes 16:9 ratio

```scss
// ✅ styles.scss (GLOBAL) — required for iframe
#player {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
@media screen and (max-width: 767.98px) {
  #player {
    height: 1px;
  }
}

// ✅ player.component.scss (COMPONENT) — container only
@media screen and (max-width: 767.98px) {
  #container-player {
    padding-bottom: 0;
    height: 1px;
  }
}
```

## Mobile Player Expand/Collapse

- `ControlBarComponent.expandPlayer()` → `isPlayerExpanded.set(true)` + `body.classList.add('cb-player-expanded')`
- `collapsePlayer()` → reverse + `SwipeDownDirective` for swipe gesture
- `DestroyRef.onDestroy` cleans up body class

## Common Issues

| Symptom                         | Cause                                  | Fix                               |
| ------------------------------- | -------------------------------------- | --------------------------------- |
| Player not visible              | `#player` CSS in component file        | Move to `styles.scss`             |
| "Not attached to DOM" on mobile | `display: none` on player              | Use `height: 1px` instead         |
| No state updates                | Missing subscription to `stateChange$` | Check `PlayerService` constructor |
| Volume resets                   | localStorage not initialized           | Check `initVolume()` flow         |
| Track doesn't auto-advance      | `after()` not called on ENDED          | Verify `handleStateChange` switch |
| Animation restart fails         | Same track key, no DOM recreation      | Uses `_animTick` signal pattern   |

## Debugging Checklist

1. Verify `#player` element exists in DOM (`document.getElementById('player')`)
2. Check `playerReady$.value` — is the API loaded?
3. Inspect `playerStore.status()` signal value
4. Check browser console for YouTube API errors
5. Verify CSS: `#player` styles in global stylesheet
6. Mobile: check `height: 1px` is in global CSS, not component CSS
