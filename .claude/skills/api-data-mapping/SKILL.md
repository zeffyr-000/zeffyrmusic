---
name: api-data-mapping
description: 'Map PHP/Jelix backend API responses to Angular TypeScript models. Use when creating services, handling HTTP responses, adding new API endpoints, or working with snake_case to camelCase conversions.'
---

# API Data Mapping — Zeffyr Music

## Convention

The backend is PHP/Jelix and returns **snake_case** JSON. The Angular frontend uses a **mixed convention**: most model interfaces keep the original snake_case field names from the API, with some camelCase fields for frontend-only data.

> **Important:** Unlike typical Angular projects, Zeffyr models do NOT systematically rename fields. Most interfaces mirror the API response shape directly, using the French snake_case names.

## API Endpoints

All endpoints are relative to `environment.URL_SERVER` (proxied via `src/proxy.conf.json` in dev).

### Public (no auth required)

| Method | Endpoint              | Response Type         | Description                                |
| ------ | --------------------- | --------------------- | ------------------------------------------ |
| GET    | `ping`                | `PingResponse`        | Session check + user data if authenticated |
| GET    | `json/playlist/{id}`  | `Playlist`            | Full playlist with videos                  |
| GET    | `json/artist/{id}`    | `ArtistData`          | Artist profile + albums + related          |
| GET    | `fullsearch1/{query}` | `SearchResults1`      | Artists + playlists matching query         |
| GET    | `fullsearch2/{query}` | `SearchResults2`      | Video tracks matching query                |
| GET    | `fullsearch3/{query}` | `SearchResults3`      | Extra/related videos                       |
| GET    | `home_init`           | `{ top, top_albums }` | Home page data (SSR TransferState)         |
| GET    | `search_bar/{query}`  | `SearchBarResponse`   | Quick search suggestions                   |

### Authentication

| Method | Endpoint          | Request Body                  | Response Type      |
| ------ | ----------------- | ----------------------------- | ------------------ |
| POST   | `login`           | `{ pseudo, password, token }` | `LoginResponse`    |
| POST   | `inscription`     | `{ pseudo, mail, password }`  | `UserReponse`      |
| GET    | `deconnexion`     | —                             | `UserReponse`      |
| POST   | `pass`            | `{ mail }`                    | `UserReponse`      |
| POST   | `send_reset_pass` | `{ id_perso, key, password }` | `SendPassResponse` |

### User Settings (auth required)

| Method | Endpoint                           | Request Body                   | Response Type |
| ------ | ---------------------------------- | ------------------------------ | ------------- |
| POST   | `options/passe`                    | `{ passwordold, passwordnew }` | `UserReponse` |
| POST   | `options/mail`                     | `{ mail }`                     | `UserReponse` |
| POST   | `options/dark_mode`                | `{ dark_mode_enabled }`        | `UserReponse` |
| POST   | `options/language`                 | `{ language }`                 | `UserReponse` |
| POST   | `options/delete`                   | `{ password }`                 | `UserReponse` |
| POST   | `options/associate_google_account` | `{ id_token }`                 | `UserReponse` |

### Playlist Management (auth required)

| Method | Endpoint                                 | Request Body             | Response Type            |
| ------ | ---------------------------------------- | ------------------------ | ------------------------ |
| POST   | `playlist-creer`                         | `{ titre }`              | `CreatePlaylistResponse` |
| POST   | `edit_title`                             | `{ id_playlist, titre }` | `UserReponse`            |
| GET    | `playlist-supprimer/{id}`                | —                        | `{ success }`            |
| GET    | `switch_publique?id_playlist=X&statut=Y` | —                        | `{ success }`            |

### Library (auth required)

| Method | Endpoint            | Request Body | Response Type                  |
| ------ | ------------------- | ------------ | ------------------------------ |
| POST   | `add_like`          | `{ key }`    | `{ success, like: UserVideo }` |
| POST   | `remove_like`       | `{ key }`    | `{ success }`                  |
| GET    | `switch_suivi/{id}` | —            | `{ success, est_suivi }`       |

## Model Interfaces

### Video (`src/app/models/video.model.ts`)

