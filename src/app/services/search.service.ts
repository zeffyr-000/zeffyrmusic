import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, makeStateKey, TransferState, inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { SearchBarResponse, SearchResults1, SearchResults2, SearchResults3 } from '../models/search.model';
import { isPlatformServer } from '@angular/common';

const SEARCH1_KEY = (query: string) => makeStateKey<SearchResults1>(`search1-${query}`);

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private platformId = inject(PLATFORM_ID);
  private httpClient = inject(HttpClient);
  private transferState = inject(TransferState);


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

    return this.httpClient.get<SearchResults2>(environment.URL_SERVER + 'fullsearch2/' + encodeURIComponent(query));
  }

  fullSearch3(query: string): Observable<SearchResults3> {
    if (isPlatformServer(this.platformId)) {
      return of({ tab_extra: [] });
    }
    return this.httpClient.get<SearchResults3>(environment.URL_SERVER + 'fullsearch3/' + encodeURIComponent(query));
  }

  searchBar(query: string): Observable<SearchBarResponse> {
    return this.httpClient.get<SearchBarResponse>(environment.URL_SERVER + 'recherche2?q=' + encodeURIComponent(query));
  }
}