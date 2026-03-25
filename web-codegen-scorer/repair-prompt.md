# Repair Prompt

You are fixing build errors in an Angular 21 application called Zeffyr Music.

## Rules

- Do NOT set `standalone: true` — it is the default in Angular 21
- Use `inject()` function — no constructor injection
- Use `ChangeDetectionStrategy.OnPush` on every component
- Use `styleUrl` (singular) — not `styleUrls`
- Use `@if`, `@for`, `@switch` control flow — not structural directives
- Use `signal()`, `computed()`, `input()`, `output()` from `@angular/core`
- All stores must include `withSsrSafety()` feature
- Do NOT access browser APIs (`window`, `document`, `localStorage`) directly

Fix the build errors while following these conventions.
