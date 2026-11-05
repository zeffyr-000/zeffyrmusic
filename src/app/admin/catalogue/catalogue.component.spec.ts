import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CatalogueComponent } from './catalogue.component';
import { AdminCatalogueService } from '../../services/admin-catalogue.service';
import { SeoService } from '../../services/seo.service';
import { getTranslocoTestingProviders } from '../../transloco-testing';
import { CatalogueResponse } from '../../models/admin-catalogue.model';

describe('CatalogueComponent', () => {
  let component: CatalogueComponent;
  let fixture: ComponentFixture<CatalogueComponent>;
  let catalogueServiceMock: { getCatalogue: ReturnType<typeof vi.fn> };

  const mockResponse: CatalogueResponse = {
    target: {
      albumsStart: 200,
      albumsNow: 250,
      albumsTarget: 400,
      artistsStart: 100,
      artistsNow: 100,
      artistsTarget: 200,
    },
    albums: {
      total: 200,
      diagnosed: 150,
      processed: 50,
      units: 1200,
      linesRemoved: 340,
      deadTracks: 4,
      duplicated: 30,
      current: { non_diagnostique: 50, conforme: 120, nouvel_etat: 5, incomplet: 25 },
      initial: { conforme: 90, non_conforme: 60 },
      results: { regenere: 10, album_conforme: 35, code_inconnu: 5, titres_suspects: 2 },
    },
    segments: [
      { key: 'top', total: 40, processed: 40, compliant: 36 },
      { key: 'top_artists', total: 60, processed: 10, compliant: 50 },
      { key: 'long_tail', total: 100, processed: 0, compliant: 34 },
    ],
    completion: {
      artists: 100,
      artistsExplored: 30,
      artistsCandidates: 120,
      artistsSelected: 12,
      artistsAdded: 5,
      units: 900,
      albums: { cree: 8, a_creer: 32 },
      albumsNewArtists: { cree: 3, a_creer: 10 },
    },
    quota: [
      { task: 'mise_a_niveau', budget: 9500, usedToday: 4750 },
      { task: 'completion', budget: 9500, usedToday: 0 },
    ],
    history: [
      {
        date: '2026-10-30',
        task: 'mise_a_niveau',
        processed: 20,
        diagnosed: 0,
        created: 0,
        explored: 0,
        units: 600,
      },
      {
        date: '2026-10-31',
        task: 'mise_a_niveau',
        processed: 30,
        diagnosed: 150,
        created: 0,
        explored: 0,
        units: 600,
      },
      {
        date: '2026-10-31',
        task: 'completion',
        processed: 0,
        diagnosed: 0,
        created: 8,
        explored: 30,
        units: 900,
      },
    ],
    recent: {
      upgraded: [
        {
          albumId: '61190',
          date: 1793895800,
          title: 'Joie de vivre',
          artist: 'Louane',
          result: 'regenere',
          initialState: 'incomplet',
          state: 'conforme',
          score: 95,
          units: 108,
        },
        {
          albumId: '64207',
          date: 1793885000,
          title: 'Toy',
          artist: 'David Bowie',
          result: 'titres_suspects',
          initialState: 'non_conforme',
          state: 'etat_inconnu',
          score: 8,
          units: 2,
        },
      ],
      created: [
        {
          albumId: '80602',
          date: 1793889609,
          title: 'Or Noir Part 3',
          artist: 'Kaaris',
          result: 'cree_a_verifier',
          units: 3,
          newArtist: false,
        },
      ],
    },
  };

  beforeEach(async () => {
    catalogueServiceMock = { getCatalogue: vi.fn().mockReturnValue(of(mockResponse)) };

    await TestBed.configureTestingModule({
      imports: [CatalogueComponent],
      providers: [
        getTranslocoTestingProviders(),
        provideRouter([]),
        { provide: AdminCatalogueService, useValue: catalogueServiceMock },
        { provide: SeoService, useValue: { updateCanonicalUrl: vi.fn() } },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogueComponent);
    component = fixture.componentInstance;
  });

  it('should load catalogue progress on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(catalogueServiceMock.getCatalogue).toHaveBeenCalled();
    expect(component.data()).toEqual(mockResponse);
    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBe(false);
  });

  it('should set error state on failure', async () => {
    catalogueServiceMock.getCatalogue.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.error()).toBe(true);
    expect(component.data()).toBeNull();
  });

  it('should count compliant albums from the current states', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compliant = component
      .upgradeCards()
      .find(c => c.labelKey === 'admin_catalogue_albums_compliant');
    expect(compliant).toEqual(expect.objectContaining({ value: 120, total: 200 }));
  });

  it('should order states as known codes first, then unknown codes shown raw', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const states = component.currentStates();
    expect(states.map(s => s.key)).toEqual([
      'conforme',
      'incomplet',
      'non_diagnostique',
      'nouvel_etat',
    ]);
    expect(states[0]).toEqual({
      key: 'conforme',
      labelKey: 'admin_catalogue_state_conforme',
      count: 120,
      percent: 60,
    });
    expect(states[3].labelKey).toBeNull();
  });

  it('should compute segment progress percentages', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const [top, topArtists] = component.segments();
    expect(top.processedPercent).toBe(100);
    expect(top.compliantPercent).toBe(90);
    expect(topArtists.processedPercent).toBe(17);
  });

  it('should exclude added new artists from the catalogue artists to explore', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.completionCards()[0]).toEqual(
      expect.objectContaining({ value: 30, total: 95 })
    );
  });

  it('should show the share of creations going to new artists', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const card = component
      .completionCards()
      .find(c => c.labelKey === 'admin_catalogue_created_new_artists');
    expect(card).toEqual(expect.objectContaining({ value: 3, total: 8 }));
  });

  it('should list queue statuses in display order', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.missingAlbums().map(m => m.key)).toEqual(['a_creer', 'cree']);
  });

  it('should compute today quota usage', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.quota()[0]).toEqual(
      expect.objectContaining({ labelKey: 'admin_catalogue_task_mise_a_niveau', percent: 50 })
    );
  });

  it('should sort results and label known report codes only', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const results = component.results();
    expect(results.map(r => r.code)).toEqual([
      'album_conforme',
      'regenere',
      'code_inconnu',
      'titres_suspects',
    ]);
    expect(results[0].labelKey).toBe('admin_reports_result_album_conforme');
    expect(results[2].labelKey).toBeNull();
    expect(results[3].labelKey).toBe('admin_catalogue_result_titres_suspects');
  });

  it('should chart upgraded and created albums per day', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const chart = component.historyChartData();
    expect(chart.labels).toEqual(['30/10', '31/10']);
    expect(chart.datasets[0].data).toEqual([20, 30]);
    expect(chart.datasets[1].data).toEqual([0, 8]);
  });

  it('should measure progress from the starting volume to the doubling target', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const [albums, artists] = component.targetItems();
    expect(albums).toEqual(expect.objectContaining({ now: 250, target: 400, percent: 25 }));
    expect(artists.percent).toBe(0);
  });

  it('should label recent upgrades and flag results to check by hand', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const [regenerated, suspect] = component.recentUpgraded();
    expect(regenerated).toEqual(
      expect.objectContaining({
        resultKey: 'admin_reports_result_regenere',
        initialStateKey: 'admin_catalogue_state_incomplet',
        stateKey: 'admin_catalogue_state_conforme',
        toReview: false,
      })
    );
    expect(suspect).toEqual(
      expect.objectContaining({
        resultKey: 'admin_catalogue_result_titres_suspects',
        stateKey: null,
        toReview: true,
      })
    );
  });

  it('should label recent creations with the catalogue result keys', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.recentCreated()[0]).toEqual(
      expect.objectContaining({
        resultKey: 'admin_catalogue_result_cree_a_verifier',
        toReview: true,
      })
    );
  });

  it('should show the upgrades first, then the creations when their tab is chosen', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const rows = (testId: string) =>
      fixture.nativeElement.querySelectorAll(`[data-testid="${testId}"]`).length;

    expect(component.recentTab()).toBe('upgraded');
    expect(rows('recent-upgraded-row')).toBe(2);
    expect(rows('recent-created-row')).toBe(0);

    fixture.nativeElement.querySelector('[data-testid="recent-tab-created"]').click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.recentTab()).toBe('created');
    expect(rows('recent-upgraded-row')).toBe(0);
    expect(rows('recent-created-row')).toBe(1);
  });

  it('should reload on refresh', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.onRefresh();
    expect(catalogueServiceMock.getCatalogue).toHaveBeenCalledTimes(2);
  });
});
