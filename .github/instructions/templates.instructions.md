---
applyTo: '**/*.html'
---

# Angular Template Instructions

## Modern Control Flow Syntax

Use Angular's built-in control flow, not structural directives:

```html
<!-- ✅ Use @if -->
@if (isLoading()) {
<app-spinner />
} @else if (error()) {
<div class="alert alert-danger">{{ error() }}</div>
} @else {
<div>Content</div>
}

<!-- ❌ Don't use *ngIf -->
<div *ngIf="isLoading">Loading...</div>

<!-- ✅ Use @for with track -->
@for (item of items(); track item.id) {
<app-item [item]="item" />
} @empty {
<p>No items found</p>
}

<!-- ❌ Don't use *ngFor -->
<div *ngFor="let item of items">{{ item.name }}</div>

<!-- ✅ Use @switch -->
@switch (status()) { @case ('loading') { <app-spinner /> } @case ('error') { <app-error /> }
@default { <app-content /> } }
```

## Signal Access in Templates

Always call signals as functions:

```html
<!-- ✅ Correct -->
<div>{{ userName() }}</div>
<button [disabled]="isLoading()">Submit</button>

<!-- ❌ Incorrect -->
<div>{{ userName }}</div>
```

## Pipes for Display

- Duration: `{{ video.duree | toMMSS }}`
- Date: `{{ date | date:'short' }}`
- Translation: `{{ 'key' | transloco }}`

## Template Best Practices

- Keep templates clean - move complex logic to computed signals
- Use semantic HTML elements
- Add accessibility attributes (aria-\*, role)
- Use Bootstrap 5 classes for styling

## ng-bootstrap Accessibility

**CRITICAL: ng-bootstrap directives handle keyboard accessibility automatically.**

```html
<!-- ❌ INCORRECT: Redundant attributes -->
<button
  ngbDropdownToggle
  tabindex="0"
  role="button"
  (keydown.enter)="handleEnter()"
  (keydown.space)="handleSpace()"
>
  <!-- ✅ CORRECT: ng-bootstrap handles it -->
  <button ngbDropdownToggle>Menu</button>
</button>
```

Directives that auto-handle accessibility:

- `ngbDropdownToggle`
- `ngbTooltip`
- `ngbPopover`
- `ngbModal`
- `ngbCollapse`

## Interactive Elements

Use native interactive elements for actions:

```html
<!-- ✅ CORRECT: Native button -->
<button type="button" class="btn btn-primary" (click)="doAction()">Action</button>

<!-- ❌ INCORRECT: Link used as button -->
<a
  class="btn btn-primary"
  role="button"
  tabindex="0"
  (click)="doAction()"
  (keydown.enter)="doAction()"
  (keydown.space)="doAction(); $event.preventDefault()"
>
  Action
</a>
```

## Required ARIA Attributes

| Element         | Required                       |
| --------------- | ------------------------------ |
| Close button    | `aria-label="Close"`           |
| Loading spinner | `role="status"`                |
| Alert messages  | `role="alert"`                 |
| Images          | `alt="description"`            |
| Navigation      | `aria-label="Navigation name"` |
