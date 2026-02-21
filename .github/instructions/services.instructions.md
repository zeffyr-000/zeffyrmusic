---
applyTo: 'src/app/services/**/*.ts'
---

# Angular Service Instructions

## Structure

```typescript
@Injectable({ providedIn: 'root' })
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
- Use `inject()` function, never constructor injection
- Always map API responses from snake_case to camelCase

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

## Available Services (13 total)

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
| `AuthGuard`                | Route guard                  |
