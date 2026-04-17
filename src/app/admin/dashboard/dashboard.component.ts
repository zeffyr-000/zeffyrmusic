import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DecimalPipe, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from 'chart.js';
import { firstValueFrom } from 'rxjs';
import { AdminDashboardService } from '../../services/admin-dashboard.service';
import { SeoService } from '../../services/seo.service';
import { DashboardGrowth, DashboardStats } from '../../models/admin-dashboard.model';
import { environment } from '../../../environments/environment';

registerLocaleData(localeFr);
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip
);

interface StatCard {
  icon: string;
  labelKey: string;
  value: number;
}

interface DistributionItem {
  labelKey: string;
  count: number;
  percent: number;
}

const LANG_LABEL_MAP: Record<string, string> = {
  fr: 'admin_dashboard_lang_fr_FR',
  en: 'admin_dashboard_lang_en_US',
};

const DARK_MODE_LABEL_MAP: Record<string, string> = {
  enabled: 'admin_dashboard_dark_mode_on',
  disabled: 'admin_dashboard_dark_mode_off',
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, DecimalPipe, BaseChartDirective],
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(AdminDashboardService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly seoService = inject(SeoService);
  private readonly translocoService = inject(TranslocoService);

  readonly isLoading = signal(true);
  readonly stats = signal<DashboardStats | null>(null);
  readonly growth = signal<DashboardGrowth | null>(null);
  readonly error = signal(false);
  readonly skeletonItems = [0, 1, 2, 3];

  readonly userCards = computed<StatCard[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      {
        icon: 'person_add',
        labelKey: 'admin_dashboard_new_users_24h',
        value: s.newUsersLast24h,
      },
      {
        icon: 'people',
        labelKey: 'admin_dashboard_total_users',
        value: s.totalUsers,
      },
      {
        icon: 'trending_up',
        labelKey: 'admin_dashboard_active_7d',
        value: s.activeUsersLast7d,
      },
      {
        icon: 'trending_up',
        labelKey: 'admin_dashboard_active_30d',
        value: s.activeUsersLast30d,
      },
    ];
  });

  readonly contentCards = computed<StatCard[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      {
        icon: 'queue_music',
        labelKey: 'admin_dashboard_total_playlists',
        value: s.totalPlaylists,
      },
      {
        icon: 'album',
        labelKey: 'admin_dashboard_total_albums',
        value: s.totalAlbums,
      },
      {
        icon: 'mic',
        labelKey: 'admin_dashboard_total_artists',
        value: s.totalArtists,
      },
      {
        icon: 'music_note',
        labelKey: 'admin_dashboard_total_tracks',
        value: s.totalTracks,
      },
    ];
  });

  readonly engagementCards = computed<StatCard[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      {
        icon: 'favorite',
        labelKey: 'admin_dashboard_total_likes',
        value: s.totalLikes,
      },
      {
        icon: 'playlist_add',
        labelKey: 'admin_dashboard_playlists_created_24h',
        value: s.playlistsCreatedLast24h,
      },
      {
        icon: 'thumb_up',
        labelKey: 'admin_dashboard_likes_24h',
        value: s.likesLast24h,
      },
    ];
  });

  readonly langItems = computed<DistributionItem[]>(() => {
    const s = this.stats();
    if (!s) return [];
    const total = Object.values(s.usersByLanguage).reduce((sum, v) => sum + v, 0);
    return Object.entries(s.usersByLanguage)
      .map(([key, count]) => ({
        labelKey: LANG_LABEL_MAP[key] ?? key,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  });

  readonly darkModeItems = computed<DistributionItem[]>(() => {
    const s = this.stats();
    if (!s) return [];
    const total = Object.values(s.usersByDarkMode).reduce((sum, v) => sum + v, 0);
    return Object.entries(s.usersByDarkMode)
      .map(([key, count]) => ({
        labelKey: DARK_MODE_LABEL_MAP[key] ?? key,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  });

  readonly signupChartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const g = this.growth();
    if (!g) return { labels: [], datasets: [] };
    return {
      labels: g.signups.map(p => {
        const [, month, day] = p.date.split('-');
        return `${day}/${month}`;
      }), // "31/03"
      datasets: [
        {
          data: g.signups.map(p => p.count),
          label: this.translocoService.translate('admin_dashboard_signups_chart'),
          borderColor: '#1ac8e5',
          backgroundColor: 'rgba(26, 200, 229, 0.15)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
      ],
    };
  });

  readonly signupChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toLocaleString('fr-FR')}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 30,
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          callback: value => Number(value).toLocaleString('fr-FR'),
        },
      },
    },
  };

  ngOnInit(): void {
    this.titleService.setTitle(
      this.translocoService.translate('admin_dashboard_title') + ' - Zeffyr Music'
    );
    this.metaService.updateTag({
      name: 'description',
      content: this.translocoService.translate('admin_dashboard_title') || '',
    });
    this.seoService.updateCanonicalUrl(`${environment.URL_BASE}admin/dashboard`);
    this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(false);

    try {
      const data = await firstValueFrom(this.dashboardService.getDashboard());
      this.stats.set(data.stats);
      this.growth.set(data.growth);
    } catch {
      this.error.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  onRefresh(): void {
    this.loadDashboard();
  }
}
