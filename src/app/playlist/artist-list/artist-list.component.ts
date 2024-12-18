import { Component, Input } from '@angular/core';
import { Artist } from 'src/app/models/artist.model';

@Component({
  selector: 'app-artist-list',
  templateUrl: './artist-list.component.html',
  styleUrls: ['./artist-list.component.css'],
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false
})
export class ArtistListComponent {
  @Input() artists: Artist[];
}