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

## SEO (Routed Components Only)

Every routed component must set:

1. Page title via `Title.setTitle()`
2. Meta description via `Meta.updateTag()`
3. Canonical URL via `SeoService.updateCanonicalUrl()`
