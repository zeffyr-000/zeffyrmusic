import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { Album } from '../models/album.model';
import { ArtistService } from '../services/artist.service';
import { ShareButtons } from 'ngx-sharebuttons/buttons';
import { DefaultImageDirective } from '../directives/default-image.directive';
import { isPlatformBrowser } from '@angular/common';

@Component({
    selector: 'app-artist',
    templateUrl: './artist.component.html',
    styleUrls: ['./artist.component.scss'],
    imports: [ShareButtons, RouterLink, DefaultImageDirective, TranslocoPipe]
})

export class ArtistComponent implements OnInit {

    name: string;
    idArtistDeezer: string;
    urlDeezer = '';
    idArtist: string;
    listAlbums: Album[];
    isAvailable: boolean | undefined;
    isBrowser: boolean;

    constructor(private readonly artistService: ArtistService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly titleService: Title,
        private readonly metaService: Meta,
        private readonly translocoService: TranslocoService,
        private readonly googleAnalyticsService: GoogleAnalyticsService,
        @Inject(PLATFORM_ID) platformId: object) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    ngOnInit() {
        this.activatedRoute.params.subscribe(() => {
            this.initLoad();
        });
    }

    initLoad() {
        const idArtist = this.activatedRoute.snapshot.paramMap.get('id_artist');

        this.artistService.getArtist(idArtist)
            .subscribe((data: { nom: string, id_artiste_deezer: string, id_artist: string, list_albums: Album[] }) => {
                if (data.nom) {
                    this.isAvailable = true;
                    this.name = data.nom;
                    this.idArtistDeezer = data.id_artiste_deezer;
                    this.urlDeezer = 'https://api.deezer.com/artist/' + data.id_artiste_deezer + '/image?size=big';
                    this.idArtist = data.id_artist;
                    this.listAlbums = data.list_albums;

                    this.titleService.setTitle(this.name + ' - Zeffyr Music');
                    this.titleService.setTitle(this.translocoService.translate('title_artist', { artist: this.name }));

                    this.metaService.updateTag({ name: 'og:title', content: this.translocoService.translate('title_artist', { artist: this.name }) });
                    this.metaService.updateTag({
                        name: 'og:description',
                        content: this.translocoService.translate('description_partage_artist', { artist: this.name })
                    });
                    this.metaService.updateTag({ name: 'og:image', content: this.urlDeezer });
                    if (this.isBrowser) {
                        this.metaService.updateTag({ name: 'og:url', content: document.location.href });
                    }
                    this.metaService.updateTag({ name: 'description', content: this.translocoService.translate('description_artist', { artist: this.name, count: this.listAlbums.length }) });
                }
                else {
                    this.isAvailable = false;
                }

                this.googleAnalyticsService.pageView(this.activatedRoute.snapshot.url.join('/'));
            });
    }

}
