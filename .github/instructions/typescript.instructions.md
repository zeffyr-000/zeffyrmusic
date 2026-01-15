---
applyTo: '**/*.ts,**/*.tsx'
---

# TypeScript Instructions

## General Rules

- Use strict TypeScript - no `any` types except in test mocks (with eslint-disable comment)
- Use `readonly` for injected dependencies and signals
- Prefer `const` over `let`, never use `var`

## Angular Specifics

- Always use `inject()` function, never constructor injection
- Use `signal()` for local state, `computed()` for derived state
- Access signal values with function call: `this.value()` not `this.value`

## Imports

- Use absolute imports from `src/app/...`
- Import stores from `../store` barrel export
- Import models from `../models`

## Examples

```typescript
// ✅ Correct patterns
private readonly userService = inject(UserService);
readonly authStore = inject(AuthStore);
readonly isLoading = signal(false);
readonly displayName = computed(() => this.authStore.pseudo() || 'Guest');

// ❌ Avoid these patterns
constructor(private userService: UserService) {} // No constructor injection
private isLoading = false; // Use signal() instead
this.cdr.markForCheck(); // Not needed with signals
```

## Naming Conventions

- PascalCase: Classes, Interfaces, Types, Enums
- camelCase: Variables, Functions, Methods, Properties
- UPPER_SNAKE_CASE: Constants, Enum values
- Suffix components with `Component`, services with `Service`, stores with `Store`
