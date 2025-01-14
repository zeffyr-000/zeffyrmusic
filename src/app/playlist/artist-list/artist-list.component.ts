import { Component, Input } from '@angular/core';
import { Artist } from 'src/app/models/artist.model';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-artist-list',
    templateUrl: './artist-list.component.html',
    styleUrls: ['./artist-list.component.css'],
    imports: [RouterLink]
})
export class ArtistListComponent {
  @Input() artists: Artist[];
}