```typescript
interface Video {
  id_video: string; // API: id_video
  artiste: string; // API: artiste (French)
  artists: Artist[]; // API: artists (parsed array)
  duree: string; // API: duree (duration in seconds, as string)
  id_playlist: string; // API: id_playlist
  id_artiste?: number; // API: id_artiste
  key: string; // API: key (YouTube video ID)
  ordre: string; // API: ordre (position in playlist)
  titre: string; // API: titre (French for "title")
  titre_album: string; // API: titre_album
}

interface UserVideo {
  id: string;
  key: string;
  titre: string;
  duree: string;
  artiste: string;
  artists: Artist[];
}

interface VideoItem {
  // Frontend-only (camelCase)
  key: string;
  artist: string;
  title: string;
  duration: number;
}
```

### Playlist (`src/app/models/playlist.model.ts`)

```typescript
interface Playlist {
  id_playlist: string;
  id_perso: string;
  title: string;
  description: string;
  est_suivi: boolean; // "is followed"
  img_big: string;
  og_image?: string;
  liste_video: string[]; // video key list
  str_index: number[]; // index mapping
  tab_video: Video[]; // full video objects
  est_prive?: boolean; // "is private"
  titre?: string;
  artiste?: string;
  id_artiste?: string;
  year?: number;
}

interface UserPlaylist {
  id_playlist: string;
  titre: string;
  prive: boolean;
}
```

### PingResponse (`src/app/services/init.service.ts`)

The main session endpoint. Returns all user data at once:

```typescript
interface PingResponse {
  est_connecte: boolean; // → AuthStore.isAuthenticated
  is_admin: boolean; // → AuthStore.user.isAdmin
  pseudo: string; // → AuthStore.user.pseudo
  id_perso: string; // → AuthStore.user.idPerso (⚠️ renamed to camelCase)
  mail: string; // → AuthStore.user.mail
  dark_mode_enabled: boolean; // → AuthStore.preferences.darkModeEnabled (⚠️ renamed)
  language: string; // → AuthStore.preferences.language
  liste_playlist: UserPlaylist[]; // → UserDataStore.playlists
  liste_suivi: FollowItem[]; // → UserDataStore.follows
  like_video: UserVideo[]; // → UserDataStore.likedVideos
  liste_video: Video[]; // → QueueStore (initial queue)
  tab_index: number[]; // → QueueStore (initial tab index)
  tab_video: string[]; // → QueueStore
}
```

### LoginResponse (`src/app/models/user.model.ts`)

Same shape as PingResponse for user fields, plus `success` and `error`.

### Field Naming Patterns

| API field (snake_case) | Store field (camelCase) | Where mapped                       |
| ---------------------- | ----------------------- | ---------------------------------- |
| `est_connecte`         | `isAuthenticated`       | `InitService.handlePingResponse()` |
| `id_perso`             | `idPerso`               | `InitService.handlePingResponse()` |
| `dark_mode_enabled`    | `darkModeEnabled`       | `InitService.handlePingResponse()` |
| `is_admin`             | `isAdmin`               | `InitService.handlePingResponse()` |
| `liste_playlist`       | `playlists`             | `UserDataStore.initialize()`       |
| `liste_suivi`          | `follows`               | `UserDataStore.initialize()`       |
| `like_video`           | `likedVideos`           | `UserDataStore.initialize()`       |
| `est_suivi`            | (kept as-is)            | Used directly in templates         |
| `est_prive`            | (kept as-is)            | Used directly in templates         |

> **Rule:** API→Store mapping happens in `InitService.handlePingResponse()` and `HeaderComponent.loginWithToken()` (via `AuthStore.login()`). Model interfaces use the raw API field names. Store state uses camelCase.

## TransferState Pattern

SSR-fetched data is transferred to the browser via Angular's `TransferState`:

```typescript
// In service (e.g. PlaylistService)
const key = makeStateKey<Playlist>(`playlist-${id}`);

// Server: fetch + store
return this.httpClient.get<Playlist>(url).pipe(
  tap(data => {
    if (!this.isBrowser) this.transferState.set(key, data);
  })
);

// Browser: read + remove
const storedValue = this.transferState.get(key, null);
if (storedValue && this.isBrowser) {
  this.transferState.remove(key);
  return of(storedValue);
}
```

## Adding a New Endpoint

1. Add the TypeScript interface in `src/app/models/`
2. Add the HTTP method in the appropriate service (`src/app/services/`)
3. If SSR-relevant, add `TransferState` caching (GET endpoints only)
4. Map snake_case → camelCase only when storing in Signal Stores
5. Keep the raw field names in model interfaces
