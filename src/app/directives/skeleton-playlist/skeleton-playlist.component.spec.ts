import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { SkeletonPlaylistComponent } from './skeleton-playlist.component';

describe('SkeletonPlaylistComponent', () => {
  let component: SkeletonPlaylistComponent;
  let fixture: ComponentFixture<SkeletonPlaylistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonPlaylistComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonPlaylistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to 8 tracks', () => {
    expect(component.count()).toBe(8);
    expect(component.items.length).toBe(8);
  });

  it('should render playlist header with image placeholder', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.skeleton-playlist-header')).toBeTruthy();
    expect(el.querySelector('.skeleton-playlist-image')).toBeTruthy();
    expect(el.querySelector('.skeleton-playlist-info')).toBeTruthy();
  });

  it('should render action button placeholders', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.skeleton-playlist-actions')).toBeTruthy();
    expect(el.querySelectorAll('.skeleton-line--pl-btn').length).toBe(2);
    expect(el.querySelector('.skeleton-line--pl-btn-primary')).toBeTruthy();
  });

  it('should render track rows', () => {
    const el: HTMLElement = fixture.nativeElement;
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
