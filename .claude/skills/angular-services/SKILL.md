---
name: angular-services
description: Angular service conventions for Zeffyr Music — HTTP calls and business logic only (no state holding), inject() over constructor injection, snake_case→camelCase API mapping, and RxJS best practices. Use when creating or editing files under src/app/services.
---

# Angular Service Instructions

## Structure

```typescript
@Service()
export class MyService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  getData(): Observable<Data> {
    return this.http.get<DataResponse>('/api/data').pipe(
      map(response => this.mapResponse(response)),
      catchError(this.handleError)
    );
  }

  private mapResponse(response: DataResponse): Data {
    return { id: response.id_data, name: response.nom_data };
  }
}
```

## Critical Rules

- Services handle HTTP calls and business logic only
- Services do NOT hold application state — use Signal Stores instead
- Use `@Service()` from `@angular/core`, never `@Injectable({ providedIn: 'root' })`
- Use `inject()` function, never constructor injection
- Always map API responses from snake_case to camelCase

## `@Service()` vs `@Injectable()`

`@Service()` (Angular 22+) is the replacement for `@Injectable({ providedIn: 'root' })` —
the service is registered in the root injector automatically, so `providedIn` is gone.

Only reach for the options object when the service must **not** be auto-provided
(it is then up to you to list it in a `providers` array):

```typescript
@Service({ autoProvided: false })
export class ManuallyProvidedService {}
```

`@Injectable()` is not deprecated, but the whole codebase is on `@Service()` — keep it that way.

## API Data Mapping

Backend (PHP/Jelix) uses snake_case, frontend uses camelCase:

```typescript
// API response
interface PingResponse {
  est_connecte: boolean;
  id_perso: string;
}
// Frontend model
interface UserInfo {
  isAuthenticated: boolean;
  idPerso: string;
}
```

## RxJS Best Practices

```typescript
// ✅ Use operators
this.getData().pipe(
  switchMap(data => this.processData(data)),
  catchError(error => { console.error(error); return EMPTY; }),
).subscribe();

// ❌ No nested subscriptions
this.getData().subscribe(data => {
  this.processData(data).subscribe(result => { ... });
});
```

## Available Services (14 total)

| Service                    | Purpose                      |
| -------------------------- | ---------------------------- |
| `InitService`              | App bootstrap, session, ping |
| `PlayerService`            | Playback orchestration       |
| `YoutubePlayerService`     | YouTube IFrame API wrapper   |
| `UserService`              | User HTTP operations         |
| `UserLibraryService`       | Library HTTP operations      |
| `PlaylistService`          | Playlist HTTP operations     |
| `ArtistService`            | Artist HTTP operations       |
| `SearchService`            | Search HTTP operations       |
| `SeoService`               | Canonical URL management     |
| `FocusService`             | Focus management             |
| `KeyboardShortcutService`  | Keyboard shortcuts           |
| `PlaylistThumbnailService` | Thumbnail generation         |
| `LoggingService`           | Error reporting (Sentry)     |
| `AuthGuard`                | Route guard                  |
