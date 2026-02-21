---
applyTo: '**/*.spec.ts'
---

# Test Instructions (Vitest)

## Structure

```typescript
import { describe, it, expect, beforeEach, vi, type MockedObject } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';

describe('ComponentName', () => {
  let component: ComponentName;
  let fixture: ComponentFixture<ComponentName>;
  let serviceMock: MockedObject<ServiceName>;

  beforeEach(async () => {
    serviceMock = {
      getData: vi.fn(),
    } as unknown as MockedObject<ServiceName>;

    await TestBed.configureTestingModule({
      imports: [ComponentName],
      providers: [{ provide: ServiceName, useValue: serviceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentName);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data', () => {
    // Arrange
    serviceMock.getData.mockReturnValue(of(mockData));
    // Act
    fixture.detectChanges();
    // Assert — signal call syntax
    expect(component.isLoading()).toBe(false);
    expect(component.data()).toEqual(mockData);
  });
});
```

## Critical Rules

- Use **Vitest**, not Jest or Jasmine
- Access signal values with function call: `component.value()`
- Use typed mocks from `src/app/models/test-mocks.model.ts`
- Follow AAA pattern: Arrange, Act, Assert

## Mocking

```typescript
// Service mock
serviceMock.getData.mockReturnValue(of(response));

// Store mock
const authStoreMock = {
  isAuthenticated: signal(true),
  pseudo: signal('TestUser'),
} as unknown as AuthStore;
```

## Testing Signals

```typescript
expect(component.isLoading()).toBe(false); // initial
component.setLoading(true);
expect(component.isLoading()).toBe(true); // after update
expect(component.displayName()).toBe('Expected'); // computed
```

## Coverage

- Target: ≥ 80%
- Run: `npx vitest run --coverage`
