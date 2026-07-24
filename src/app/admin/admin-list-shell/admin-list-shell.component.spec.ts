import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { AdminListShellComponent } from './admin-list-shell.component';
import { getTranslocoTestingProviders } from '../../transloco-testing';

@Component({
  imports: [AdminListShellComponent],
  template: `
    <app-admin-list-shell
      icon="album"
      titleKey="admin_duplicate_albums_title"
      introKey="admin_duplicate_albums_intro"
      emptyKey="admin_duplicate_albums_empty"
      [loading]="loading"
      [error]="error"
      [empty]="empty"
      (refresh)="refreshCount = refreshCount + 1"
    >
      <p class="projected">content</p>
    </app-admin-list-shell>
  `,
})
class HostComponent {
  loading = false;
  error = false;
  empty = false;
  refreshCount = 0;
}

describe('AdminListShellComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [getTranslocoTestingProviders(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  it('should project content in the loaded state', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.projected')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeNull();
  });

  it('should show skeletons while loading and hide projected content', () => {
    host.loading = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.skeleton-pulse')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.projected')).toBeNull();
  });

  it('should show the error state', () => {
    host.error = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.projected')).toBeNull();
  });

  it('should show the empty state', () => {
    host.empty = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.projected')).toBeNull();
  });

  it('should emit refresh when the header button is clicked', () => {
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.admin-page-header button'
    );
    button.click();
    expect(host.refreshCount).toBe(1);
  });
});
