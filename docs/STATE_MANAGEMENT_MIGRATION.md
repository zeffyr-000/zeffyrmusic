# State Management Migration - NgRx Signal Store

## Context

Migration of the ZeffyrMusic state management architecture:

- **From**: Services with BehaviorSubject/Subject (legacy pattern)
- **To**: NgRx Signal Store v21 (modern Angular pattern)

## Goals

1. ✅ Centralize application state in dedicated stores
2. ⏳ Improve reactivity with native Angular Signals
3. ⏳ Prepare for Zoneless mode
4. ⏳ Facilitate debugging with built-in logging
5. ⏳ Improve testability

## Target Architecture

```
src/app/store/
├── index.ts                    # Barrel exports
├── auth/                       # Authentication & session
│   ├── auth.store.ts
│   ├── auth.models.ts
│   └── auth.store.spec.ts
├── user-data/                  # User data
│   ├── user-data.store.ts
│   ├── user-data.models.ts
│   └── user-data.store.spec.ts
├── player/                     # Playback state
│   ├── player.store.ts
│   ├── player.models.ts
│   └── player.store.spec.ts
├── queue/                      # Queue
│   ├── queue.store.ts
│   ├── queue.models.ts
│   └── queue.store.spec.ts
├── ui/                         # UI state
│   ├── ui.store.ts
│   └── ui.models.ts
└── features/                   # Reusable features
    ├── with-ssr-safety.ts
    ├── with-local-storage.ts
    └── with-logger.ts
```

## Migration Phases

### Phase 1: Infrastructure ✅ (Completed)

**Date**: January 7, 2026

**Completed Actions**:

- [x] Install `@ngrx/signals@21.0.1`
- [x] Create `/store` folder structure
- [x] Create models for each store:
  - `auth.models.ts`: AuthState, UserInfo, UserPreferences
  - `user-data.models.ts`: UserDataState
  - `player.models.ts`: PlayerState, formatTime()
  - `queue.models.ts`: QueueState
  - `ui.models.ts`: UiState, ModalType, Notification
- [x] Create reusable features:
  - `with-ssr-safety.ts`: Helpers for SSR compatibility
  - `with-local-storage.ts`: Automatic localStorage persistence
  - `with-logger.ts`: Development logging
- [x] Create barrel export `index.ts`
- [x] Verify build and tests (369 tests passed)

**Files Created**:

- `/src/app/store/index.ts`
- `/src/app/store/auth/auth.models.ts`
- `/src/app/store/user-data/user-data.models.ts`
- `/src/app/store/player/player.models.ts`
- `/src/app/store/queue/queue.models.ts`
- `/src/app/store/ui/ui.models.ts`
- `/src/app/store/features/with-ssr-safety.ts`
- `/src/app/store/features/with-local-storage.ts`
- `/src/app/store/features/with-logger.ts`

---

### Phase 2: AuthStore ✅ (Completed)

**Date**: January 7, 2026

**Goal**: Migrate authentication and user preferences

**Completed Actions**:

- [x] Create `auth.store.ts` with:
  - State: `isAuthenticated`, `user`, `preferences`, `initialized`
  - Computed: `pseudo()`, `mail()`, `idPerso()`, `isDarkMode()`, `language()`
  - Actions: `login()`, `logout()`, `initializeAnonymous()`, `setDarkMode()`, `setLanguage()`, `updateUser()`, `updatePreferences()`
- [x] Create tests `auth.store.spec.ts` (26 tests)
- [x] Migrate `HeaderComponent`:
  - Inject `AuthStore`
  - Synchronize during `onLogIn()` and `onLogout()`
- [x] Migrate `SettingsComponent`:
  - Inject `AuthStore`
  - Use for `setDarkMode()`, `setLanguage()`, `logout()`
- [x] Update `InitService`:
  - Synchronize with `AuthStore` in `handlePingResponse()`
  - Synchronize in `loginSuccess()`, `logOut()`, `onMessageUnlog()`
- [x] Verify build and tests (395 tests passed)

**Files Created**:

- `/src/app/store/auth/auth.store.ts`
- `/src/app/store/auth/auth.store.spec.ts`

**Files Modified**:

- `/src/app/store/index.ts` (export AuthStore)
- `/src/app/header/header.component.ts`
- `/src/app/settings/settings.component.ts`
- `/src/app/services/init.service.ts`

**Note**: The progressive migration approach keeps `InitService` and `subjectConnectedChange`
for compatibility with other components. AuthStore is synchronized in parallel.
Once all components are migrated, InitService can be simplified or removed.

---

### Phase 3: UserDataStore ✅ (Completed)

**Date**: January 7, 2026

