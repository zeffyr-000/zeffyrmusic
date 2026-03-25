# Fix CSS Player

Fix YouTube player CSS issues following the CRITICAL rules from `.github/instructions/css-critical-rules.md`.

## CRITICAL RULES (BREAKING if violated)

### Rule 1: `#player` styles MUST be in `styles.scss` (global)

YouTube iframe has NO Angular view encapsulation. All `#player` styles must go in `src/styling/styles.scss`, never in component SCSS files.

### Rule 2: Mobile `#player { height: 1px }` MUST be global

```scss
// src/styling/styles.scss
@media (max-width: 767.98px) {
  #player {
    height: 1px;
    overflow: hidden;
  }
}
```

Without this, YouTube throws "not attached to DOM" error on mobile.

### Rule 3: Mobile `#container-player { padding-bottom: 0 }` in component CSS

The 16:9 aspect ratio must be removed on mobile. This override goes in the **component** CSS.

## Validation Commands

```bash
# Verify #player styles are ONLY in global stylesheet
grep -rn "#player" src/styling/styles.scss

# This should return NOTHING — #player must NOT be in component CSS
grep -rn "#player" src/app/ --include="*.scss"

# Check mobile override exists
grep -n "height: 1px" src/styling/styles.scss
```

## Quick Fix Checklist

1. Search for any `#player` in component SCSS files → move to `styles.scss`
2. Verify mobile `height: 1px` rule exists in global `styles.scss`
3. Verify `padding-bottom: 0` override in player component CSS
4. Run validation commands above
5. Test on mobile viewport (Chrome DevTools, 375px width)
