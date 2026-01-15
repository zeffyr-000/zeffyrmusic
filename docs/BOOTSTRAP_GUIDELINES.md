# Bootstrap 5 & ng-bootstrap Guidelines - Zeffyr Music

> Comprehensive guidelines for using Bootstrap 5 and ng-bootstrap in the project.
> Bootstrap Version: 5.3.x | ng-bootstrap Version: 20.x.x

## Table of Contents

- [Overview](#overview)
- [Sass Configuration](#sass-configuration)
- [Utility Classes](#utility-classes)
- [ng-bootstrap Components](#ng-bootstrap-components)
- [Color Modes (Dark Mode)](#color-modes-dark-mode)
- [Responsive Design](#responsive-design)
- [Accessibility](#accessibility)
- [Best Practices](#best-practices)
- [Anti-patterns to Avoid](#anti-patterns-to-avoid)

---

## Overview

### UI Stack

| Technology   | Version | Usage                                 |
| ------------ | ------- | ------------------------------------- |
| Bootstrap    | 5.3.x   | CSS framework (utilities, grid, base) |
| ng-bootstrap | 20.x.x  | Native Angular components             |
| Popper.js    | 2.11.x  | Dropdown/tooltip positioning          |
| SCSS         | -       | Preprocessor with Bootstrap variables |

### Style Architecture

```
src/styling/
├── _custom.scss           # Custom Bootstrap variables (BEFORE import)
├── _material-icons-optimized.scss
└── styles.scss            # Main entry point
```

**Critical import order in `styles.scss`:**

```scss
// 1. Custom variables (BEFORE Bootstrap)
@import 'custom';

// 2. Full Bootstrap
@import 'bootstrap/scss/bootstrap';

// 3. Other dependencies
@import 'ngx-sharebuttons/themes/default';
@import 'material-icons-optimized';
```

---

## Sass Configuration

### Customizable Variables

The `_custom.scss` file contains Bootstrap variable overrides. All variables must be defined **BEFORE** importing Bootstrap to leverage the `!default` flag.

#### Brand Colors

```scss
// Primary colors
$blue: #1ac8e5; // Main Zeffyr color
$secondary: #e8e7e7;
$yellow: #fc7e12;
$orange: #fc7e12;

// Background colors
$body-bg: #f8f8f8;
$body-color: $greyish-brown-two;

// UI gray shades
$gray-light: #e6e6e6; // Slider handles, table active rows
$gray-lighter: #eeeeee; // Album cards background
$gray-lightest: #f5f5f5; // Album cards hover
$gray-medium: #536570; // Slider handles, muted text
```

#### Available Variables to Customize

```scss
// Border radius
$border-radius: 0.5rem;
$border-radius-lg: 0.6rem;
$border-radius-sm: 0.4rem;

// Spacing
$grid-gutter-width: 20px;

// Cards
$card-spacer-x: 0.75rem;

// Modals
$modal-inner-padding: 2rem;
$modal-header-border-color: transparent;
```

### Bootstrap Functions and Mixins

Use Bootstrap functions instead of hardcoded values:

```scss
// ✅ Use Bootstrap functions
.custom-element {
  color: tint-color($primary, 10%);
  background: shade-color($primary, 20%);
}

// ✅ Use breakpoint mixins
.element {
  padding: 1rem;

  @include media-breakpoint-up(md) {
    padding: 2rem;
  }

  @include media-breakpoint-up(lg) {
    padding: 3rem;
  }
}

// ✅ Use Bootstrap CSS variables
.custom-element {
  color: var(--bs-body-color);
  background: var(--bs-body-bg);
}
```

---

## Utility Classes

### Prefer Bootstrap Utilities

Prefer Bootstrap utility classes over custom CSS in templates:

```html
<!-- ✅ RECOMMENDED: Utility classes -->
<div class="d-flex justify-content-between align-items-center p-3 mb-2">
  <span class="text-primary fw-bold">Title</span>
  <button class="btn btn-outline-secondary btn-sm">Action</button>
</div>

<!-- ❌ AVOID: Custom CSS for basic layout -->
<div class="custom-flex-container">...</div>
```

### Most Used Classes

#### Layout & Flexbox

| Class                                               | Usage         |
| --------------------------------------------------- | ------------- |
| `d-flex`, `d-none`, `d-block`                       | Display       |
| `justify-content-{start,center,end,between,around}` | Justification |
| `align-items-{start,center,end}`                    | Alignment     |
| `flex-{row,column,wrap}`                            | Direction     |
| `gap-{0-5}`                                         | Flex spacing  |

#### Spacing

| Pattern                | Example | Result                     |
| ---------------------- | ------- | -------------------------- |
| `m{t,b,s,e,x,y}-{0-5}` | `mt-3`  | margin-top: 1rem           |
| `p{t,b,s,e,x,y}-{0-5}` | `px-4`  | padding-left/right: 1.5rem |

#### Text

| Class                                             | Usage            |
| ------------------------------------------------- | ---------------- |
| `text-{primary,secondary,success,danger,warning}` | Color            |
| `text-{start,center,end}`                         | Alignment        |
| `fw-{light,normal,bold}`                          | Font weight      |
| `fs-{1-6}`                                        | Size (1=largest) |
| `text-truncate`                                   | Ellipsis         |
| `text-decoration-none`                            | Remove underline |

#### Responsive

All utilities support breakpoints: `{property}-{sm,md,lg,xl,xxl}-{value}`

```html
<!-- Visible only on desktop -->
<div class="d-none d-lg-block">Desktop only</div>

<!-- Responsive columns -->
<div class="col-12 col-md-6 col-lg-4">...</div>
```

---

## ng-bootstrap Components

### Component Imports

Import ng-bootstrap components individually (tree-shaking):

```typescript
// ✅ Individual import
import { NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  imports: [NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem],
  // ...
})
```

### Available Components

| Component      | Directive       | Usage              |
| -------------- | --------------- | ------------------ |
| **Accordion**  | `ngbAccordion`  | Collapsible panels |
| **Alert**      | `NgbAlert`      | Alert messages     |
| **Carousel**   | `ngbCarousel`   | Image slider       |
| **Collapse**   | `ngbCollapse`   | Content toggle     |
| **Datepicker** | `ngbDatepicker` | Date selector      |
| **Dropdown**   | `ngbDropdown`   | Dropdown menus     |
| **Modal**      | `NgbModal`      | Modal windows      |
| **Nav/Tabs**   | `ngbNav`        | Tab navigation     |
| **Offcanvas**  | `NgbOffcanvas`  | Side panel         |
| **Pagination** | `NgbPagination` | Pagination         |
| **Popover**    | `ngbPopover`    | Info bubbles       |
| **Rating**     | `NgbRating`     | Star rating        |
| **Toast**      | `NgbToast`      | Notifications      |
| **Tooltip**    | `ngbTooltip`    | Tooltips           |
| **Typeahead**  | `ngbTypeahead`  | Auto-completion    |

### Example: Dropdown

```html
<div ngbDropdown class="d-inline-block">
  <button class="btn btn-outline-primary" ngbDropdownToggle>Menu</button>
  <div ngbDropdownMenu>
    <button ngbDropdownItem>Action 1</button>
    <button ngbDropdownItem>Action 2</button>
    <div class="dropdown-divider"></div>
    <button ngbDropdownItem>Action 3</button>
  </div>
</div>
```

### Example: Modal

```typescript
// Service injection
private readonly modalService = inject(NgbModal);

openModal(content: TemplateRef<unknown>): void {
  this.modalService.open(content, { centered: true, size: 'lg' });
}
```

```html
<ng-template #myModal let-modal>
  <div class="modal-header">
    <h4 class="modal-title">Title</h4>
    <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
  </div>
  <div class="modal-body">Modal content</div>
  <div class="modal-footer">
    <button class="btn btn-secondary" (click)="modal.dismiss()">Cancel</button>
    <button class="btn btn-primary" (click)="modal.close('save')">Save</button>
  </div>
</ng-template>
```

---

## Color Modes (Dark Mode)

### Implementation

The project uses Bootstrap 5.3's `data-bs-theme` attribute:

```typescript
// In AuthStore
setBodyAttribute('data-bs-theme', 'dark'); // Enable dark mode
removeBodyAttribute('data-bs-theme'); // Return to light mode
```

### Custom Styles for Dark Mode

```scss
// Default styles (light)
.navbar-inverse {
  background-color: $white-two;
}

// Dark mode override
body[data-bs-theme='dark'] {
  .navbar-inverse {
    background-color: $black;
  }
}
```

### Using CSS Variables

Prefer Bootstrap CSS variables that adapt automatically:

```scss
// ✅ Adapts automatically to color mode
.custom-element {
  color: var(--bs-body-color);
  background-color: var(--bs-body-bg);
  border-color: var(--bs-border-color);
}

// ❌ Does not adapt
.custom-element {
  color: #333;
  background-color: white;
}
```

---

## Responsive Design

### Bootstrap Breakpoints

| Breakpoint  | Class infix | Dimensions |
| ----------- | ----------- | ---------- |
| Extra small | -           | <576px     |
| Small       | `sm`        | ≥576px     |
| Medium      | `md`        | ≥768px     |
| Large       | `lg`        | ≥992px     |
| Extra large | `xl`        | ≥1200px    |
| XXL         | `xxl`       | ≥1400px    |

### Mobile First

Bootstrap is designed mobile-first. Start with mobile styles, then add overrides for larger screens:

```scss
// Mobile default
.element {
  flex-direction: column;
  padding: 1rem;
}

// Tablet and up
@include media-breakpoint-up(md) {
  .element {
    flex-direction: row;
    padding: 2rem;
  }
}
```

### Responsive Grid

```html
<div class="container">
  <div class="row g-3">
    <!-- 1 column mobile, 2 tablet, 4 desktop -->
    <div class="col-12 col-md-6 col-lg-3">
      <div class="card">...</div>
    </div>
  </div>
</div>
```

---

## Accessibility

### Critical ng-bootstrap Rules

**⚠️ IMPORTANT: ng-bootstrap handles accessibility automatically.**

```html
<!-- ❌ INCORRECT: Redundant with ng-bootstrap -->
<button
  ngbDropdownToggle
  tabindex="0"
  (keydown.enter)="handleEnter()"
  (keydown.space)="handleSpace()"
  role="button"
>
  Menu
</button>

<!-- ✅ CORRECT: ng-bootstrap handles keyboard + aria -->
<button ngbDropdownToggle>Menu</button>
```

### Essential ARIA Attributes

| Element            | Required Attribute             |
| ------------------ | ------------------------------ |
| Modal close button | `aria-label="Close"`           |
| Loading spinner    | `role="status"`                |
| Alerts             | `role="alert"`                 |
| Navigation         | `aria-label="Main navigation"` |
| Images             | `alt="Description"`            |

### Color Contrast

Use Bootstrap's `color-contrast()` function:

```scss
.custom-badge {
  background-color: $primary;
  color: color-contrast($primary); // Automatically #fff or #000
}
```

---

## Best Practices

### 1. Prefer Utilities Over Custom CSS

```html
<!-- ✅ Bootstrap classes -->
<div class="d-flex gap-2 align-items-center">
  <!-- ❌ Custom CSS -->
  <div class="my-flex-container"></div>
</div>
```

### 2. Use ng-bootstrap Components

```typescript
// ✅ ng-bootstrap for interactions
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// ❌ No direct DOM manipulation
document.querySelector('.modal').classList.add('show');
```

### 3. Respect Component Structure

```html
<!-- ✅ Complete card structure -->
<div class="card">
  <div class="card-header">...</div>
  <div class="card-body">...</div>
  <div class="card-footer">...</div>
</div>
```

### 4. Use Appropriate Button Variants

| Variant            | Usage               |
| ------------------ | ------------------- |
| `btn-primary`      | Primary action      |
| `btn-secondary`    | Secondary action    |
| `btn-outline-*`    | Less emphasis       |
| `btn-link`         | Link style          |
| `btn-danger`       | Destructive actions |
| `btn-sm`, `btn-lg` | Alternative sizes   |

### 5. Forms

```html
<form>
  <div class="mb-3">
    <label for="email" class="form-label">Email</label>
    <input type="email" class="form-control" id="email" />
  </div>

  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" id="toggle" />
    <label class="form-check-label" for="toggle">Option</label>
  </div>

  <button type="submit" class="btn btn-primary">Submit</button>
</form>
```

---

## Anti-patterns to Avoid

### ❌ Don't Do

```html
<!-- 1. No !important except in extreme cases -->
<style>
  .element {
    color: red !important;
  }
</style>

<!-- 2. No inline styles -->
<div style="display: flex; margin: 10px;">
  <!-- 3. No deep SCSS nesting (max 3 levels) -->

  <!-- 4. No tabindex/keydown on ng-bootstrap elements -->
  <button ngbDropdownToggle tabindex="0" (keydown.enter)="...">
    <!-- 5. No custom classes for basic layout -->
    <div class="my-flex-center">
      <!-- use d-flex justify-content-center -->

      <!-- 6. No hardcoded color values -->
      <span style="color: #1ac8e5"> <!-- use text-primary or var(--bs-primary) --></span>
    </div>
  </button>
</div>
```

### ✅ Do

```html
<!-- 1. Use Bootstrap utilities -->
<div class="d-flex justify-content-center p-3">
  <!-- 2. Use CSS variables -->
  <span class="text-primary">
    <!-- 3. Let ng-bootstrap handle accessibility -->
    <button ngbDropdownToggle>Menu</button>

    <!-- 4. Semantic structure -->
    <nav aria-label="Main navigation">
      <ul class="nav">
        ...
      </ul>
    </nav>
  </span>
</div>
```

---

## Resources

- [Bootstrap 5.3 Documentation](https://getbootstrap.com/docs/5.3/)
- [ng-bootstrap Documentation](https://ng-bootstrap.github.io/)
- [Bootstrap Cheatsheet](https://getbootstrap.com/docs/5.3/examples/cheatsheet/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)

---

## Improvement Roadmap

Based on analysis of [Bootstrap 5.3 Examples](https://getbootstrap.com/docs/5.3/examples/), the following improvements should be implemented:

### Priority 1: Accessibility (Critical)

#### Spinners with proper ARIA

All loading spinners must include `role="status"` and visually hidden text:

```html
<!-- ❌ Current (incomplete) -->
<div class="spinner-border text-primary"></div>

<!-- ✅ Required (accessible) -->
<div class="spinner-border text-primary" role="status">
  <span class="visually-hidden">Loading...</span>
</div>
```

**Files to update:**

- `search.component.html`
- `home.component.html`
- `playlist.component.html`
- Any component with loading states

### Priority 2: Form Enhancements (UX)

#### Floating Labels for Login/Register

Use Bootstrap 5.3 floating labels for better UX in authentication forms:

```html
<!-- ❌ Current (standard labels) -->
<label for="email" class="form-label">Email</label>
<input type="email" class="form-control" id="email" />

<!-- ✅ Improved (floating labels) -->
<div class="form-floating mb-3">
  <input type="email" class="form-control" id="email" placeholder="Email" />
  <label for="email">Email</label>
</div>
```

**Benefits:**

- Modern look consistent with Bootstrap examples
- Better space efficiency
- Clear focus states

### Priority 3: Notifications (UX)

#### UiStore + NgbToast for User Feedback

The project uses `UiStore` (Signal Store) for notifications. The `ToastContainerComponent` displays them with NgbToast:

```typescript
// Using UiStore for notifications
private readonly uiStore = inject(UiStore);

// Show notifications
this.uiStore.showSuccess('Playlist created!');
this.uiStore.showError('Network error');
this.uiStore.showInfo('Track added to queue');

// With custom duration (ms)
this.uiStore.showSuccess('Saved!', 3000);
```

```html
<!-- ToastContainerComponent in app.component.html -->
<app-toast-container></app-toast-container>
```

**Use cases:**

- Success messages (playlist created, settings saved)
- Error messages (network errors)
- Info messages (track added to queue)

### Priority 4: Mobile Navigation (Mobile UX)

#### NgbOffcanvas for Mobile Menu

Replace dropdown burger menu with offcanvas for better mobile experience:

```html
<!-- ❌ Current (dropdown) -->
<div ngbDropdown>
  <button ngbDropdownToggle>
    <span class="material-icons">menu</span>
  </button>
  <ul ngbDropdownMenu>
    ...
  </ul>
</div>

<!-- ✅ Improved (offcanvas) -->
<button class="btn" (click)="openMobileMenu()">
  <span class="material-icons">menu</span>
</button>

<!-- In component -->
openMobileMenu() { this.offcanvasService.open(MobileMenuComponent, { position: 'start', panelClass:
'mobile-menu' }); }
```

**Benefits:**

- Full-height slide-in panel
- Better touch interaction
- More space for menu items
- Consistent with modern mobile patterns

### Priority 5: Visual Enhancements

#### Badges for Counts

Add badges to show counts on playlists, likes, etc:

```html
<a routerLink="/my-playlists" class="nav-link">
  My Playlists
  <span class="badge bg-primary rounded-pill">{{ playlistCount }}</span>
</a>
```

#### Card Hover Effects

Add subtle hover effects to cards using Bootstrap utilities:

```scss
.card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

  &:hover {
    transform: translateY(-4px);
    box-shadow: $box-shadow-lg;
  }
}
```

### Implementation Checklist

| Improvement           | Priority | Status  | Component(s)                                    |
| --------------------- | -------- | ------- | ----------------------------------------------- |
| Spinner accessibility | P1       | ✅ DONE | search, home, playlist, reset-password          |
| Floating labels       | P2       | ✅ DONE | header (login, register, reset password modals) |
| Toast notifications   | P3       | ✅ DONE | UiStore + ToastContainerComponent               |
| Offcanvas mobile menu | P4       | ⏸️ SKIP | Kept dropdown (simpler UX for current needs)    |
| Badges for counts     | P5       | ⏸️ SKIP | Not relevant for current UX                     |
| Card hover effects    | P5       | ✅ DONE | styles.scss (a.card selector)                   |

### Conformity Score

**Current Score: 8.5/10** ⬆️ (+1.0)

| Category                   | Score | Notes                                     |
| -------------------------- | ----- | ----------------------------------------- |
| Bootstrap components usage | 9/10  | Cards, alerts, buttons, toasts, badges    |
| Utility classes            | 9/10  | Excellent flexbox/grid usage              |
| Accessibility (ARIA/roles) | 9/10  | Spinners fixed with role="status"         |
| Modern patterns            | 8/10  | Floating labels, toasts, badges           |
| Mobile UX                  | 8/10  | Dropdown with badges (offcanvas optional) |

**Target Score: 9/10** - Optional: Offcanvas for mobile (P4)
