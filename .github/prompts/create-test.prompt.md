# Create Unit Test

Create a unit test file following project conventions with Vitest.

## Requirements

- Use Vitest (not Jest or Jasmine)
- Use typed mocks from `src/app/models/test-mocks.model.ts`
- Follow AAA pattern (Arrange, Act, Assert)
- Access signal values with function call syntax

## Component Test Template

```typescript
import { describe, it, expect, beforeEach, vi, type MockedObject } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { MyComponent } from './my.component';
import { MyService } from '../services/my.service';
import { AuthStore } from '../store';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;
  let serviceMock: MockedObject<MyService>;
  let authStoreMock: Partial<AuthStore>;

  beforeEach(async () => {
    serviceMock = {
      getData: vi.fn().mockReturnValue(of([])),
    } as unknown as MockedObject<MyService>;

    authStoreMock = {
      isAuthenticated: signal(true),
      pseudo: signal('TestUser'),
    };

    await TestBed.configureTestingModule({
      imports: [MyComponent],
      providers: [
        { provide: MyService, useValue: serviceMock },
        { provide: AuthStore, useValue: authStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', () => {
    // Arrange
    const mockData = [{ id: '1', name: 'Test' }];
    serviceMock.getData.mockReturnValue(of(mockData));

    // Act
    fixture.detectChanges();

    // Assert
    expect(component.isLoading()).toBe(false);
    expect(component.items()).toEqual(mockData);
  });

  it('should handle error', () => {
    // Arrange
    serviceMock.getData.mockReturnValue(throwError(() => new Error('API Error')));

    // Act
    fixture.detectChanges();

    // Assert
    expect(component.error()).toBe('API Error');
  });
});
```

## Service Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), MyService],
    });

    service = TestBed.inject(MyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch data', () => {
    const mockResponse = { id_data: '1', nom: 'Test' };

    service.getData().subscribe(data => {
      expect(data).toEqual({ id: '1', name: 'Test' });
    });

    const req = httpMock.expectOne('/api/endpoint');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
```
