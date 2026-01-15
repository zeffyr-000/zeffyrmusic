---
applyTo: 'src/app/**/*.component.ts'
---

# Angular Component Instructions

## Component Structure

```typescript
@Component({
  selector: 'app-feature-name',
  standalone: true,
  imports: [
    /* ... */
  ],
  templateUrl: './feature-name.component.html',
  styleUrl: './feature-name.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureNameComponent implements OnInit {
  // 1. Injected dependencies (readonly)
  private readonly userService = inject(UserService);
  readonly authStore = inject(AuthStore);

  // 2. Inputs/Outputs
  readonly userId = input.required<string>();
  readonly onSelect = output<Item>();

  // 3. Signals (local state)
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // 4. Computed signals
  readonly displayName = computed(() => this.authStore.pseudo() || 'Guest');

  // 5. Lifecycle hooks
  ngOnInit(): void {
    // SEO for routed components
    this.titleService.setTitle(this.translocoService.translate('page_title'));
  }

  // 6. Methods
  onButtonClick(): void {
    this.isLoading.set(true);
  }
}
```

## Critical Rules

- Always use `ChangeDetectionStrategy.OnPush`
- Always use `standalone: true`
- Use `signal()` for mutable local state
- Use `computed()` for derived state
- Never use `ChangeDetectorRef.markForCheck()` with signals

## SEO Requirements (Routed Components)

Every routed component must set:

1. Page title via `Title.setTitle()`
2. Meta description via `Meta.updateTag()`
3. Canonical URL via `SeoService.updateCanonicalUrl()`

## Signal Inputs

Use Angular's signal-based inputs:

```typescript
// Required input
readonly playlistId = input.required<string>();

// Optional with default
readonly autoPlay = input(false);

// Transform input
readonly count = input(0, { transform: numberAttribute });
```

## Outputs

Use Angular's `output()` function:

```typescript
readonly onClose = output<void>();
readonly onSelect = output<PlaylistItem>();
```
