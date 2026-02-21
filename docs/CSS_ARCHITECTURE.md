# CSS Architecture

> **CRITICAL**: Read `.github/instructions/css-critical-rules.md` FIRST before any CSS change.

## File Structure

```
src/styling/
├── _custom.scss     # Bootstrap variable overrides + CSS custom properties (BEFORE Bootstrap)
├── _utilities.scss  # Shared utilities (~1270 lines, 11 sections)
├── _material-icons-optimized.scss
└── styles.scss      # Entry: custom → bootstrap → utilities → global (#player, view transitions)

src/app/
├── app.component.scss        # Main layout (#main, #container, #player-sidebar)
├── player/player.component.scss   # Queue list, container (NOT #player)
└── [feature]/[feature].component.scss
```

## File Responsibility

| File                       | Scope                                                                         |
| -------------------------- | ----------------------------------------------------------------------------- |
| `_custom.scss`             | Bootstrap variable overrides, `:root` custom properties, fonts                |
| `_utilities.scss`          | Shared: page layout, tracks, dropdowns, modals, cards, skeletons, empty state |
| `styles.scss`              | Global-only: #player, Bootstrap overrides, view transitions                   |
| `app.component.scss`       | Main layout (#main, #container, #player-sidebar)                              |
| `player.component.scss`    | Queue list, container (NOT #player), mobile hide                              |
| `[feature].component.scss` | Feature-specific styles only                                                  |

## `_utilities.scss` Sections (~1270 lines)

| Section           | Key Classes / Purpose                                                           |
| ----------------- | ------------------------------------------------------------------------------- |
| Custom Scrollbars | Thin themed scrollbars for modern browsers + WebKit                             |
| Touch Targets     | WCAG 2.5.8 minimum size                                                         |
| Page Layout       | `.page-container`, `.page-header`                                               |
| Tracks List       | Spotify-style CSS Grid for `.track-item` rows                                   |
| CDK Drag-and-Drop | Drag handle, placeholder, animation                                             |
| Shared Keyframes  | `fade-in-up`, `slideIn`, `dropdownReveal`                                       |
| Skeleton Loaders  | `.skeleton-pulse`, `.skeleton-line--title/subtitle/small`, `.skeleton-card-img` |
| Empty State       | `.empty-state`, `.empty-state-icon`, `.empty-state-text`                        |
| Original Utils    | Legacy helpers                                                                  |
| Cards             | Modern hover with `@media (hover: hover)`, `translateY(-4px)`                   |

## Critical Rules (Summary)

1. **YouTube `#player`** → global `styles.scss` only (iframe has no Angular encapsulation)
2. **Mobile `#player { height: 1px }`** → global `styles.scss` (avoids "not attached to DOM")
3. **Mobile `padding-bottom: 0`** → `player.component.scss` (removes 16:9 aspect ratio)

## Decision Tree

```
Need to style an element?
├── Created by Angular component? → component.scss
├── External library (YouTube, Google)? → styles.scss (global)
└── Bootstrap/framework override? → _custom.scss or styles.scss
```

## Dropdown Architecture

- Animation: opacity-only `dropdownReveal` (no `transform` — Popper.js conflict)
- Item padding: negative margin on child `> a, > button` for full-width click target
- Danger: `.dropdown-item-danger` on `<li>`, children inherit via `color: inherit`
- Active route: `routerLinkActive="active"` on `<li ngbDropdownItem>` (not `<a>`)
- Caret: globally hidden (`.dropdown-toggle::after { display: none }`)

## Modal Alert System

Base `.modal-alert` + 4 variants (`-danger`, `-success`, `-warning`, `-info`):

- Flex layout, `border-left: 4px solid`, `slideIn` animation
- Usable outside modals (e.g., info banners on pages)

## Naming Conventions

IDs: `kebab-case` (English). All French IDs were renamed (Jan 2026).

| Current             | Former (deprecated)     |
| ------------------- | ----------------------- |
| `#player-sidebar`   | `#gauche`               |
| `#queue-list`       | `#liste_en_cours`       |
| `#player-info-left` | `#header_player_gauche` |
| `#playlist-header`  | `#playlist_haut`        |
| `#artist-header`    | `#artist_haut`          |

## Mobile Layout

```
Desktop (>640px):          Mobile (≤640px):
┌─────────────────┐       ┌─────────────────┐
│ Header (fixed)  │       │ Header (static)  │
├────┬────────────┤       ├──────────────────┤
│Play│  Content   │       │   Content        │
│er  │            │       │   (full width)   │
└────┴────────────┘       └──────────────────┘
│ Control bar    │       │ Control bar      │
└────────────────┘       └──────────────────┘
```

Mobile: `#player-sidebar` → 1px, `#content` → 100%, `#queue-content` → hidden.

## Common Pitfalls

1. Moving `#player` to component CSS → Breaks iframe sizing
2. Mobile `#player` in component CSS → "Not attached to DOM" error
3. Forgetting `padding-bottom: 0` on mobile → Player still visible
4. Adding `transform` to dropdown animation → Popper.js positioning conflict
