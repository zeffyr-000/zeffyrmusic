# CSS Architecture - Quick Reference

> **AI Agent Priority:** Read `.github/instructions/css-critical-rules.md` first.
> This file contains additional context and historical decisions.

## File Structure

```
src/styling/
├── styles.scss      # Global: #player, Bootstrap overrides
├── _custom.scss     # Bootstrap variables
└── _utilities.scss  # Reusable utilities

src/app/
├── app.component.scss        # Main layout
├── player/player.component.scss   # Queue, container (NOT #player)
└── [feature]/[feature].component.scss
```

## Critical Rules Summary

**See `.github/instructions/css-critical-rules.md` for complete rules.**

1. **YouTube #player** → MUST be in `styles.scss` (global)
2. **Mobile #player** → `height: 1px` MUST be in `styles.scss`
3. **Aspect ratio** → `padding-bottom: 0` on mobile in component CSS

## Angular View Encapsulation

Angular adds `_ngcontent-xxx` attributes to scoped elements.

**External elements (YouTube iframe) don't get these attributes.**

```html
<!-- Angular component element -->
<div _ngcontent-abc-xyz>Styled by component CSS</div>

<!-- YouTube iframe (external) -->
<iframe src="youtube.com">NO encapsulation attributes</iframe>
```

**Solution:** External elements need global CSS.

**Why:** YouTube API creates the iframe dynamically without Angular's encapsulation attributes.

**Never move these styles to `player.component.scss`** - It will break the player sizing.

#### Rule 2: Mobile Player Height

**Problem:** YouTube iframe API requires the player to be attached to DOM with valid dimensions.

**Solution:** On mobile, visually hide but keep valid dimensions:

```scss
// Global styles.scss
@media screen and (max-width: 640px) {
  #player {
    height: 1px; // Visually hidden but still in DOM
  }
}

// player.component.scss
@media screen and (max-width: 640px) {
  #container-player {
    z-index: -1;
    padding-bottom: 0; // Remove aspect ratio
  }

  #player-sidebar,
  #container-player {
    height: 1px;
  }
}
```

**Critical:** All three elements (#player-sidebar, #container-player, #player) must be 1px on mobile.

#### Rule 3: Container Aspect Ratio

Desktop uses padding-bottom hack for 16:9 aspect ratio:

```scss
#container-player {
  position: relative;
  padding-bottom: 56.25%; // 16:9 = 9/16 = 56.25%
  height: 0;
}
```

**Must override on mobile:**

```scss
@media screen and (max-width: 640px) {
  #container-player {
    padding-bottom: 0; // ⚠️ CRITICAL - Remove aspect ratio
  }
}
```

---

## Mobile Responsive Rules

### Breakpoint Strategy

**Use Bootstrap breakpoints:**

```scss
// ✅ CORRECT
@media screen and (max-width: 640px) {
}
@media screen and (max-width: 899px) {
}

// ❌ WRONG (deprecated)
@media screen and (max-device-width: 640px), screen and (max-width: 640px) {
}
```

### Mobile Layout Structure

```
Desktop (>640px):          Mobile (≤640px):
┌─────────────────┐       ┌─────────────────┐
│ Header (fixed)  │       │ Header (static) │
├────┬────────────┤       ├─────────────────┤
│Play│  Content   │       │   Content       │
│er  │            │       │   (full width)  │
│    │            │       │                 │
│1px │  Scrolls   │       │   Scrolls       │
└────┴────────────┘       └─────────────────┘
│ Fixed player   │       │ Fixed player    │
│ controls bar   │       │ controls bar    │
└────────────────┘       └─────────────────┘
```

**Key Mobile Changes:**

- `#player-sidebar` → `height: 1px` (hidden)
- `#content` → `width: 100%` (full width)
- `#queue-content` → `display: none` (hidden)
- `#main` → `height: auto` (allow scroll)

---

## Naming Conventions

### ID Naming (established post-refactoring)

**Format:** `kebab-case` (lowercase with hyphens)

**Examples:**

```scss
// ✅ CORRECT
#player-sidebar
#queue-list
#queue-content
#player-info-left
#player-info-center
#playlist-header
#playlist-image

// ❌ WRONG (old French names - deprecated)
#gauche
#liste_en_cours
#header_player_gauche
#playlist_haut
```

### Component Structure

```scss
// Component SCSS file structure
// =============================================================================
// [COMPONENT NAME] - Brief description
// =============================================================================

// Main component wrapper
#component-wrapper {
  // ...
}

// Sub-elements
#component-element {
  // ...
}

// Responsive (always at bottom)
@media screen and (max-width: 640px) {
  // Mobile overrides
}
```

---

## Common Pitfalls (Quick Reference)

**See `.github/instructions/css-critical-rules.md` for complete list.**

1. Moving #player to component CSS → Breaks sizing
2. Mobile #player in component CSS → "Not attached to DOM" error
3. Forgetting padding-bottom: 0 on mobile → Player still visible
4. Using deprecated max-device-width → Use max-width only

## Testing Checklist

- [ ] Desktop: Player 16:9 aspect ratio, queue visible
- [ ] Mobile: Player hidden (1px), controls work, no console errors
- [ ] `npm run build` - Success
- [ ] `npm run lint` - Pass

## File Responsibility Matrix

| File                       | Responsibility                       |
| -------------------------- | ------------------------------------ |
| `styles.scss`              | Global: #player, Bootstrap overrides |
| `_utilities.scss`          | Reusable classes (cards, loading)    |
| `app.component.scss`       | Main layout (#main, #container)      |
| `player.component.scss`    | Queue list, container (NOT #player)  |
| `[feature].component.scss` | Feature-specific only                |

## Related Documentation

- **⚠️ CRITICAL:** `.github/instructions/css-critical-rules.md`
- **Changelog:** `docs/CSS_REFACTORING_CHANGELOG.md`
- **Agent guidelines:** `AGENTS.md`

---

Last reviewed: January 20, 2026
