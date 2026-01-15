# Create Component

Create a new Angular component following project conventions.

## Requirements

- Use `ChangeDetectionStrategy.OnPush`
- Use `standalone: true`
- Use `inject()` for dependencies
- Use `signal()` for local state
- Use `computed()` for derived state
- Use signal-based inputs with `input()` and `input.required()`
- Use `output()` for event emitters

## Template

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-component-name',
  standalone: true,
  imports: [],
  templateUrl: './component-name.component.html',
  styleUrl: './component-name.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentNameComponent {
  // Injected dependencies
  private readonly someService = inject(SomeService);

  // Signal inputs
  readonly data = input.required<DataType>();

  // Outputs
  readonly onAction = output<void>();

  // Local signals
  readonly isLoading = signal(false);

  // Computed signals
  readonly displayValue = computed(() => this.data().name);

  // Methods
  handleClick(): void {
    this.onAction.emit();
  }
}
```

## For routed components, add SEO

```typescript
ngOnInit(): void {
  this.titleService.setTitle(this.translocoService.translate('page_title'));
  this.metaService.updateTag({
    name: 'description',
    content: this.translocoService.translate('page_meta_description'),
  });
  this.seoService.updateCanonicalUrl(`${environment.URL_BASE}/path`);
}
```
