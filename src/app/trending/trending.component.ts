import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../services/player.service';

@Component({
  selector: 'app-trending',
  standalone: true,
  templateUrl: './trending.component.html',
  styleUrls: ['./trending.component.scss'],
  imports: [CommonModule, RouterLink],
})
export class TrendingComponent implements OnInit {
  // Liste des titres tendance
  tracks: any[] = [];
  isLoading = false;
  favoriteCount = 0;

  constructor(
    private http: HttpClient,
    private playerService: PlayerService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    // Appel direct de l'API depuis le composant
    this.http.get<any>('/api/trending').subscribe((data: any) => {
      this.tracks = data.tab_video;
      this.isLoading = false;
      // Mémorise la date de dernière visite dans le navigateur
      localStorage.setItem('last_trending_visit', Date.now().toString());
    });
  }

  play(index: number): void {
    this.playerService.runPlaylist(this.tracks, index);
  }

  addFavorite(): void {
    this.favoriteCount = this.favoriteCount + 1;
  }
}
