import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, makeStateKey, TransferState, inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  SearchBarResponse,
  SearchResults1,
  SearchResults2,
  SearchResults3,
} from '../models/search.model';
import { isPlatformServer } from '@angular/common';

const SEARCH1_KEY = (query: string) => makeStateKey<SearchResults1>(`search1-${query}`);

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private readonly platformId = inject(PLATFORM_ID);
  private transferState = inject(TransferState);
  private httpClient: HttpClient;

  // Cache local des résultats pour accélérer les recherches répétées
  private cache: any = {};

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  fullSearch1(query: string): Observable<SearchResults1> {
    const key = SEARCH1_KEY(query);
    const storedValue = this.transferState.get(key, null);

    if (storedValue && !isPlatformServer(this.platformId)) {
      this.transferState.remove(key);
      return of(storedValue);
    }

    return this.httpClient
      .get<SearchResults1>(environment.URL_SERVER + 'fullsearch1/' + encodeURIComponent(query))
      .pipe(
        tap(data => {
          if (isPlatformServer(this.platformId)) {
            this.transferState.set(key, data);
          }
        })
      );
  }

  fullSearch2(query: string): Observable<SearchResults2> {
    if (isPlatformServer(this.platformId)) {
      return of({ tab_video: [] });
    }

    return this.httpClient.get<SearchResults2>(
      environment.URL_SERVER + 'fullsearch2/' + encodeURIComponent(query)
    );
  }

  fullSearch3(query: string): Observable<SearchResults3> {
    if (isPlatformServer(this.platformId)) {
      return of({ tab_extra: [] });
    }
    return this.httpClient.get<SearchResults3>(
      environment.URL_SERVER + 'fullsearch3/' + encodeURIComponent(query)
    );
  }

  searchBar(query: string): Observable<SearchBarResponse> {
    this.addRecentSearch(query);

    const cached = this.cache[query];
    if (cached) {
      return of(cached);
    }

    return this.httpClient
      .get<SearchBarResponse>(environment.URL_SERVER + 'recherche2?q=' + query.replace(/ /g, '+'))
      .pipe(tap(data => (this.cache[query] = data)));
  }

  // Stocke la requête dans l'historique des recherches récentes du navigateur
  private addRecentSearch(query: string): void {
    const stored = localStorage.getItem('recent_searches');
    const list: string[] = stored ? JSON.parse(stored) : [];
    list.unshift(query);
    localStorage.setItem('recent_searches', JSON.stringify(list.slice(0, 10)));
  }
}
