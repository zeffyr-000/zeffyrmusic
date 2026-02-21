---
applyTo: '**/*.scss,**/*.css'
---

# SCSS/CSS Instructions

## File Structure

```
src/styling/
├── _custom.scss           # Bootstrap variable overrides + CSS custom properties (BEFORE Bootstrap)
├── _utilities.scss        # Shared utilities (~1270 lines, 11 sections)
├── _material-icons-optimized.scss
└── styles.scss            # Entry: custom → bootstrap → utilities → global styles
```

Import order in `styles.scss` is critical:

1. `_custom.scss` (variables BEFORE Bootstrap to override `!default`)
2. `bootstrap/scss/bootstrap`
3. `ngx-sharebuttons/themes/default`
4. `_material-icons-optimized`
5. `_utilities`

## Best Practices

```scss
// ✅ Use Bootstrap CSS variables (auto dark mode)
.custom-element {
  color: var(--bs-body-color);
  background: var(--bs-body-bg);
  border-color: var(--bs-border-color);
}

// ✅ Component-scoped styles
:host {
  display: block;
}

// ✅ Mobile-first with Bootstrap breakpoints
.element {
  flex-direction: column;
  @include media-breakpoint-up(md) {
    flex-direction: row;
  }
}

// ✅ Hover guard for touch devices
@media (hover: hover) {
  .card:hover {
    transform: translateY(-4px);
  }
}

// ❌ No hardcoded colors → use var(--bs-body-color) or $primary
// ❌ No !important
// ❌ Max 3 levels SCSS nesting
// ❌ No styles for #player in component CSS (see css-critical-rules.md)
```

## Design System (in `_custom.scss` `:root`)

| Category    | Examples                                            |
| ----------- | --------------------------------------------------- |
| Spacing     | `--spacing-xs` (0.25rem) → `--spacing-2xl` (3rem)   |
| Shadows     | `--shadow-sm/md/lg/xl`, `--shadow-card/-card-hover` |
| Transitions | `--transition-fast/base/slow` (150/200/300ms)       |
| Radii       | `--radius-sm/md/lg/xl/full`                         |
| Typography  | `--text-xs` → `--text-3xl`                          |
| Z-index     | `--z-dropdown` → `--z-tooltip`                      |
| Player      | `--control-bar-height`, `--control-bar-bg`, etc.    |

## `_utilities.scss` Sections

| Section           | Purpose                                        |
| ----------------- | ---------------------------------------------- |
| Custom Scrollbars | Thin themed scrollbars                         |
| Touch Targets     | WCAG 2.5.8 minimum size                        |
| Page Layout       | `.page-container`, `.page-header`              |
| Tracks List       | Spotify-style track grid                       |
| CDK Drag-and-Drop | Drag handle styles                             |
| Shared Keyframes  | `fade-in-up`, `slideIn`, `dropdownReveal`      |
| Skeleton Loaders  | `.skeleton-pulse`, `.skeleton-line--*`         |
| Empty State       | `.empty-state`, `.empty-state-icon/text`       |
| Original Utils    | Legacy helpers                                 |
| Cards             | Modern hover cards with `@media (hover:hover)` |

## Dark Mode

```scss
// CSS variables adapt automatically
.element {
  color: var(--bs-body-color);
} // auto light/dark

// Explicit override if needed
body[data-bs-theme='dark'] {
  .element {
    background: $black;
  }
}
```

## Performance

- Component style budget: warning 12kb, error 16kb
- Prefer Bootstrap utility classes over custom CSS
- Use CSS containment where appropriate