**Goal**: Migrate user data (playlists, follows, likes)

**Completed Actions**:

- [x] Create `user-data.store.ts` with:
  - State: `playlists`, `follows`, `likedVideos`, `initialVideos`, `initialTabIndex`, `loading`, `error`
  - Computed: `hasPlaylists()`, `hasFollows()`, `hasLikedVideos()`, `playlistCount()`, `followCount()`, `likedVideoCount()`, `publicPlaylists()`, `privatePlaylists()`
  - Actions: `initialize()`, `reset()`, `setPlaylists()`, `addPlaylist()`, `removePlaylist()`, `updatePlaylistTitle()`, `togglePlaylistVisibility()`, `setFollows()`, `addFollow()`, `removeFollow()`, `isFollowing()`, `setLikedVideos()`, `likeVideo()`, `unlikeVideo()`, `isLiked()`, `getLikedVideo()`
- [x] Create tests `user-data.store.spec.ts` (35 tests)
- [x] Synchronize `PlayerService` with `UserDataStore`:
  - Import and inject UserDataStore
  - Sync in constructor (subjectInitializePlaylist)
  - Sync in `onChangeListPlaylist()`, `onChangeListFollow()`, `onChangeListLikeVideo()`
- [x] Update components to use UserDataStore:
  - `MyPlaylistsComponent`: inject UserDataStore, initialize from store
  - `MySelectionComponent`: inject UserDataStore, initialize from store
  - `HeaderComponent`: inject UserDataStore, initialize playlists from store
  - `PlaylistComponent`: inject UserDataStore, use `isFollowing()` for initial state
- [x] Verify build and tests (430 tests passed)

**Files Created**:

- `/src/app/store/user-data/user-data.store.ts`
- `/src/app/store/user-data/user-data.store.spec.ts`

**Files Modified**:

- `/src/app/store/index.ts` (export UserDataStore)
- `/src/app/services/player.service.ts`
- `/src/app/my-playlists/my-playlists.component.ts`
- `/src/app/my-selection/my-selection.component.ts`
- `/src/app/header/header.component.ts`
- `/src/app/playlist/playlist.component.ts`

**Migrated Observables**:

- `PlayerService.subjectListPlaylist` → `userDataStore.playlists()`
- `PlayerService.subjectListFollow` → `userDataStore.follows()`
- `PlayerService.subjectListLikeVideo` → `userDataStore.likedVideos()`
- `InitService.subjectInitializePlaylist` → `userDataStore.initialize()`

---

### Phase 4: QueueStore + PlayerStore ✅ (Completed)

**Date**: January 7, 2026

**Goal**: Migrate player and queue state

**Completed Actions**:

- [x] Create `queue.store.ts` with:
  - State: `items`, `currentIndex`, `tabIndex`, `tabIndexOriginal`, `isShuffled`, `sourcePlaylistId`, `sourceTopChartsId`
  - Computed: `currentVideo()`, `currentKey()`, `hasItems()`, `itemCount()`, `hasPrevious()`, `hasNext()`, `currentPosition()`, `orderedItems()`
  - Actions: `setQueue()`, `addToQueue()`, `addAfterCurrent()`, `removeFromQueue()`, `goToIndex()`, `next()`, `previous()`, `toggleShuffle()`, `setShuffle()`, `clear()`, `setSource()`
- [x] Create `player.store.ts` with:
  - State: `status`, `currentTime`, `duration`, `loadedFraction`, `volume`, `isRepeat`, `isMuted`, `isPlayerReady`, `errorMessage`
  - Computed: `isPlaying()`, `isPaused()`, `isLoading()`, `hasError()`, `progress()`, `currentTimeFormatted()`, `durationFormatted()`, `remainingTime()`, `loadedProgress()`, `volumePercent()`, `isSilent()`
  - Actions: `setStatus()`, `play()`, `pause()`, `togglePlay()`, `setLoading()`, `setEnded()`, `setIdle()`, `updateProgress()`, `setDuration()`, `seekTo()`, `seekToPercent()`, `setVolume()`, `toggleMute()`, `setMuted()`, `toggleRepeat()`, `setRepeat()`, `setPlayerReady()`, `setError()`, `clearError()`, `reset()`, `fullReset()`
- [x] Create tests `queue.store.spec.ts` (28 tests)
- [x] Create tests `player.store.spec.ts` (46 tests)
- [x] Synchronize `PlayerService` with new stores:
  - Inject PlayerStore and QueueStore
  - Sync in `finvideo()` for play/pause/ended states
  - Sync in `onPlayPause()` for play/pause toggle
  - Sync in `updateVolume()` for volume changes
  - Sync in `switchRepeat()` for repeat toggle
  - Sync in `switchRandom()` for shuffle toggle
  - Sync in `playerRunning()` for progress updates
  - Sync in `addInCurrentList()`, `addVideoAfterCurrentInList()`, `runPlaylist()` for queue changes
