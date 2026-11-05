// TEMPORARY jour4: catalogue upgrade tab, delete this folder once the upgrade is over (API docs/mise-a-niveau-catalogue.md, section 8)
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe, registerLocaleData } from '@angular/common';
import { RouterLink } from '@angular/router';
import localeFr from '@angular/common/locales/fr';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { BaseChartDirective } from 'ng2-charts';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { firstValueFrom } from 'rxjs';
import { AdminNavComponent } from '../admin-nav/admin-nav.component';
import { AdminCatalogueService } from '../../services/admin-catalogue.service';
import { SeoService } from '../../services/seo.service';
import {
  CATALOGUE_KNOWN_RESULTS,
  CATALOGUE_MISSING_STATUSES,
  CATALOGUE_REVIEW_RESULTS,
  CATALOGUE_STATES,
  CatalogueHistoryPoint,
  CatalogueResponse,
  CatalogueTask,
} from '../../models/admin-catalogue.model';
import { ALBUM_REPORT_KNOWN_RESULTS } from '../../models/album-report.model';
import { environment } from '../../../environments/environment';

registerLocaleData(localeFr);
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface StatCard {
  icon: string;
  labelKey: string;
  value: number;
  /** Shown as "value / total" with a percentage when set. */
  total?: number;
}

interface CountItem {
  key: string;
  /** Null for a code unknown to the front: the raw code is shown. */
  labelKey: string | null;
  count: number;
  percent: number;
}

/** Tabs of the recent albums panel, one per jour4 task. */
type RecentTab = 'upgraded' | 'created';

