---
applyTo: '**/*.scss,**/*.css'
---

# SCSS/CSS Instructions

## Framework

- Use Bootstrap 5 utility classes when possible
- Custom styles in component `.scss` files
- Global styles in `src/styling/`

## Best Practices

```scss
// ✅ Use Bootstrap utilities in templates instead of custom CSS
// <div class="d-flex justify-content-between align-items-center">

// ✅ Use component-scoped styles
:host {
  display: block;
}

// ✅ Use CSS variables for theming
.custom-element {
  color: var(--bs-body-color);
  background: var(--bs-body-bg);
}

// ❌ Avoid !important
.element {
  color: red !important; // Don't do this
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

## Naming Convention

- Use BEM-like naming for custom classes: `block__element--modifier`
- Prefix custom utilities with project name if needed

## Responsive Design

Use Bootstrap breakpoints:

```scss
// Mobile first approach
.element {
  padding: 1rem;

  @include media-breakpoint-up(md) {
    padding: 2rem;
  }

  @include media-breakpoint-up(lg) {
    padding: 3rem;
  }
}
```

## Performance

- Keep component styles under 6KB (warning) / 10KB (error)
- Avoid complex selectors
- Use CSS containment where appropriate
