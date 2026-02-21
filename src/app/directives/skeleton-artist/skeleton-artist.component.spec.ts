import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { SkeletonArtistComponent } from './skeleton-artist.component';

describe('SkeletonArtistComponent', () => {
  let component: SkeletonArtistComponent;
  let fixture: ComponentFixture<SkeletonArtistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonArtistComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonArtistComponent);
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

  it('should render artist header with avatar', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.skeleton-artist')).toBeTruthy();
    expect(el.querySelector('.skeleton-artist-avatar')).toBeTruthy();
    expect(el.querySelector('.skeleton-artist-info')).toBeTruthy();
  });

  it('should render album grid cards', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.skeleton-card-img').length).toBe(6);
  });

  it('should respect custom count for album cards', () => {
    fixture.componentRef.setInput('count', 3);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.skeleton-card-img').length).toBe(3);
  });

  it('should include visually-hidden loading text for accessibility', () => {
    const srText = fixture.nativeElement.querySelector('.visually-hidden');
    expect(srText?.textContent).toContain('Loading');
  });
});
