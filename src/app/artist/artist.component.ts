import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { Album } from '../models/album.model';
import { ArtistService } from '../services/artist.service';

@Component({
    selector: 'app-artist',
    templateUrl: './artist.component.html',
    styleUrls: ['./artist.component.scss']
})

export class ArtistComponent implements OnInit {

    name: string;
    idArtistDeezer: string;
    urlDeezer = '';
    idArtist: string;
    listAlbums: Album[];

    constructor(private readonly artistService: ArtistService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly titleService: Title,
        private readonly metaService: Meta,
        private readonly translocoService: TranslocoService,
        private readonly googleAnalyticsService: GoogleAnalyticsService) { }

    ngOnInit() {
        this.activatedRoute.params.subscribe(() => {
            this.initLoad();
        });
    }

    initLoad() {
        const idArtist = this.activatedRoute.snapshot.paramMap.get('id_artist');

        this.artistService.getArtist(idArtist)
            .subscribe((data: { nom: string, id_artiste_deezer: string, id_artist: string, list_albums: Album[] }) => {
                this.name = data.nom;
                this.idArtistDeezer = data.id_artiste_deezer;
                this.urlDeezer = 'https://api.deezer.com/artist/' + data.id_artiste_deezer + '/image?size=big';
                this.idArtist = data.id_artist;
                this.listAlbums = data.list_albums;

                this.titleService.setTitle(this.name + ' - Zeffyr Music');

                this.metaService.updateTag({ name: 'og:title', content: this.name + ' - Zeffyr Music' });
                this.metaService.updateTag({
                    name: 'og:description',
                    content: this.translocoService.translate('description_partage_artist', { artist: this.name })
                });
                this.metaService.updateTag({ name: 'og:image', content: this.urlDeezer });
                this.metaService.updateTag({ name: 'og:url', content: document.location.href });

                this.googleAnalyticsService.pageView(this.activatedRoute.snapshot.url.join('/'));
            });
    }

}
