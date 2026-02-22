---
applyTo: '**/*.html'
---

# Angular Template Instructions

## Modern Control Flow

```html
<!-- ✅ Use @if / @for / @switch -->
@if (isLoading()) {
<app-skeleton-card [count]="6" />
} @else if (error()) {
<div class="alert alert-danger">{{ error() }}</div>
} @else { @for (item of items(); track item.id) {
<app-item [item]="item" />
} @empty {
<div class="empty-state">
  <span class="material-icons empty-state-icon" aria-hidden="true">search_off</span>
  <p class="empty-state-text">{{ 'no_results' | transloco }}</p>
</div>
} }

<!-- ❌ Don't use *ngIf, *ngFor, *ngSwitch -->
```

## Signal Access

Always call signals as functions in templates:

```html
<!-- ✅ -->
<div>{{ userName() }}</div>
<button [disabled]="isLoading()">Submit</button>

<!-- ❌ -->
<div>{{ userName }}</div>
```

## Pipes

- Duration: `{{ video.duree | toMMSS }}`
- Translation: `{{ 'key' | transloco }}`
- Date: `{{ date | date:'short' }}`

## Skeleton Loaders

```html
@if (isLoading()) { <app-skeleton-card [count]="6" />
<!-- card grids -->
<app-skeleton-list [count]="8" />
<!-- track lists -->
<app-skeleton-artist [count]="6" />
<!-- artist profile -->
<app-skeleton-playlist [count]="8" />
<!-- playlist page -->
}
```

## Empty State

```html
<div class="empty-state">
  <span class="material-icons empty-state-icon" aria-hidden="true">icon_name</span>
  <p class="empty-state-text">{{ 'message_key' | transloco }}</p>
  <a class="btn btn-outline-primary mt-3" routerLink="/">{{ 'back_home' | transloco }}</a>
</div>
```

## ng-bootstrap Accessibility

**CRITICAL: ng-bootstrap handles keyboard/ARIA automatically.**

```html
<!-- ✅ ng-bootstrap handles it -->
<button ngbDropdownToggle>Menu</button>

<!-- ❌ Redundant — DO NOT add these on ng-bootstrap elements -->
<button ngbDropdownToggle tabindex="0" role="button" (keydown.enter)="..."></button>
```

Auto-handled: `ngbDropdownToggle`, `ngbTooltip`, `ngbPopover`, `ngbModal`, `ngbCollapse`

## NG0956: Never Use Inline Arrays as `@for` Source

**WHY:** `@for (x of [signal()])` creates a **new array on every change detection cycle**.
Angular sees a new reference → destroys and recreates the entire DOM → NG0956 warning
in the console and unnecessary performance cost.

```html
<!-- ❌ Triggers NG0956 — new array every cycle -->
@for (key of [currentKey()]; track key) { ... }

<!-- ✅ Use track $index when stable identity is not required -->
@for (key of currentKeyArr(); track $index) { ... }

<!-- ✅ Or use @let when you just need the value as a local variable -->
@let key = currentKey();
```

When the `@for` is used **intentionally** to trigger a CSS entry animation on value change
(e.g. `cb-left` in `ControlBarComponent`), use `track $index` AND drive the animation
via alternating class names instead — see `components.instructions.md` for the `_animTick` pattern.

**Key rule:** A signal-derived array MUST be stored in a `computed()` in the component,
never constructed inline in the template.

## Interactive Elements

Use native `<button>` for actions, not `<a>`:

```html
<!-- ✅ -->
<button type="button" class="btn btn-primary" (click)="doAction()">Action</button>

<!-- ❌ -->
<a role="button" tabindex="0" (click)="doAction()" (keydown.enter)="doAction()">Action</a>
```

## Required ARIA

| Element      | Required                       |
| ------------ | ------------------------------ |
| Close button | `aria-label="Close"`           |
| Spinner      | `role="status"`                |
| Alert        | `role="alert"`                 |
| Image        | `alt="description"`            |
| Navigation   | `aria-label="Navigation name"` |
| Icon         | `aria-hidden="true"`           |
| Nav links    | `ariaCurrentWhenActive="page"` |
