Create an Angular service called `NotificationService` that manages push notifications.

Requirements:

- Use `inject()` function for all dependencies (no constructor injection)
- The service must be `providedIn: 'root'`
- It should inject a `UiStore` (Signal Store) and `HttpClient`
- Method `fetchNotifications()`: GET request to `environment.URL_SERVER + 'notifications'`, returns `Observable<Notification[]>`
- Method `markAsRead(id: string)`: POST request to `environment.URL_SERVER + 'notifications/read'` with body `{ id }`
- Method `showToast(message: string, type: 'success' | 'error' | 'info')`: calls `uiStore.showNotification()` with proper parameters
- The service must NOT hold any state (state goes in stores)
- Must be SSR-safe: use `isPlatformBrowser()` guard for any browser-only code
- Use proper TypeScript typing (no `any`)
- Define a `Notification` interface with: `id`, `message`, `type`, `read`, `created_at`
