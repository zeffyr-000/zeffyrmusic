import { ChangeDetectionStrategy, Component, inject, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { ArtistResult } from '../models/artist.model';
import { PlaylistResult } from '../models/playlist.model';
import { Observable, of, OperatorFunction } from 'rxjs';
import {
  debounceTime,
  switchMap,
  filter,
  distinctUntilChanged,
  map,
  catchError,
} from 'rxjs/operators';
import { SearchService } from '../services/search.service';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { DefaultImageDirective } from '../directives/default-image.directive';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';

/** Unified result item for the typeahead dropdown */
export interface SearchResultItem {
  type: 'all' | 'artist' | 'album';
  label: string;
  sublabel?: string;
  imageUrl?: string;
  navigateUrl: string;
  original?: ArtistResult | PlaylistResult;
}

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslocoPipe, DefaultImageDirective, NgbTypeahead],
})
export class SearchBarComponent {
  private readonly searchService = inject(SearchService);
  private readonly router = inject(Router);
  private readonly googleAnalyticsService = inject(GoogleAnalyticsService);

  readonly query = signal('');

  @ViewChild('typeaheadInstance', { static: true }) typeaheadInstance!: NgbTypeahead;

  /** NgbTypeahead search function — returns an Observable of SearchResultItem[] */
  searchTypeahead: OperatorFunction<string, readonly SearchResultItem[]> = (
    text$: Observable<string>
  ) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(term => term.length >= 2),
      switchMap(term =>
        this.searchService.searchBar(term).pipe(
          map(data => {
            const results: SearchResultItem[] = [];

            // "All results" entry
            results.push({
              type: 'all',
              label: '',
              navigateUrl: '/search/' + term,
            });

            // Artists
            for (const artist of data.artist) {
              results.push({
                type: 'artist',
                label: artist.artiste ?? artist.artist,
                imageUrl: 'https://api.deezer.com/artist/' + artist.id_artiste_deezer + '/image',
                navigateUrl: '/artist/' + artist.id_artiste,
                original: artist,
              });
            }

            // Albums
            for (const album of data.playlist) {
              results.push({
                type: 'album',
                label: album.titre,
                sublabel: album.artiste,
                imageUrl: album.url_image,
                navigateUrl: '/playlist/' + album.id_playlist,
                original: album,
              });
            }

            return results;
          }),
          catchError(() => of([]))
        )
      )
    );

  /** Formatter for the input field — keep it clean after selection */
  inputFormatter = (): string => '';

  /** Formatter for the dropdown items — return the label text */
  resultFormatter = (item: SearchResultItem): string => item.label;

  /** Handle typeahead item selection */
  onSelect(event: { item: SearchResultItem; preventDefault: () => void }): void {
    event.preventDefault();

    const item = event.item;

    if (item.original) {
      let analyticsQuery = '';
      if ('artiste' in item.original && item.original.artiste) {
        analyticsQuery += item.original.artiste;
      }
      if ('titre' in item.original && item.original.titre) {
        if (analyticsQuery.length > 0) {
          analyticsQuery += ' ';
        }
        analyticsQuery += item.original.titre;
      }
      if (analyticsQuery.length > 0) {
        this.googleAnalyticsService.pageView('/recherche?q=' + this.query());
      }
    }

    this.query.set('');
    this.router.navigate([item.navigateUrl]);
  }

  getQuerystr(): string {
    return encodeURIComponent(this.query());
  }
}
