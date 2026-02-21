---
applyTo: '**/*.scss,**/*.css'
criticality: BREAKING
---

# CSS Critical Rules - DO NOT VIOLATE

> **AI Agent Priority:** Read this FIRST before any CSS modifications.
> Violations will break YouTube player functionality.

## Rule 1: YouTube Player MUST Use Global CSS

**WHY:** YouTube iframe lacks Angular encapsulation attributes (`_ngcontent-xxx`)

**CORRECT:**

```scss
// ✅ src/styling/styles.scss (GLOBAL)
#player {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
}
```

**WRONG:**

```scss
// ❌ src/app/player/player.component.scss (ENCAPSULATED)
#player {
  width: 100%;
  height: 100%; // Will NOT apply to external iframe
}
```

**VALIDATION:**

```typescript
// Test: Player iframe must have 100% dimensions
cy.get('#player iframe').should('have.css', 'width', '100%');
```

**FILES:**

- `styles.scss` → #player styles (REQUIRED)
- `player.component.scss` → #container-player, #queue-list only

---

## Rule 2: Mobile Player = 1px Height in Global CSS

**WHY:** YouTube API requires DOM attachment. Hidden via height, not display:none.

**CORRECT:**

```scss
// ✅ styles.scss (GLOBAL)
@media screen and (max-width: 640px) {
  #player {
    height: 1px;
  } // MUST be global
}

// ✅ player.component.scss (COMPONENT)
@media screen and (max-width: 640px) {
  #container-player {
    padding-bottom: 0; // Remove 16:9 aspect ratio
    height: 1px;
  }
  #player-sidebar {
    height: 1px;
  }
}
```

**WRONG:**

```scss
// ❌ player.component.scss - Will cause "not attached to DOM" error
@media screen and (max-width: 640px) {
  #player {
    height: 1px;
  } // Encapsulation blocks this
}
```

**ERROR IF VIOLATED:**

```
www-widgetapi.js:194 The YouTube player is not attached to the DOM.
API calls should be made after the onReady event.
```

**VALIDATION:**

```typescript
// Test: Mobile player must be 1px high
cy.viewport(375, 667);
cy.get('#player').should('have.css', 'height', '1px');
```

---

## Rule 3: Aspect Ratio Must Be Removed on Mobile

**WHY:** Desktop uses padding-bottom: 56.25% for 16:9. Mobile must override.

**CORRECT:**

```scss
// Desktop
#container-player {
  position: relative;
  padding-bottom: 56.25%; // 16:9 = 9/16 = 56.25%
  height: 0;
}

// Mobile override
@media screen and (max-width: 640px) {
  #container-player {
    padding-bottom: 0; // ⚠️ CRITICAL
  }
}
```

**WRONG:**

```scss
// ❌ Forgetting to override padding-bottom
@media screen and (max-width: 640px) {
  #container-player {
    height: 1px; // Not enough - padding-bottom still creates height
  }
}
```

---

## Quick Decision Tree

```
Need to style an element?
│
├─ Created by Angular component?
│  └─ YES → Use component.scss
│
├─ Created by external library (YouTube, Google)?
│  └─ YES → Use styles.scss (global)
│
└─ Bootstrap/framework override?
   └─ YES → Use _custom.scss or styles.scss
```

---

## File Structure Reference

```
src/styling/
├── styles.scss          # Global only: #player, Bootstrap overrides
├── _custom.scss         # Bootstrap variable overrides
└── _utilities.scss      # Reusable utilities (cards, loading, etc.)

src/app/
├── app.component.scss        # Main layout (#main, #container, #player-sidebar)
├── player/player.component.scss   # Queue list, container (NOT #player)
├── header/header.component.scss   # Header, controls bar
└── [feature]/[feature].component.scss
```

---

## Validation Commands

```bash
# Build must succeed
npm run build

# Lint must pass
npm run lint

# Desktop player test
# Open http://localhost:4200, play track, verify 16:9 aspect ratio

# Mobile player test
# Resize to <640px, verify player hidden but controls work
```

---

## Common Mistakes (Learn from History)

### Mistake 1: Moving #player to Component CSS

**Symptom:** Player content appears zoomed/incorrect dimensions  
**Fix:** Move #player styles back to styles.scss

### Mistake 2: Mobile #player in Component CSS

**Symptom:** "The YouTube player is not attached to the DOM"  
**Fix:** Move mobile #player { height: 1px; } to styles.scss

### Mistake 3: Forgetting padding-bottom Override

**Symptom:** Mobile player still visible (>1px height)  
**Fix:** Add #container-player { padding-bottom: 0; } on mobile

---

## Emergency Recovery

If you broke the player:

1. **Check `styles.scss`** - Must contain #player styles
2. **Check mobile media query** - #player { height: 1px; } in global CSS?
3. **Check padding-bottom** - Set to 0 on mobile in player.component.scss?
4. **Git diff** - Compare with last working version

**Working reference commit:** January 20, 2026 refactoring

---

## Quality Standards

- Keep global CSS minimal (external elements and Bootstrap overrides only)
- Component styles must be scoped to their components
- Use English kebab-case for all IDs
- Maintain fast build times

---

## Related Documentation

- Full architecture: `/docs/CSS_ARCHITECTURE.md`
- Agent guidelines: `/AGENTS.md`
- Component patterns: `/.github/copilot-instructions.md`
