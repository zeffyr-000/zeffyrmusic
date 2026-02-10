# CSS Refactoring Changelog

## February 10, 2026 - UI Modernization & Shared Patterns

### Objective

Unify dropdown styling, centralize modal alert system, modernize page layouts, and factorize repeated CSS patterns into shared utility classes.

### Key Changes

#### Dropdown Centralization

- **Unified dropdown styling** in `_utilities.scss` DROPDOWNS section
- Animation: opacity-only `dropdownReveal` keyframe (no transform — avoids Popper.js conflict)
- Hidden caret (`.dropdown-toggle::after { display: none }`)
- Item padding via negative margin technique on child `> a, > button` elements
- `.dropdown-item-danger` variant on `<li ngbDropdownItem>` with color inheritance
- `.dropdown-item.active` route highlight via `routerLinkActive` on `<li>` (not inner `<a>`)
- `dropdownReveal` animation applied to `.dropdown-menu.show`

#### Modal Alert System (`.modal-alert`)

- Base class: flex layout, `border-left: 4px solid`, `box-shadow`, `slideIn` animation
- 4 color variants: `.modal-alert-danger`, `.modal-alert-success`, `.modal-alert-warning`, `.modal-alert-info`
- `.modal-alert-info` reusable outside modals (e.g., reset-password info banner)

#### Page Layout

- `.page-container` / `.page-header` extracted to `_utilities.scss`
- `.page-header` spacing tightened: `margin-bottom: --spacing-lg`, `padding-bottom: --spacing-md`

#### Button Styles

- `.btn-icon` with `:hover` and `:focus-visible` (box-shadow ring) in `_utilities.scss`

#### ResetPasswordComponent Modernization

- Full HTML rewrite: `.page-container` + `.page-header`, form card (`.reset-section`), success card (`.reset-success`)
- Info banner uses `.modal-alert.modal-alert-info` (shared pattern — no duplicated styles)
- Component SCSS reduced: `.reset-hint` only has `max-width` and `margin-bottom` overrides
- TS: `inject()`, `readonly`, Title service, UiStore toasts, Signal Forms

#### i18n Fixes

- Fixed typo: `error_unkown` → `error_unknown` in both fr.json and en.json
- Added missing keys: `erreur`, `ajouter_apres_courant`, `email_send_error`
- Added reset-password keys: `reset_password_hint`, `reset_password_success_title`, `reset_password_back_home`

### Design Decisions

| Decision                                  | Rationale                                                   |
| ----------------------------------------- | ----------------------------------------------------------- |
| Opacity-only dropdown animation           | Popper.js owns `transform` for positioning                  |
| Negative margin on dropdown children      | Extends clickable area without breaking `<li>` padding      |
| `routerLinkActive` on `<li>` not `<a>`    | `ngbDropdownItem` is on the `<li>`, active class must match |
| `.modal-alert-info` reused as info banner | Avoids duplicating flex/bg/border/icon patterns             |
| No `:has()` selector                      | Browser compatibility (Safari < 15.4)                       |
| `aria-pressed` on toggle buttons          | Semantically correct for on/off states (vs `aria-label`)    |

### Files Modified

- `src/styling/_utilities.scss` — Dropdowns, modals, page layout, buttons sections
- `src/styling/_custom.scss` — `$dropdown-border-color: var(--bs-border-color)` for dark mode
- `src/app/header/header.component.html` — Dropdown `routerLinkActive` moved to `<li>`
- `src/app/my-playlists/` — HTML, SCSS, spec updated
- `src/app/my-selection/` — Spec updated (NgbModal mocks, UiStore stubs)
- `src/app/reset-password/` — Full rewrite (HTML, SCSS, TS, spec)
- `src/assets/i18n/fr.json` / `en.json` — Missing/broken keys fixed

### Testing

- ✅ 541 tests passing across 35 files
- ✅ `npm run build` — Success
- ✅ `npm run lint` — Pass

---

## January 20, 2026 - Major Architecture Refactoring

### Objective

Transform bloated global CSS into maintainable, component-scoped architecture.

### Metrics

- Significantly reduced global CSS by moving styles to components
- All French IDs renamed to English kebab-case
- Enhanced maintainability with clear separation of concerns

### Key Changes

**Files Created:**

- `.github/instructions/css-critical-rules.md` - AI-optimized critical rules
- `src/styling/_utilities.scss` - Reusable utilities
- `src/app/app.component.scss` - Main layout
- `src/app/search/search.component.scss`

**Files Modified:**

- `styles.scss`: Reduced to global-only styles
- `player.component.scss`: Enhanced with critical docs
- `header.component.scss`: ID renaming, media query cleanup
- All component HTML: French IDs → English kebab-case

### HTML Files Updated

- `player.component.html`
- `header.component.html`
- `playlist.component.html`
- `artist.component.html`

