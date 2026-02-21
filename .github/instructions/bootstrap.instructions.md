---
applyTo: '**/*.html,**/*.scss,**/*.css'
---

# Bootstrap & ng-bootstrap Instructions

## Stack

- Bootstrap **5.3.8** (CSS framework)
- ng-bootstrap **20** (Angular directives)
- Custom variables in `src/styling/_custom.scss` (BEFORE Bootstrap import)

## Prefer Utilities Over Custom CSS

```html
<!-- ✅ Bootstrap classes -->
<div class="d-flex justify-content-between align-items-center p-3 mb-2">
  <span class="text-primary fw-bold">Title</span>
  <button class="btn btn-outline-secondary btn-sm">Action</button>
</div>

<!-- ❌ Custom CSS for basic layout -->
<div class="custom-flex-container">...</div>
```

## CSS Variables for Dark Mode

```scss
// ✅ Auto-adapts to data-bs-theme
color: var(--bs-body-color);
background: var(--bs-body-bg);
border-color: var(--bs-border-color);

// ❌ Hardcoded
color: #333;
background: white;
```

## ng-bootstrap Accessibility (CRITICAL)

ng-bootstrap handles keyboard/ARIA automatically. DO NOT add redundant attributes:

```html
<!-- ✅ -->
<button ngbDropdownToggle>Menu</button>

<!-- ❌ -->
<button ngbDropdownToggle tabindex="0" (keydown.enter)="..." role="button"></button>
```

## Dropdown Conventions

- `d-inline-flex` on `ngbDropdown` container
- `routerLinkActive="active"` on `<li ngbDropdownItem>` (not inner `<a>`)
- `.dropdown-item-danger` on `<li>`, children inherit color
- Caret globally hidden, animation is opacity-only (no transform — Popper.js conflict)

## Modal Alert System

```html
<div class="modal-alert modal-alert-info">
  <span class="material-icons" aria-hidden="true">info</span>
  <span>Message text</span>
</div>
```

Variants: `-danger`, `-success`, `-warning`, `-info`. Usable outside modals.

## Responsive (Mobile-First)

```scss
.element {
  flex-direction: column; // mobile default
  @include media-breakpoint-up(md) {
    // tablet+
    flex-direction: row;
  }
}
```

| Breakpoint | Min-width | Infix  |
| ---------- | --------- | ------ |
| X-Small    | <576px    | (none) |
| Small      | ≥576px    | `-sm`  |
| Medium     | ≥768px    | `-md`  |
| Large      | ≥992px    | `-lg`  |
| X-Large    | ≥1200px   | `-xl`  |
| XX-Large   | ≥1400px   | `-xxl` |

## Anti-Patterns

- No `!important` except extreme cases
- No inline styles
- No max 3 levels SCSS nesting
- No `tabindex`/`keydown` on ng-bootstrap elements
- No hardcoded color values — use CSS variables or SCSS variables

## Disabled Button Pitfall

`<button disabled>` with `ngbTooltip` needs wrapping:

```html
<span ngbTooltip="Reason">
  <button class="btn" [disabled]="true">Action</button>
</span>
```
