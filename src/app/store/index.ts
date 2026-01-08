/**
 * Store Barrel Export
 *
 * Single entry point for all stores and features.
 * Import: import { AuthStore, PlayerStore, ... } from './store';
 */

// ============================================================================
// Models
// ============================================================================

export * from './auth/auth.models';
export * from './user-data/user-data.models';
export * from './player/player.models';
export * from './queue/queue.models';
export * from './ui/ui.models';

// ============================================================================
// Reusable features
// ============================================================================

export { withSsrSafety } from './features/with-ssr-safety';
export { withLocalStorage, type LocalStorageConfig } from './features/with-local-storage';

// ============================================================================
// Stores
// ============================================================================

export { AuthStore, type AuthStoreType } from './auth/auth.store';
export { UserDataStore } from './user-data/user-data.store';
export { PlayerStore } from './player/player.store';
export { QueueStore } from './queue/queue.store';
export { UiStore } from './ui/ui.store';
