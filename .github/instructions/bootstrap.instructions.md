---
applyTo: '**/*.html,**/*.scss,**/*.css'
---

# Bootstrap & ng-bootstrap Instructions

## Framework Versions

- Bootstrap: 5.3.x
- ng-bootstrap: 20.x.x
- Popper.js: 2.11.x

## Critical Rules

### 1. Prefer Bootstrap Utilities

Always prefer Bootstrap utility classes over custom CSS:

```html
<!-- ✅ CORRECT: Bootstrap utilities -->
<div class="d-flex justify-content-between align-items-center p-3 mb-2">
  <span class="text-primary fw-bold">Title</span>
</div>

<!-- ❌ INCORRECT: Custom CSS for basic layout -->
<div class="custom-flex-container">...</div>
```

### 2. Use CSS Variables for Theming

```scss
// ✅ CORRECT: Adapts to color mode automatically
.custom-element {
  color: var(--bs-body-color);
  background: var(--bs-body-bg);
  border-color: var(--bs-border-color);
}

// ❌ INCORRECT: Hardcoded values
.custom-element {
  color: #333;
  background-color: white;
}
```

### 3. ng-bootstrap Accessibility

**CRITICAL: Do NOT add redundant accessibility attributes to ng-bootstrap components.**

```html
<!-- ❌ INCORRECT: Redundant attributes -->
<button
  ngbDropdownToggle
  tabindex="0"
  role="button"
  (keydown.enter)="handleEnter()"
  (keydown.space)="handleSpace()"
>
  <!-- ✅ CORRECT: ng-bootstrap handles keyboard/aria -->
  <button ngbDropdownToggle></button>
</button>
```

Directives that handle accessibility automatically:

- `ngbDropdownToggle`
- `ngbTooltip`
- `ngbPopover`
- `ngbModal`
- `ngbCollapse`

### 4. Component Imports

Import ng-bootstrap components individually for tree-shaking:

```typescript
// ✅ CORRECT: Individual imports
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownItem
} from '@ng-bootstrap/ng-bootstrap';

@Component({
  imports: [NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem],
})
```

### 5. Responsive Design

Use Bootstrap breakpoint utilities:

```html
<!-- Visible only on desktop -->
<div class="d-none d-lg-block">Desktop only</div>

<!-- Responsive columns -->
<div class="col-12 col-md-6 col-lg-4">...</div>
```

### 6. Color Mode (Dark Mode)

Use `data-bs-theme` attribute and CSS variables:

```scss
// Default styles
.navbar-inverse {
  background-color: $white;
}

// Dark mode override
body[data-bs-theme='dark'] {
  .navbar-inverse {
    background-color: $black;
  }
}
```

### 7. Button Variants

| Variant         | Usage               |
| --------------- | ------------------- |
| `btn-primary`   | Primary action      |
| `btn-secondary` | Secondary action    |
| `btn-outline-*` | Less emphasis       |
| `btn-link`      | Link style          |
| `btn-danger`    | Destructive actions |

### 8. Required ARIA Attributes

| Element         | Required Attribute   |
| --------------- | -------------------- |
| Close button    | `aria-label="Close"` |
| Loading spinner | `role="status"`      |
| Alert messages  | `role="alert"`       |
| Images          | `alt="Description"`  |

## Common Utilities Reference

### Spacing

- Margin: `m{t,b,s,e,x,y}-{0-5}` (e.g., `mt-3`, `mx-auto`)
- Padding: `p{t,b,s,e,x,y}-{0-5}` (e.g., `p-4`, `py-2`)

### Flexbox

- Display: `d-flex`, `d-inline-flex`
- Direction: `flex-row`, `flex-column`
- Justify: `justify-content-{start,center,end,between,around}`
- Align: `align-items-{start,center,end}`
- Gap: `gap-{0-5}`

### Text

- Color: `text-{primary,secondary,success,danger,warning,muted,body}`
- Alignment: `text-{start,center,end}`
- Weight: `fw-{light,normal,bold}`
- Decoration: `text-decoration-none`

### Display

- Responsive: `d-{none,block,flex,inline}-{sm,md,lg,xl}`
- Example: `d-none d-md-block` (hidden on mobile, visible on tablet+)

## Anti-Patterns

1. **No `!important`** unless absolutely necessary
2. **No inline styles** (`style="..."`)
3. **No deep SCSS nesting** (max 3 levels)
4. **No hardcoded colors** (use variables or CSS custom properties)
5. **No custom classes for basic layout** (use Bootstrap utilities)
6. **No manual keyboard handling on ng-bootstrap components**

## Known Bootstrap Pitfalls

### Disabled Buttons and `cursor: not-allowed`

Bootstrap sets `pointer-events: none` on `:disabled` buttons. This prevents **any** cursor style
from being applied, making `cursor: not-allowed` invisible to the user.

**Fix:** Override `pointer-events` to `auto`. The native HTML `disabled` attribute still prevents
click events from firing, so this is safe.

```scss
// ✅ CORRECT: cursor is visible
.btn:disabled {
  pointer-events: auto;
  cursor: not-allowed;
}

// ❌ INCORRECT: cursor will NOT appear (Bootstrap overrides with pointer-events: none)
.btn:disabled {
  cursor: not-allowed;
}
```

> **Note:** This override is already applied globally on `.btn-action:disabled` in `_utilities.scss`.