### TypeScript Files Updated

Component references to stylesheets:

- `app.component.ts`: `.css` → `.scss`
- `search.component.ts`: `.css` → `.scss`

### ID Naming Changes (French → English)

| Old (French)              | New (English)             | Location           |
| ------------------------- | ------------------------- | ------------------ |
| `#gauche`                 | `#player-sidebar`         | app.component      |
| `#liste_en_cours`         | `#queue-list`             | player.component   |
| `#liste_en_cours_content` | `#queue-content`          | player.component   |
| `#header_player_gauche`   | `#player-info-left`       | header.component   |
| `#header_player_centre`   | `#player-info-center`     | header.component   |
| `#header_player_droite`   | `#player-info-right`      | header.component   |
| `#chrono_en_cours`        | `#current-time`           | header.component   |
| `#playlist_haut`          | `#playlist-header`        | playlist.component |
| `#playlist_img_content`   | `#playlist-image-wrapper` | playlist.component |
| `#playlist_img_big`       | `#playlist-image`         | playlist.component |
| `#artist_haut`            | `#artist-header`          | artist.component   |
| `#artist_img_content`     | `#artist-image-wrapper`   | artist.component   |
| `#artist_img_big`         | `#artist-image`           | artist.component   |

### Critical Bug Fixes

#### 1. YouTube Player DOM Attachment (Mobile)

**Problem:**

```
The YouTube player is not attached to the DOM.
API calls should be made after the onReady event.
```

**Root Cause:**

- On mobile, `#player` was set to `height: 1px` in component CSS
- Due to Angular view encapsulation, styles didn't apply to external YouTube iframe
- YouTube API requires valid DOM dimensions

**Solution:**

```scss
// Global styles.scss (NOT component CSS)
@media screen and (max-width: 640px) {
  #player {
    height: 1px; // Must be in global CSS to target external iframe
  }
}
```

#### 2. YouTube Player Sizing (Desktop)

**Problem:** After moving `#player` styles to component CSS, player sizing broke.

**Root Cause:** YouTube iframe created without Angular encapsulation attributes.

**Solution:** Moved `#player` styles back to global `styles.scss` with extensive documentation.

#### 3. Mobile Player Visual Height

**Problem:** Player still visible on mobile despite `height: 1px`.

**Root Cause:** `padding-bottom: 56.25%` (aspect ratio) was still applied.

**Solution:**

```scss
@media screen and (max-width: 640px) {
  #container-player {
    padding-bottom: 0; // Critical: remove aspect ratio
  }
}
```

### Testing Performed

✅ **Desktop (>640px)**

- Player visible in left sidebar
- 16:9 aspect ratio maintained
- Queue list scrollable
- All IDs functional

✅ **Mobile (≤640px)**

- Player hidden (1px height)
- Content full width
- Player controls functional
- No YouTube API warnings in console

✅ **Build & Lint**

- `npm run build` - Success
- `npm run lint` - All files pass

✅ **Cross-Browser**

- Chrome, Firefox, Safari tested
- No layout shifts or overflow issues

### Breaking Changes

**None** - This was a refactoring that maintains 100% functionality.

### Migration Notes for Future Developers

If you're working on a different branch and need to merge this refactoring:

1. **CSS Conflicts:** Accept incoming changes for all `styles.scss` modifications
2. **ID Renaming:** Update any custom branches using old French IDs
3. **Component CSS:** Ensure component imports reference `.scss` not `.css`
4. **Mobile Player:** If you modified mobile player code, review `/docs/CSS_ARCHITECTURE.md`

### Lessons Learned

1. **View Encapsulation Matters:** External elements need global CSS
2. **Documentation is Critical:** Complex interactions need extensive docs
3. **Mobile Edge Cases:** Always test YouTube API on mobile devices
4. **Incremental Refactoring:** Break large refactors into verified steps
5. **Testing Checklist:** Maintain comprehensive testing checklist

### Future Improvements

- [ ] Consider migrating to CSS custom properties (CSS variables) for theming
- [ ] Evaluate CSS-in-JS solutions for dynamic theming
- [ ] Create visual regression testing for CSS changes
- [ ] Implement CSS linting rules for architecture enforcement
- [ ] Consider splitting `_utilities.scss` into smaller modules

### References

- Main Documentation: `/docs/CSS_ARCHITECTURE.md`
- Styling README: `/src/styling/README.md`
- Agent Guidelines: `/AGENTS.md` (updated with CSS rules)

### Contributors

- Initial Refactoring: January 20, 2026
- Documentation: January 20, 2026

### Sign-off

This refactoring has been tested and validated for:

- ✅ Functionality preservation
- ✅ Performance (significantly reduced global CSS)
- ✅ Maintainability (clear architecture)
- ✅ Professional standards (documentation, naming)

**Status:** Production-ready ✅
