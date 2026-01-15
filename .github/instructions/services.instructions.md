---
applyTo: 'src/app/services/**/*.ts'
---

# Angular Service Instructions

## Service Structure

```typescript
@Injectable({
  providedIn: 'root',
})
export class MyService {
  // Injected dependencies
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  // Methods for business logic and HTTP calls
  getData(): Observable<Data> {
    return this.http.get<DataResponse>('/api/data').pipe(
      map(response => this.mapResponseToData(response)),
      catchError(this.handleError)
    );
  }

  private mapResponseToData(response: DataResponse): Data {
    // Map snake_case API response to camelCase frontend model
    return {
      id: response.id_data,
      name: response.nom_data,
    };
  }
}
```

## Critical Rules

- Services handle HTTP calls and business logic
- Services do NOT hold application state - use Signal Stores instead
- Use `inject()` function, never constructor injection
- Always map API responses from snake_case to camelCase

## API Data Mapping

Backend uses PHP with snake_case, frontend uses camelCase:

```typescript
// API response (snake_case from PHP backend)
interface PingResponse {
  est_connecte: boolean;
  dark_mode_enabled: boolean;
  id_perso: string;
}

// Frontend model (camelCase)
interface UserInfo {
  isAuthenticated: boolean;
  darkModeEnabled: boolean;
  idPerso: string;
}
```

## RxJS Best Practices

```typescript
// ✅ Use operators instead of nested subscriptions
this.getData().pipe(
  switchMap(data => this.processData(data)),
  catchError(error => {
    console.error(error);
    return EMPTY;
  }),
).subscribe();

// ❌ Avoid nested subscriptions
this.getData().subscribe(data => {
  this.processData(data).subscribe(result => { ... });
});
```

## Error Handling

Use consistent error handling patterns:

```typescript
private handleError = (error: HttpErrorResponse): Observable<never> => {
  console.error('API Error:', error);
  return throwError(() => new Error(error.message));
};
```