function percent(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

/** Translation key of a processing result, null for a code unknown to the front (shown raw). */
function resultLabelKey(code: string): string | null {
  if (ALBUM_REPORT_KNOWN_RESULTS.has(code)) return `admin_reports_result_${code}`;
  if (CATALOGUE_KNOWN_RESULTS.has(code)) return `admin_catalogue_result_${code}`;
  return null;
}

/** Translation key of an album state, null for an unknown or empty one. */
function stateLabelKey(state: string): string | null {
  return (CATALOGUE_STATES as readonly string[]).includes(state)
    ? `admin_catalogue_state_${state}`
    : null;
}

/** Known codes first, in display order, then any code the API added. */
function countItems(
  counts: Record<string, number> | undefined,
  order: readonly string[],
  labelPrefix: string
): CountItem[] {
  if (!counts) return [];
  const total = Object.values(counts).reduce((sum, v) => sum + v, 0);
  const keys = [
    ...order.filter(k => k in counts),
    ...Object.keys(counts).filter(k => !order.includes(k)),
  ];
  return keys.map(key => ({
    key,
    labelKey: order.includes(key) ? labelPrefix + key : null,
    count: counts[key],
    percent: percent(counts[key], total),
  }));
}

@Component({
  selector: 'app-catalogue',
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.scss',
  imports: [
    TranslocoPipe,
    DecimalPipe,
    DatePipe,
    RouterLink,
    BaseChartDirective,
    AdminNavComponent,
  ],
})
export class CatalogueComponent implements OnInit {
  private readonly catalogueService = inject(AdminCatalogueService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly seoService = inject(SeoService);
  private readonly translocoService = inject(TranslocoService);

  readonly isLoading = signal(true);
  readonly data = signal<CatalogueResponse | null>(null);
  readonly error = signal(false);
  readonly skeletonItems = [0, 1, 2, 3];

  /** Progress from the starting volume to the doubling target, per dimension. */
  readonly targetItems = computed(() => {
    const target = this.data()?.target;
    if (!target) return [];
    return [
      {
        key: 'albums',
        labelKey: 'admin_catalogue_target_albums',
        start: target.albumsStart,
        now: target.albumsNow,
        target: target.albumsTarget,
      },
      {
        key: 'artists',
        labelKey: 'admin_catalogue_target_artists',
        start: target.artistsStart,
        now: target.artistsNow,
        target: target.artistsTarget,
      },
    ].map(item => ({
      ...item,
      percent: percent(Math.max(0, item.now - item.start), item.target - item.start),
    }));
  });

  readonly upgradeCards = computed<StatCard[]>(() => {
    const albums = this.data()?.albums;
    if (!albums) return [];
    return [
      { icon: 'album', labelKey: 'admin_catalogue_albums_total', value: albums.total },
      {
        icon: 'fact_check',
        labelKey: 'admin_catalogue_albums_diagnosed',
        value: albums.diagnosed,
        total: albums.total,
      },
      {
        icon: 'build',
        labelKey: 'admin_catalogue_albums_processed',
        value: albums.processed,
        total: albums.total,
      },
      {
        icon: 'verified',
        labelKey: 'admin_catalogue_albums_compliant',
        value: albums.current['conforme'] ?? 0,
        total: albums.total,
      },
      {
        icon: 'content_cut',
        labelKey: 'admin_catalogue_lines_removed',
        value: albums.linesRemoved,
      },
      { icon: 'videocam_off', labelKey: 'admin_catalogue_dead_tracks', value: albums.deadTracks },
      { icon: 'content_copy', labelKey: 'admin_catalogue_duplicated', value: albums.duplicated },
      { icon: 'toll', labelKey: 'admin_catalogue_units', value: albums.units },
    ];
  });

  readonly completionCards = computed<StatCard[]>(() => {
    const completion = this.data()?.completion;
    if (!completion) return [];
    return [
      {
        icon: 'travel_explore',
        labelKey: 'admin_catalogue_artists_explored',
        value: completion.artistsExplored,
        // Added artists are counted in `artists` but explored as new ones
        total: completion.artists - completion.artistsAdded,
      },
      {
        icon: 'person_search',
        labelKey: 'admin_catalogue_artists_candidates',
        value: completion.artistsCandidates,
      },
      {
        icon: 'how_to_reg',
        labelKey: 'admin_catalogue_artists_selected',
        value: completion.artistsSelected,
      },
      {
        icon: 'person_add',
        labelKey: 'admin_catalogue_artists_added',
        value: completion.artistsAdded,
        total: completion.artistsSelected,
      },
      {
        icon: 'library_music',
        labelKey: 'admin_catalogue_created_new_artists',
        value: completion.albumsNewArtists['cree'] ?? 0,
        total: completion.albums['cree'] ?? 0,
      },
      { icon: 'toll', labelKey: 'admin_catalogue_units', value: completion.units },
    ];
  });

  readonly initialStates = computed(() =>
    countItems(this.data()?.albums.initial, CATALOGUE_STATES, 'admin_catalogue_state_')
  );

  readonly currentStates = computed(() =>
    countItems(this.data()?.albums.current, CATALOGUE_STATES, 'admin_catalogue_state_')
  );

  readonly stateBlocks = computed(() => [
    { titleKey: 'admin_catalogue_states_initial', items: this.initialStates() },
    { titleKey: 'admin_catalogue_states_current', items: this.currentStates() },
  ]);

  readonly missingAlbums = computed(() =>
    countItems(
      this.data()?.completion.albums,
      CATALOGUE_MISSING_STATUSES,
      'admin_catalogue_missing_'
    )
  );

  readonly segments = computed(() =>
    (this.data()?.segments ?? []).map(s => ({
      ...s,
      labelKey: `admin_catalogue_segment_${s.key}`,
      processedPercent: percent(s.processed, s.total),
      compliantPercent: percent(s.compliant, s.total),
    }))
  );

  readonly quota = computed(() =>
    (this.data()?.quota ?? []).map(q => ({
      ...q,
      labelKey: `admin_catalogue_task_${q.task}`,
      percent: percent(q.usedToday, q.budget),
    }))
  );

  readonly results = computed(() =>
    Object.entries(this.data()?.albums.results ?? {})
      .map(([code, count]) => ({ code, labelKey: resultLabelKey(code), count }))
      .sort((a, b) => b.count - a.count)
  );

  readonly recentTab = signal<RecentTab>('upgraded');

  /** Last upgraded albums, with their labels and a flag on results to check by hand. */
  readonly recentUpgraded = computed(() =>
    (this.data()?.recent.upgraded ?? []).map(album => ({
      ...album,
      resultKey: resultLabelKey(album.result),
      initialStateKey: stateLabelKey(album.initialState),
      stateKey: stateLabelKey(album.state),
      toReview: CATALOGUE_REVIEW_RESULTS.has(album.result),
    }))
  );

  /** Last created albums, with the same labels and flag. */
  readonly recentCreated = computed(() =>
    (this.data()?.recent.created ?? []).map(album => ({
      ...album,
      resultKey: resultLabelKey(album.result),
      toReview: CATALOGUE_REVIEW_RESULTS.has(album.result),
    }))
  );

  readonly historyChartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const history = this.data()?.history ?? [];
    const dates = [...new Set(history.map(p => p.date))].sort((a, b) => a.localeCompare(b));
    const daily = (
      task: CatalogueTask,
      field: keyof Pick<CatalogueHistoryPoint, 'processed' | 'created'>
    ) =>
      dates.map(date =>
        history
          .filter(p => p.date === date && p.task === task)
          .reduce((sum, p) => sum + p[field], 0)
      );

    return {
      labels: dates.map(date => {
        const [, month, day] = date.split('-');
        return `${day}/${month}`;
      }),
      datasets: [
        {
          data: daily('mise_a_niveau', 'processed'),
          label: this.translocoService.translate('admin_catalogue_history_processed'),
          backgroundColor: '#1ac8e5',
        },
        {
          data: daily('completion', 'created'),
          label: this.translocoService.translate('admin_catalogue_history_created'),
          backgroundColor: '#f0ad4e',
        },
      ],
    };
  });

  readonly historyChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toLocaleString('fr-FR')}`,
        },
      },
    },
    scales: {
      x: { ticks: { maxTicksLimit: 30, maxRotation: 0 } },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, callback: value => Number(value).toLocaleString('fr-FR') },
      },
    },
  };

  ngOnInit(): void {
    this.titleService.setTitle(
      this.translocoService.translate('admin_catalogue_title') + ' - Zeffyr Music'
    );
    this.metaService.updateTag({
      name: 'description',
      content: this.translocoService.translate('admin_catalogue_title') || '',
    });
    this.seoService.updateCanonicalUrl(`${environment.URL_BASE}admin/catalogue`);
    void this.loadCatalogue();
  }

  async loadCatalogue(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(false);

    try {
      this.data.set(await firstValueFrom(this.catalogueService.getCatalogue()));
    } catch {
      this.error.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  onRefresh(): void {
    void this.loadCatalogue();
  }

  onRecentTab(tab: RecentTab): void {
    this.recentTab.set(tab);
  }

  percentOf(value: number, total: number): number {
    return percent(value, total);
  }
}
