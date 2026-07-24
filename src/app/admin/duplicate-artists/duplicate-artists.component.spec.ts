import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DuplicateArtistsComponent } from './duplicate-artists.component';
import { ArtistAdminService } from '../../services/artist-admin.service';
import { SeoService } from '../../services/seo.service';
import { getTranslocoTestingProviders } from '../../transloco-testing';
import { DuplicateArtistGroup } from '../../models/artist-admin.model';

describe('DuplicateArtistsComponent', () => {
  let component: DuplicateArtistsComponent;
  let fixture: ComponentFixture<DuplicateArtistsComponent>;
  let artistServiceMock: { getDuplicateArtists: ReturnType<typeof vi.fn> };
  let seoServiceMock: { updateCanonicalUrl: ReturnType<typeof vi.fn> };

  const mockGroups: DuplicateArtistGroup[] = [
    {
      key: 'test-artist',
      artists: [
        { id: '123', name: 'Test Artist', albumCount: 5, deezerId: '456' },
        { id: '789', name: 'Test Artist', albumCount: 3, deezerId: '' },
      ],
    },
  ];

  beforeEach(async () => {
    artistServiceMock = {
      getDuplicateArtists: vi.fn().mockReturnValue(of(mockGroups)),
    };
    seoServiceMock = { updateCanonicalUrl: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DuplicateArtistsComponent],
      providers: [
        getTranslocoTestingProviders(),
        provideRouter([]),
        { provide: ArtistAdminService, useValue: artistServiceMock },
        { provide: SeoService, useValue: seoServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DuplicateArtistsComponent);
    component = fixture.componentInstance;
  });

  it('should load duplicate groups on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(artistServiceMock.getDuplicateArtists).toHaveBeenCalled();
    expect(component.groups()).toEqual(mockGroups);
    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBe(false);
  });

  it('should show loading state initially', () => {
    expect(component.isLoading()).toBe(true);
  });

  it('should set error state on failure', async () => {
    artistServiceMock.getDuplicateArtists.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.error()).toBe(true);
    expect(component.isLoading()).toBe(false);
    expect(component.groups()).toEqual([]);
  });

  it('should refresh data when onRefresh is called', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(artistServiceMock.getDuplicateArtists).toHaveBeenCalledTimes(1);

    component.onRefresh();
    await fixture.whenStable();
    expect(artistServiceMock.getDuplicateArtists).toHaveBeenCalledTimes(2);
  });

  it('should set canonical URL', () => {
    fixture.detectChanges();
    expect(seoServiceMock.updateCanonicalUrl).toHaveBeenCalledWith(
      'http://localhost:4200/admin/duplicate-artists'
    );
  });
});
