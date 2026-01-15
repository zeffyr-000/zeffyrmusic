# Create Service

Create a new Angular service following project conventions.

## Requirements

- Use `@Injectable({ providedIn: 'root' })`
- Use `inject()` for dependencies
- Handle HTTP with proper error handling
- Map API responses from snake_case to camelCase

## Template

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MyService {
  private readonly http = inject(HttpClient);

  getData(): Observable<MyData> {
    return this.http.get<ApiResponse>('/api/endpoint').pipe(
      map(response => this.mapResponse(response)),
      catchError(this.handleError)
    );
  }

  createItem(item: CreateItemRequest): Observable<Item> {
    return this.http.post<ApiItemResponse>('/api/items', item).pipe(
      map(response => this.mapItemResponse(response)),
      catchError(this.handleError)
    );
  }

  private mapResponse(response: ApiResponse): MyData {
    return {
      id: response.id_data,
      name: response.nom,
      createdAt: response.date_creation,
    };
  }

  private mapItemResponse(response: ApiItemResponse): Item {
    return {
      id: response.id_item,
      title: response.titre,
    };
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    console.error('API Error:', error);
    return throwError(() => new Error(error.message));
  };
}
```

## API Mapping Convention

Backend (PHP) uses snake_case, frontend uses camelCase:

| API (snake_case)    | Frontend (camelCase) |
| ------------------- | -------------------- |
| `id_perso`          | `idPerso`            |
| `est_connecte`      | `isConnected`        |
| `date_creation`     | `createdAt`          |
| `dark_mode_enabled` | `darkModeEnabled`    |
