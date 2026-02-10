# CSS Architecture - Quick Reference

> **AI Agent Priority:** Read `.github/instructions/css-critical-rules.md` first.
> This file contains additional context and historical decisions.

## File Structure

```
src/styling/
├── styles.scss      # Global: #player, Bootstrap overrides
├── _custom.scss     # Bootstrap variables (BEFORE Bootstrap import)
└── _utilities.scss  # Reusable utilities (~984 lines, 9 sections)

src/app/
├── app.component.scss        # Main layout
├── player/player.component.scss   # Queue, container (NOT #player)
└── [feature]/[feature].component.scss
```

### `_utilities.scss` Section Inventory

| Section                | Purpose                                                                          |
| ---------------------- | -------------------------------------------------------------------------------- |
| **PAGE LAYOUT**        | `.page-container`, `.page-header` — shared page structure                        |
| **TRACKS LIST**        | Spotify-style grid layout for track rows                                         |
| **EMPTY STATE**        | Placeholder UI when no data                                                      |
| **ORIGINAL UTILITIES** | Legacy helper classes                                                            |
| **CARDS**              | Modern card components with hover effects                                        |
| **BUTTONS**            | `.btn-icon` with `:hover`/`:focus-visible` styles                                |
| **DROPDOWNS**          | Unified dropdown styling — animation, item padding, danger variant, active route |
| **MODALS**             | `.modal-alert` system (base + 4 color variants: danger, success, warning, info)  |

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

| File                       | Responsibility                                                           |
| -------------------------- | ------------------------------------------------------------------------ |
| `styles.scss`              | Global: #player, Bootstrap overrides                                     |
| `_custom.scss`             | Bootstrap variable overrides, dropdown border CSS var                    |
| `_utilities.scss`          | Shared utilities: page layout, tracks, dropdowns, modals, cards, buttons |
| `app.component.scss`       | Main layout (#main, #container)                                          |
| `player.component.scss`    | Queue list, container (NOT #player)                                      |
| `[feature].component.scss` | Feature-specific only (extend shared classes)                            |

## Related Documentation

- **⚠️ CRITICAL:** `.github/instructions/css-critical-rules.md`
- **Changelog:** `docs/CSS_REFACTORING_CHANGELOG.md`
- **Agent guidelines:** `AGENTS.md`

---

## Dropdown Architecture Decisions

### Animation: Opacity-Only

Dropdown reveal uses `opacity` transition only (no `transform: scale` or `translateY`). **Reason:** Popper.js applies its own `transform` for positioning — combining with CSS transforms causes visual conflicts.

### Item Padding: Negative Margin Technique

Padding is on child `> a, > button` elements inside `<li ngbDropdownItem>`, not on the `<li>` itself. Child elements use `margin: -0.5rem -1rem` + `width: calc(100% + 2rem)` to extend the clickable area to the full dropdown width.

### Danger Variant

`.dropdown-item-danger` is applied to the `<li ngbDropdownItem>` parent, with `> a, > button { color: inherit; }` to propagate the red color to nested interactive elements.

### Active Route Highlight

`routerLinkActive="active"` is placed on `<li ngbDropdownItem>`, not on the inner `<a>`. The `.dropdown-item.active` class provides a subtle background highlight.

## Modal Alert System

`.modal-alert` is the base class providing flex layout, `border-left: 4px solid`, box-shadow, slideIn animation, and icon sizing. Four color variants extend it:

| Variant                | Background Gradient | Border/Icon Color | Text Color |
| ---------------------- | ------------------- | ----------------- | ---------- |
| `.modal-alert-danger`  | danger 0.12→0.06    | danger            | danger     |
| `.modal-alert-success` | success 0.12→0.06   | success           | success    |
| `.modal-alert-warning` | warning 0.12→0.06   | warning           | warning    |
| `.modal-alert-info`    | primary 0.08→0.02   | primary           | body-color |

These classes can be used outside modals (e.g., `.modal-alert.modal-alert-info` on reset-password page as an info banner).

---

Last reviewed: February 10, 2026
