# Refactor to Signals

Refactor a component from legacy patterns to modern Angular signals.

## Migration Checklist

### 1. Replace class properties with signals

```typescript
// Before
isLoading = false;
items: Item[] = [];

// After
readonly isLoading = signal(false);
readonly items = signal<Item[]>([]);
```

### 2. Replace getters with computed signals

```typescript
// Before
get displayName(): string {
  return this.user?.name || 'Guest';
}

// After
readonly displayName = computed(() => this.user()?.name || 'Guest');
```

### 3. Update template access

```html
<!-- Before -->
<div *ngIf="isLoading">Loading...</div>
<div>{{ items.length }} items</div>

<!-- After -->
@if (isLoading()) {
<div>Loading...</div>
}
<div>{{ items().length }} items</div>
```

### 4. Replace @Input with signal inputs

```typescript
// Before
@Input() userId!: string;
@Input() autoPlay = false;

// After
readonly userId = input.required<string>();
readonly autoPlay = input(false);
```

### 5. Replace @Output with output()

```typescript
// Before
@Output() onSelect = new EventEmitter<Item>();

// After
readonly onSelect = output<Item>();
```

### 6. Remove ChangeDetectorRef

```typescript
// Before
private cdr = inject(ChangeDetectorRef);
this.isLoading = true;
this.cdr.markForCheck();

// After
this.isLoading.set(true);
// No markForCheck needed!
```

### 7. Update RxJS subscriptions

```typescript
// Before
this.service.getData().subscribe(data => {
  this.items = data;
  this.isLoading = false;
});

// After
this.service.getData().subscribe(data => {
  this.items.set(data);
  this.isLoading.set(false);
});
```

## Key Points

- Always use `ChangeDetectionStrategy.OnPush`
- Signal changes automatically trigger change detection
- Use `set()` for replacing value, `update()` for transforming current value
- Computed signals are read-only and auto-track dependencies
