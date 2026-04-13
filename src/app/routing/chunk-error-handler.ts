const CHUNK_ERROR_PATTERN =
  /dynamically imported module|Loading chunk|Importing a module script failed/;

const STORAGE_KEY = 'chunk-retry';

/** @visibleForTesting */
export const navigation = {
  reload: (): void => location.reload(),
};

/** Clears the chunk-retry flag after a successful app bootstrap. */
export function clearChunkRetryFlag(): void {
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage access failures in restricted environments
    }
  }
}

/**
 * Handles stale chunk errors after deployments by reloading once.
 * Uses a sessionStorage flag to prevent infinite reload loops.
 */
export function handleChunkLoadError(error: unknown): void {
  if (typeof sessionStorage === 'undefined' || !CHUNK_ERROR_PATTERN.test(String(error))) {
    return;
  }

  try {
    if (sessionStorage.getItem(STORAGE_KEY)) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, '1');
      navigation.reload();
    }
  } catch {
    // Storage blocked — skip reload to avoid infinite loop
  }
}
