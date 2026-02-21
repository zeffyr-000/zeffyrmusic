import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { SkeletonCardComponent } from './skeleton-card.component';

describe('SkeletonCardComponent', () => {
  let component: SkeletonCardComponent;
  let fixture: ComponentFixture<SkeletonCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to 6 items', () => {
    expect(component.count()).toBe(6);
    expect(component.items.length).toBe(6);
  });

  it('should render Bootstrap row-cols grid with cards', () => {
    const el: HTMLElement = fixture.nativeElement;
    const grid = el.querySelector('.row');
    expect(grid).toBeTruthy();
    expect(grid?.getAttribute('aria-busy')).toBe('true');
    expect(el.querySelectorAll('.col').length).toBe(6);
    expect(el.querySelectorAll('.skeleton-card-img').length).toBe(6);
  });

  it('should respect custom count', () => {
    fixture.componentRef.setInput('count', 3);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.col').length).toBe(3);
  });

  it('should include visually-hidden loading text for accessibility', () => {
    const srText = fixture.nativeElement.querySelector('.visually-hidden');
    expect(srText?.textContent).toContain('Loading');
  });
});
