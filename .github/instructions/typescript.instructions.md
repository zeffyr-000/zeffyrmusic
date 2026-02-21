---
applyTo: '**/*.ts,**/*.tsx'
---

# TypeScript Instructions

## General Rules

- Strict TypeScript — no `any` types (use `unknown` or proper typing)
- `readonly` on all injected dependencies and signals
- `const` over `let`, never `var`

## Angular Patterns

```typescript
// ✅ inject() function
private readonly userService = inject(UserService);
readonly authStore = inject(AuthStore);
readonly isLoading = signal(false);
readonly displayName = computed(() => this.authStore.pseudo() || 'Guest');

// ❌ No constructor injection
constructor(private userService: UserService) {}
// ❌ No ChangeDetectorRef with signals
this.cdr.markForCheck();
```

## Naming Conventions

| Style       | Usage                              |
| ----------- | ---------------------------------- |
| PascalCase  | Classes, Interfaces, Types, Enums  |
| camelCase   | Variables, Functions, Methods      |
| UPPER_SNAKE | Constants, Enum values             |
| Suffix      | `*Component`, `*Service`, `*Store` |

## Imports

- Absolute imports from `src/app/...`
- Stores from `../store` barrel export
- Models from `../models`

## Code Quality

- No dead code — remove unused imports/variables/methods
- Method length ≤ 30 lines
- Cyclomatic complexity ≤ 10
- Max 4 parameters per method
- Max 2 levels of nested callbacks
- English-only comments
