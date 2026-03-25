Create an @ngrx/signals Signal Store called `FavoritesStore` for managing a user's favorite artists.

Requirements:

- State: `artists` (array of `{ id: string; name: string; imageUrl: string }`), `loading` (boolean), `error` (string | null)
- Computed signals: `artistCount`, `hasArtists`, `sortedArtists` (alphabetically by name)
- Methods: `setArtists(artists)`, `addArtist(artist)`, `removeArtist(id)`, `setLoading()`, `setError(message)`, `reset()`
- Must use `withSsrSafety()` feature for SSR compatibility
- Must be `providedIn: 'root'`
- Use `patchState()` for all state mutations
- Define the state interface and initial state as separate exports
- Follow the project convention: stores hold state, services do HTTP calls
