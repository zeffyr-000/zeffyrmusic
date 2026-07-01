# Repair Prompt

You are fixing build errors in an Angular 22 application called Zeffyr Music.

## Rules

- Do NOT set `standalone: true` — it is the default in Angular 22
- Use `inject()` function — no constructor injection
- Do NOT set `changeDetection` — OnPush is the Angular 22 zoneless default (only set `ChangeDetectionStrategy.Eager` if eager checking is genuinely needed)
- Use `styleUrl` (singular) — not `styleUrls`
- Use `@if`, `@for`, `@switch` control flow — not structural directives
- Use `signal()`, `computed()`, `input()`, `output()` from `@angular/core`
- All stores must include `withSsrSafety()` feature
- Do NOT access browser APIs (`window`, `document`, `localStorage`) directly

Fix the build errors while following these conventions.
