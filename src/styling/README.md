# Styling Directory

## Structure

```
styling/
├── styles.scss        # Global styles
├── _custom.scss       # Bootstrap variable overrides
└── _utilities.scss    # Reusable utility classes
```

## ⚠️ Important Rules

### Global styles.scss

**Use ONLY for:**

- External elements (YouTube iframe - see #player styles)
- Bootstrap framework overrides
- True global utilities that apply everywhere

**DO NOT add:**

- Component-specific styles
- Feature-specific layouts
- Anything that can be scoped to a component

### When to Modify

**Before adding anything to `styles.scss`, ask:**

1. Is this an external element without Angular encapsulation? → ✅ Add here
2. Is this a Bootstrap override that affects the whole app? → ✅ Add here
3. Is this component-specific? → ❌ Add to component SCSS
4. Is this feature-specific? → ❌ Add to feature component SCSS

### Critical Warning

**The #player styles MUST stay in this global file.**

```scss
// ⚠️ DO NOT MOVE TO COMPONENT CSS
#player {
  position: absolute;
  // ... these styles target YouTube's external iframe
}
```

Moving these to `player.component.scss` will break the YouTube player.

See `/docs/CSS_ARCHITECTURE.md` for full explanation.

## File Organization

- `styles.scss`: Global-only styles (compact)
- `_custom.scss`: Bootstrap variable overrides
- `_utilities.scss`: Reusable utility classes

**Keep `styles.scss` focused.** If it grows significantly, investigate moving styles to components.

## Maintenance

Last refactored: January 2026

- Significantly reduced global CSS by moving styles to components
- Extracted utilities to separate file
- Moved component-specific styles to respective files
- Fixed critical YouTube API mobile bug

Review quarterly to ensure no bloat.