- [x] Verify build and tests (504 tests passed)

**Files Created**:

- `/src/app/store/queue/queue.store.ts`
- `/src/app/store/queue/queue.store.spec.ts`
- `/src/app/store/player/player.store.ts`
- `/src/app/store/player/player.store.spec.ts`

**Files Modified**:

- `/src/app/store/index.ts` (export PlayerStore, QueueStore)
- `/src/app/services/player.service.ts`

**Migrated Observables**:

- `PlayerService.subjectCurrentPlaylistChange` → `queueStore.items()`
- `PlayerService.subjectCurrentKeyChange` → `queueStore.currentVideo()`
- `PlayerService.subjectIsPlayingChange` → `playerStore.isPlaying()`
- `PlayerService.subjectVolumeChange` → `playerStore.volume()`
- `PlayerService.subjectPlayerRunningChange` → `playerStore.progress()`
- `PlayerService.subjectRepeatChange` → `playerStore.isRepeat()`
- `PlayerService.subjectRandomChange` → `queueStore.isShuffled()`

---

### Phase 5: Cleanup and UiStore ✅ (Completed)

**Date**: January 7, 2026

**Goal**: Finalize migration and cleanup

**Completed Actions**:

- [x] Create `UiStore` for modals and notifications:
  - State: `isPlayerExpanded`, `isMobile`, `activeModal`, `addVideoData`, `editPlaylistId`, `notifications`
  - Computed: `hasActiveModal()`, `hasNotifications()`, `notificationCount()`, `latestNotification()`
  - Actions: `expandPlayer()`, `collapsePlayer()`, `togglePlayer()`, `setMobile()`, `openModal()`, `closeModal()`, `openLoginModal()`, `openRegisterModal()`, `openAddVideoModal()`, `openEditPlaylistModal()`, `showNotification()`, `dismissNotification()`, `clearNotifications()`, `showSuccess()`, `showError()`, `showInfo()`, `reset()`
- [x] Create tests `ui.store.spec.ts` (20 tests)
- [x] Verify build and tests (530 tests passed)

**Files Created**:

- `/src/app/store/ui/ui.store.ts`
- `/src/app/store/ui/ui.store.spec.ts`

**Files Modified**:

- `/src/app/store/index.ts` (export UiStore)

---

### Phase 6: Zoneless Migration ✅ (Completed)

**Date**: January 7, 2026

**Goal**: Switch to Zoneless mode for performance

**Completed Actions**:

- [x] Add `ChangeDetectionStrategy.OnPush` to all components (14 components)
- [x] Replace `provideZoneChangeDetection()` with `provideZonelessChangeDetection()`
- [x] Remove `zone.js` from polyfills
- [x] Regression testing (530 tests passed)

**Files Modified**:

- `/src/app/app.config.ts` (zoneless provider)
- `/src/polyfills.ts` (removed zone.js import)
- All component files (added OnPush):
  - `app.component.ts`
  - `header/header.component.ts`
  - `player/player.component.ts`
  - `current/current.component.ts`
  - `help/help.component.ts`
  - `help/help-page/help-page.component.ts`
  - `reset-password/reset-password.component.ts`
  - `search/search.component.ts`
  - `my-playlists/my-playlists.component.ts`
  - `artist/artist.component.ts`
  - `my-selection/my-selection.component.ts`
  - `playlist/playlist.component.ts`
  - `settings/settings.component.ts`
  - `home/home.component.ts`
  - `search-bar/search-bar.component.ts`
  - `playlist/artist-list/artist-list.component.ts`

---

## Dependencies

```json
{
  "@ngrx/signals": "^21.0.1"
}
```

## Useful Commands

```bash
# Build
npm run build

# Tests
npm test -- --run

# Lint
npm run lint
```

## Technical Notes

### Using Features

```typescript
import { signalStore, withState, withMethods, withComputed } from '@ngrx/signals';
import { withSsrSafety, withLocalStorage, withLogger } from '../features';

export const MyStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withSsrSafety(),
  withLocalStorage({ key: 'my-store', keys: ['prop1', 'prop2'] }),
  withLogger({ name: 'MyStore' }),
  withComputed((state) => ({ ... })),
  withMethods((store) => ({ ... }))
);
```

### Accessing Store in a Component

```typescript
@Component({
  // ...
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComponent {
  private store = inject(MyStore);

  // Read signals directly in template
  // {{ store.myProperty() }}
}
```
