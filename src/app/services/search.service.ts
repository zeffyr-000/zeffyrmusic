import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SearchBarResponse, SearchResults1, SearchResults2, SearchResults3 } from '../models/search.model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  constructor(private httpClient: HttpClient) { }

  fullSearch1(query: string): Observable<SearchResults1> {
    return this.httpClient.get<SearchResults1>(environment.URL_SERVER + 'fullsearch1/' + encodeURIComponent(query), environment.httpClientConfig);
  }

  fullSearch2(query: string): Observable<SearchResults2> {
    return this.httpClient.get<SearchResults2>(environment.URL_SERVER + 'fullsearch2/' + encodeURIComponent(query), environment.httpClientConfig);
  }

  fullSearch3(query: string): Observable<SearchResults3> {
    return this.httpClient.get<SearchResults3>(environment.URL_SERVER + 'fullsearch3/' + encodeURIComponent(query), environment.httpClientConfig);
  }

  searchBar(query: string): Observable<SearchBarResponse> {
    return this.httpClient.get<SearchBarResponse>(environment.URL_SERVER + 'recherche2?q=' + encodeURIComponent(query), environment.httpClientConfig);
  }
}