---
applyTo: 'src/app/**/*.component.ts'
---

# Angular Component Instructions

## Structure

```typescript
@Component({
  selector: 'app-my-feature',
  templateUrl: './my-feature.component.html',
  styleUrl: './my-feature.component.scss',    // singular
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, NgbTooltip, ...],
})
export class MyFeatureComponent {
  // 1. Injected dependencies (private readonly for services, readonly for stores)
  private readonly myService = inject(MyService);
  readonly authStore = inject(AuthStore);

  // 2. Inputs/Outputs
  readonly playlistId = input.required<string>();
  readonly autoPlay = input(false);
  readonly onClose = output<void>();

  // 3. Local state (signals)
  readonly isLoading = signal(false);

  // 4. Computed signals
  readonly displayName = computed(() => this.authStore.pseudo() || 'Guest');

  // 5. ViewChild/ContentChild
  readonly myElement = viewChild<ElementRef>('myRef');

  // 6. Methods
  onButtonClick(): void {
    this.isLoading.set(true);
  }
}
```

## Critical Rules

- Always use `ChangeDetectionStrategy.OnPush`
- Use `styleUrl` (singular), not `styleUrls`
- Standalone by default in Angular 21 — no need for `standalone: true`
- Use `signal()` for mutable local state, `computed()` for derived state
- Never use `ChangeDetectorRef.markForCheck()` with signals
- `readonly` on all injected dependencies and signals
- Use `inject()` function, never constructor injection

## Signal Inputs & Outputs

```typescript
readonly playlistId = input.required<string>();
readonly count = input(0, { transform: numberAttribute });
readonly onClose = output<void>();
readonly onSelect = output<PlaylistItem>();
```

## Restarting CSS Entry Animations Without DOM Recreation

When a CSS `animation` is tied to a DOM element that should **persist** across value changes
(avoid NG0956), you cannot rely on DOM recreation to replay the animation.
Use the **animation-name toggling trick** instead:

**Pattern (ControlBarComponent is the reference implementation):**

```typescript
// 1. A private tick signal incremented on each relevant change
private readonly _animTick = signal(0);

// 2. A public boolean computed derived from it
readonly cbAnimA = computed(() => this._animTick() % 2 === 0);

constructor() {
  // 3. effect() increments the tick when the tracked value changes
  effect(() => {
    this.currentKey();               // establish reactive dependency
    untracked(() => this._animTick.update(v => v + 1));
  });
}
```

```html
<!-- 4. Bind alternating classes on the animated element -->
<div [class.cb-anim-a]="cbAnimA()" [class.cb-anim-b]="!cbAnimA()">...</div>
```

```scss
// 5. Two IDENTICAL keyframes with different names
// The browser restarts the animation whenever animation-name changes.
.my-element.anim-a {
  animation: enter-a 220ms ease-out both;
}
.my-element.anim-b {
  animation: enter-b 220ms ease-out both;
}

@keyframes enter-a {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes enter-b {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Why it works:** The CSS spec triggers a new animation run whenever `animation-name` changes,
even if the new keyframe definition is identical. No DOM recreation needed.

**When to use it:**

- Element must stay in DOM (no `@for` recreation)
- You need to replay an entry animation on a data change
- Avoids NG0956 while keeping visual feedback

## SEO (Routed Components Only)

Every routed component must set:

1. Page title via `Title.setTitle()`
2. Meta description via `Meta.updateTag()`
3. Canonical URL via `SeoService.updateCanonicalUrl()`
