import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { environment } from '../../environments/environment';

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
    listAlbums: any[];

    constructor(private readonly httpClient: HttpClient,
                private readonly activatedRoute: ActivatedRoute,
                private readonly titleService: Title,
                private readonly metaService: Meta,
                private readonly translocoService: TranslocoService) {}

    ngOnInit() {
        this.activatedRoute.params.subscribe(() => {
            this.initLoad();
        });
    }

    initLoad() {
        const idArtist = this.activatedRoute.snapshot.paramMap.get('id_artist');

        this.httpClient.get(environment.URL_SERVER + 'json/artist/' + idArtist,
            environment.httpClientConfig)
            .subscribe((data: any) => {

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
            });
    }

}
