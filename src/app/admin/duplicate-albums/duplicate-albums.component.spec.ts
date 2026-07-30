import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DuplicateAlbumsComponent } from './duplicate-albums.component';
import { AlbumAdminService } from '../../services/album-admin.service';
import { SeoService } from '../../services/seo.service';
import { getTranslocoTestingProviders } from '../../transloco-testing';
import { DuplicateAlbumGroup } from '../../models/album-admin.model';

describe('DuplicateAlbumsComponent', () => {
  let component: DuplicateAlbumsComponent;
  let fixture: ComponentFixture<DuplicateAlbumsComponent>;
  let albumServiceMock: { getDuplicateAlbums: ReturnType<typeof vi.fn> };
  let seoServiceMock: { updateCanonicalUrl: ReturnType<typeof vi.fn> };

  const mockGroups: DuplicateAlbumGroup[] = [
    {
      key: 'test-album|test-artist',
      albums: [
        {
          id: '123',
          title: 'Test Album',
          artist: 'Test Artist',
          year: 2023,
          image: 'a.jpg',
          videoCount: 10,
        },
        {
          id: '456',
          title: 'Test Album',
          artist: 'Test Artist',
          year: 2023,
          image: 'b.jpg',
          videoCount: 12,
        },
      ],
    },
  ];

  beforeEach(async () => {
    albumServiceMock = {
      getDuplicateAlbums: vi.fn().mockReturnValue(of(mockGroups)),
    };
    seoServiceMock = { updateCanonicalUrl: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DuplicateAlbumsComponent],
      providers: [
        getTranslocoTestingProviders(),
        provideRouter([]),
        { provide: AlbumAdminService, useValue: albumServiceMock },
        { provide: SeoService, useValue: seoServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DuplicateAlbumsComponent);
    component = fixture.componentInstance;
  });

  it('should load duplicate groups on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(albumServiceMock.getDuplicateAlbums).toHaveBeenCalled();
    expect(component.items()).toEqual(mockGroups);
    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBe(false);
  });

  it('should show loading state initially', () => {
    expect(component.isLoading()).toBe(true);
  });

  it('should set error state on failure', async () => {
    albumServiceMock.getDuplicateAlbums.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.error()).toBe(true);
    expect(component.isLoading()).toBe(false);
    expect(component.items()).toEqual([]);
  });

  it('should refresh data when onRefresh is called', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(albumServiceMock.getDuplicateAlbums).toHaveBeenCalledTimes(1);

    component.onRefresh();
    await fixture.whenStable();
    expect(albumServiceMock.getDuplicateAlbums).toHaveBeenCalledTimes(2);
  });

  it('should set canonical URL', () => {
    fixture.detectChanges();
    expect(seoServiceMock.updateCanonicalUrl).toHaveBeenCalledWith(
      'http://localhost:4200/admin/duplicate-albums'
    );
  });
});
