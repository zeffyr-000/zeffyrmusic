Create an Angular settings page component that allows the user to change their display name, toggle dark mode, and select a language.

Requirements:

- Component name: `ProfileSettingsComponent`
- Inject `AuthStore` (Signal Store) to read current user state
- Inject `UserService` for HTTP calls to save changes
- Use Angular reactive forms with typed `FormGroup`
- Form fields: `displayName` (required, min 3 chars), `language` (select: 'fr' | 'en')
- Dark mode toggle that calls `authStore.toggleDarkMode()` on change
- Display validation errors using Transloco for i18n messages (arrow function pattern for deferred translation)
- Show a success toast notification via `UiStore.showNotification()` after saving
- Use OnPush change detection and `inject()` function
- Use `@if` control flow for conditional rendering
- Use Bootstrap classes for form layout
- Set SEO: title, meta description, and canonical URL using `Title`, `Meta`, and `SeoService.updateCanonicalUrl()`
