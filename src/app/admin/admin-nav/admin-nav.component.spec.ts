import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { AdminNavComponent } from './admin-nav.component';
import { getTranslocoTestingProviders } from '../../transloco-testing';

describe('AdminNavComponent', () => {
  let fixture: ComponentFixture<AdminNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminNavComponent],
      providers: [getTranslocoTestingProviders(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminNavComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render links to the four admin pages', () => {
    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('a.nav-link')
    );
    const hrefs = links.map(a => a.getAttribute('href'));

    expect(links).toHaveLength(4);
    expect(hrefs).toContain('/admin/dashboard');
    expect(hrefs).toContain('/admin/duplicate-albums');
    expect(hrefs).toContain('/admin/duplicate-artists');
    expect(hrefs).toContain('/admin/reports');
  });
});
