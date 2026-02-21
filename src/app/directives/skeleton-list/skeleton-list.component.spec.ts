import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { SkeletonListComponent } from './skeleton-list.component';

describe('SkeletonListComponent', () => {
  let component: SkeletonListComponent;
  let fixture: ComponentFixture<SkeletonListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to 8 items', () => {
    expect(component.count()).toBe(8);
    expect(component.items.length).toBe(8);
  });

  it('should render track skeleton rows', () => {
    const el: HTMLElement = fixture.nativeElement;
    const list = el.querySelector('.skeleton-tracks');
    expect(list).toBeTruthy();
    expect(list?.getAttribute('aria-busy')).toBe('true');
    expect(el.querySelectorAll('.skeleton-track').length).toBe(8);
  });

  it('should respect custom count', () => {
    fixture.componentRef.setInput('count', 4);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.skeleton-track').length).toBe(4);
  });

  it('should include visually-hidden loading text for accessibility', () => {
    const srText = fixture.nativeElement.querySelector('.visually-hidden');
    expect(srText?.textContent).toContain('Loading');
  });
});
