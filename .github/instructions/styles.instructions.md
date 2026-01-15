---
applyTo: '**/*.scss,**/*.css'
---

# SCSS/CSS Instructions

## Framework

- Bootstrap 5.3.x with ng-bootstrap 20.x.x
- Custom variables in `src/styling/_custom.scss` (BEFORE Bootstrap import)
- Global styles in `src/styling/styles.scss`
- Component styles in `*.component.scss` files

## File Structure

```
src/styling/
├── _custom.scss           # Bootstrap variable overrides (import FIRST)
├── _material-icons-optimized.scss
└── styles.scss            # Main entry point
```

## Variable Customization

Always override Bootstrap variables in `_custom.scss` BEFORE importing Bootstrap:

```scss
// ✅ CORRECT: Override before import
// _custom.scss
$primary: #1ac8e5;
$border-radius: 0.5rem;

// styles.scss
@import 'custom'; // Variables first
@import 'bootstrap/scss/bootstrap'; // Then Bootstrap
```

## Best Practices

```scss
// ✅ Use Bootstrap utilities in templates instead of custom CSS
// <div class="d-flex justify-content-between align-items-center">

// ✅ Use component-scoped styles
:host {
  display: block;
}

// ✅ Use CSS variables for theming (auto dark mode support)
.custom-element {
  color: var(--bs-body-color);
  background: var(--bs-body-bg);
  border-color: var(--bs-border-color);
}

// ✅ Use Bootstrap color functions
.custom-badge {
  background-color: tint-color($primary, 20%);
  color: color-contrast($primary);
}

// ❌ Avoid !important
.element {
  color: red !important; // Don't do this
}

// ❌ Avoid hardcoded colors
.element {
  color: #333; // Use var(--bs-body-color) instead
}

// ❌ Avoid deep nesting (max 3 levels)
.parent {
  .child {
    .grandchild {
      .great-grandchild {
        // Too deep
      }
    }
  }
}
```

## Dark Mode Support

```scss
// Default (light mode) styles
.custom-element {
  background: $white;
}

// Dark mode override
body[data-bs-theme='dark'] {
  .custom-element {
    background: $dark;
  }
}

// Or use CSS variables that auto-switch
.custom-element {
  background: var(--bs-body-bg); // Automatic!
}
```

## Naming Convention

- Use BEM-like naming for custom classes: `block__element--modifier`
- Prefix custom utilities with project name if needed: `zf-custom-class`

## Responsive Design

Use Bootstrap breakpoints (mobile-first approach):

```scss
.element {
  // Mobile first (default)
  flex-direction: column;
  padding: 1rem;

  // Tablet and up
  @include media-breakpoint-up(md) {
    flex-direction: row;
    padding: 2rem;
  }

  // Desktop and up
  @include media-breakpoint-up(lg) {
    padding: 3rem;
  }
}
```

## Bootstrap Breakpoints Reference

| Breakpoint | Min-width | Class infix |
| ---------- | --------- | ----------- |
| X-Small    | <576px    | (none)      |
| Small      | ≥576px    | `-sm`       |
| Medium     | ≥768px    | `-md`       |
| Large      | ≥992px    | `-lg`       |
| X-Large    | ≥1200px   | `-xl`       |
| XX-Large   | ≥1400px   | `-xxl`      |

## Performance

- Keep component styles under 6KB (warning) / 10KB (error)
- Avoid complex selectors (max specificity: 3 classes)
- Use CSS containment where appropriate
- Prefer utility classes over custom CSS
