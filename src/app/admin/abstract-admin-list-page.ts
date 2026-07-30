import { Directive, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { Observable, firstValueFrom } from 'rxjs';
import { SeoService } from '../services/seo.service';
import { environment } from '../../environments/environment';

/**
 * Shared logic for admin list pages (duplicate albums / artists, reports):
 * SEO setup, loading/error state and data fetching. Subclasses only provide
 * the translation key, canonical path and the service call.
 */
@Directive()
export abstract class AbstractAdminListPage<T> implements OnInit {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly seoService = inject(SeoService);
  private readonly translocoService = inject(TranslocoService);

  readonly isLoading = signal(true);
  readonly error = signal(false);
  readonly items = signal<T[]>([]);

  /** Translation key of the page title (also used as meta description). */
  protected abstract readonly titleKey: string;
  /** Canonical path appended to URL_BASE, e.g. 'admin/duplicate-albums'. */
  protected abstract readonly canonicalPath: string;
  /** Fetches the list items from the relevant admin service. */
  protected abstract fetchItems(): Observable<T[]>;

  ngOnInit(): void {
    const title = this.translocoService.translate(this.titleKey);
    this.titleService.setTitle(title + ' - Zeffyr Music');
    this.metaService.updateTag({ name: 'description', content: title || '' });
    this.seoService.updateCanonicalUrl(`${environment.URL_BASE}${this.canonicalPath}`);
    this.load();
  }

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(false);

    try {
      this.items.set(await firstValueFrom(this.fetchItems()));
    } catch {
      this.error.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  onRefresh(): void {
    this.load();
  }
}
