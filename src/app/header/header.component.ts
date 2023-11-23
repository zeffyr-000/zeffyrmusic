import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoService } from '@ngneat/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { environment } from 'src/environments/environment';
import { InitService } from '../services/init.service';
import { PlayerService } from '../services/player.service';
import { Subscription } from 'rxjs';
import { UserPlaylist } from '../models/playlist.model';
import { FollowItem } from '../models/follow.model';

interface LoginResponse {
    success: boolean;
    pseudo: string;
    id_perso: string;
    mail: string;
    liste_playlist: UserPlaylist[];
    liste_suivi: FollowItem[];
    error?: string;
}

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {

    isConnected: boolean;
    pseudo: string;
    mail: string;
    isRepeat: boolean;
    isRandom: boolean;
    isPlaying: boolean;
    currentTitle: string;
    currentArtist: string;
    currentKey: string;

    subscriptionConnected: Subscription;
    subscriptionRepeat: Subscription;
    subscriptionRandom: Subscription;
    subscriptionIsPlaying: Subscription;
    subscriptionVolume: Subscription;
    subscriptionPlayerRunning: Subscription;
    subscriptionListPlaylist: Subscription;
    subscriptionListFollow: Subscription;
    subscriptionAddVideo: Subscription;
    subscriptionChangeKey: Subscription;

    valueSliderPlayer: number;
    valueSliderVolume: number;
    currentTimeStr = '0:00';
    totalTimeStr = '0:00';
    onDragingPlayer = false;

    loadVideo = 0;

    isRegistered = false;
    error = '';
    isSuccess = false;
    langs = ['fr', 'en'];
    successPass = false;
    successMail = false;
    currentIdPlaylistEdit: string;
    playlistTitle: string;
    addKey: string;
    addArtist: string;
    addTitle: string;
    addDuration: number;
    URL_ASSETS: string;

    listPlaylist: UserPlaylist[];
    listFollow: FollowItem[];

    @ViewChild('sliderPlayer', {}) sliderPlayerRef: ElementRef;
    @ViewChild('sliderVolume', {}) sliderVolumeRef: ElementRef;

    @ViewChild('contentModalAddVideo', {})
    private readonly contentModalAddVideo: TemplateRef<unknown>;

    constructor(public activeModal: NgbActiveModal,
        private readonly modalService: NgbModal,
        private readonly initService: InitService,
        public playerService: PlayerService,
        private readonly ref: ChangeDetectorRef,
        private readonly httpClient: HttpClient,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly googleAnalyticsService: GoogleAnalyticsService,
        private readonly translocoService: TranslocoService) {
        this.isConnected = false;
        this.URL_ASSETS = environment.URL_ASSETS;
    }

    ngOnInit() {
        this.subscriptionConnected = this.initService.subjectConnectedChange.subscribe(data => {
            this.isConnected = data.isConnected;
            this.pseudo = data.pseudo;
            this.mail = data.mail;
        });

        this.subscriptionRepeat = this.playerService.subjectRepeatChange.subscribe(isRepeat => { this.isRepeat = isRepeat; }
        );

        this.subscriptionRandom = this.playerService.subjectRandomChange.subscribe(isRandom => { this.isRandom = isRandom; }
        );

        this.subscriptionIsPlaying = this.playerService.subjectIsPlayingChange.subscribe(isPlaying => {
            this.isPlaying = isPlaying;
            this.ref.detectChanges();
        }
        );

        this.subscriptionVolume = this.playerService.subjectVolumeChange.subscribe(volume => {
            this.valueSliderVolume = volume;
            this.sliderVolumeRef.nativeElement.style.transform = 'none';
        }
        );

        this.subscriptionPlayerRunning = this.playerService.subjectPlayerRunningChange.subscribe(data => {

            if (!data) {
                return;
            }

            if (!this.onDragingPlayer) {
                this.valueSliderPlayer = data.slideLength;
                this.currentTimeStr = data.currentTimeStr;
                this.totalTimeStr = data.totalTimeStr;
                this.loadVideo = data.loadVideo;

                this.ref.detectChanges();
            }
        }
        );

        this.subscriptionListPlaylist = this.playerService.subjectListPlaylist.subscribe(data => {
            this.listPlaylist = data;
        });

        this.subscriptionListFollow = this.playerService.subjectListFollow.subscribe(data => {
            this.listFollow = data;
        });

        this.subscriptionAddVideo = this.playerService.subjectAddVideo.subscribe(data => {
            this.addKey = data.key;
            this.addArtist = data.artist;
            this.addTitle = data.title;
            this.addDuration = data.duration;

            this.openModal(this.contentModalAddVideo);
        });

        this.subscriptionChangeKey = this.playerService.subjectCurrentKeyChange.subscribe(data => {
            this.currentTitle = data.currentTitle;
            this.currentArtist = data.currentArtist;
            this.currentKey = data.currentKey;
        });
    }

    goFullscreen(id: string) {
        const el = document.getElementById(id);
        el.requestFullscreen();
    }

    repeat() {
        this.playerService.switchRepeat();
    }

    random() {
        this.playerService.switchRandom();
    }

    onDragMovingPlayer(e: { x: number; }) {
        this.onDragingPlayer = true;
        this.onUpdateSliderPlayer(e.x);
        this.sliderPlayerRef.nativeElement.style.left = 'auto';
    }

    onDragEndPlayer(e: { x: number; }) {
        this.onDragingPlayer = false;
        this.onUpdateSliderPlayer(e.x);
        this.sliderPlayerRef.nativeElement.style.transform = 'none';
    }

    onClickSliderPlayer(e: { offsetX: number; }) {
        this.onUpdateSliderPlayer(e.offsetX);
        this.sliderPlayerRef.nativeElement.style.transform = 'none';
    }

    onUpdateSliderPlayer(value: number) {
        const size = this.sliderPlayerRef.nativeElement.parentNode.offsetWidth;
        if (value < 0) {
            value = 0;
        }

        if (value > size) {
            value = size;
        }

        const position = value / size;
        this.playerService.updatePositionSlider(position);
    }

    onDragMovingVolume(e: { x: number; }) {
        this.playerService.player.setVolume(e.x);
        this.sliderVolumeRef.nativeElement.style.left = 'auto';
    }

    onDragEndVolume(e: { x: number; }) {
        this.onUpdateVolume(e.x);
        this.sliderVolumeRef.nativeElement.style.transform = 'none';
    }

    onClickSliderVolume(e: { x: number; }) {
        this.onUpdateVolume(e.x);
        this.sliderVolumeRef.nativeElement.style.transform = 'none';
    }

    onUpdateVolume(value: number) {
        const size = this.sliderVolumeRef.nativeElement.parentNode.offsetWidth;
        if (value < 0) {
            value = 0;
        }

        if (value > size) {
            value = size;
        }

        const volume = Math.round(100 * value / size);

        this.playerService.updateVolume(volume);
        this.valueSliderVolume = volume;
    }

    onPlayPause() {
        this.playerService.onPlayPause();
    }

    onBefore() {
        this.playerService.before();
    }

    onAfter() {
        this.playerService.after();
    }

    openModal(content: TemplateRef<unknown>) {
        this.modalService.open(content, { size: 'lg' });
    }

    onSubmitRegister(form: NgForm) {
        if (form.valid) {
            this.httpClient.post(environment.URL_SERVER + 'inscription',
                form.form.value,
                environment.httpClientConfig)
                .subscribe((data: { success: boolean, error: string }) => {
                    if (data.success !== undefined && data.success) {
                        this.isRegistered = true;

                        this.googleAnalyticsService.pageView('/inscription/succes');
                    } else {
                        this.error = this.translocoService.translate(data.error);
                    }
                });
        }
    }

    onLogIn(form: NgForm, modal: NgbActiveModal) {
        if (form.valid) {
            this.httpClient.post(environment.URL_SERVER + 'login',
                form.form.value,
                environment.httpClientConfig)
                .subscribe((data: LoginResponse) => {
                    if (data.success !== undefined && data.success) {
                        this.isConnected = true;

                        this.initService.loginSuccess(data.pseudo, data.id_perso);

                        this.mail = data.mail;

                        this.playerService.onLoadListLogin(data.liste_playlist, data.liste_suivi);

                        modal.dismiss('');
                    } else {
                        this.error = this.translocoService.translate(data.error);
                    }
                });
        }
    }

    onLogout() {
        this.httpClient.get(environment.URL_SERVER + 'deconnexion',
            environment.httpClientConfig)
            .subscribe((data: { success: boolean }) => {
                if (data.success !== undefined && data.success) {
                    this.initService.logOut();
                }
            });
    }

    onSumbitResetPass(form: NgForm) {
        if (form.valid) {
            this.httpClient.post(environment.URL_SERVER + 'pass',
                form.form.value,
                environment.httpClientConfig)
                .subscribe((data: { success: boolean, error: string }) => {
                    if (data.success !== undefined && data.success) {
                        this.isSuccess = true;
                    } else {
                        this.error = this.translocoService.translate(data.error);
                    }
                });
        }
    }

    onSubmitEditPass(form: NgForm) {
        if (form.valid) {
            if (form.form.value.password1 === form.form.value.password2) {

                this.httpClient.post(environment.URL_SERVER + 'options/passe',
                    {
                        passwordold: form.form.value.passwordold,
                        passwordnew: form.form.value.password1
                    },
                    environment.httpClientConfig)
                    .subscribe({
                        next: (data: { success: boolean, error: string }) => {
                            if (data.success !== undefined && data.success) {
                                this.successPass = true;
                                setTimeout(() => {
                                    this.successPass = false;
                                }, 10000);
                            } else {
                                this.error = this.translocoService.translate(data.error);
                            }
                        },
                        error: () => {
                            this.isConnected = false;
                            this.initService.onMessageUnlog();
                        }
                    });
            } else {
                this.error = this.translocoService.translate('mot_de_passe_confirmer_invalide');
            }
        }
    }

    onSubmitEditMail(form: NgForm) {
        if (form.valid) {
            this.httpClient.post(environment.URL_SERVER + 'options/mail',
                form.form.value,
                environment.httpClientConfig)
                .subscribe({
                    next: (data: { success: boolean, error: string }) => {
                        if (data.success !== undefined && data.success) {
                            this.successMail = true;
                            setTimeout(() => {
                                this.successMail = false;
                            }, 10000);
                        } else {
                            this.error = this.translocoService.translate(data.error);
                        }
                    },
                    error: () => {
                        this.isConnected = false;
                        this.initService.onMessageUnlog();
                    }
                });
        }
    }

    onCreatePlaylist(form: NgForm) {
        if (form.valid) {
            this.httpClient.post(environment.URL_SERVER + 'playlist-creer',
                form.form.value,
                environment.httpClientConfig)
                .subscribe({
                    next: (data: { success: boolean, id_playlist: string, titre: string, error: string }) => {
                        if (data.success !== undefined && data.success) {
                            this.playerService.addNewPlaylist(data.id_playlist, data.titre);
                        } else {
                            this.error = this.translocoService.translate(data.error);
                        }
                    },
                    error: () => {
                        this.isConnected = false;
                        this.initService.onMessageUnlog();
                    }
                });
        }
    }

    onCloseModalPlaylists(idPlaylist: string, modal: NgbActiveModal) {
        modal.dismiss();
        this.router.navigate(['/playlist', idPlaylist], { relativeTo: this.route });
    }

    onSwitchVisibility(idPlaylist: string, isPrivate: string) {
        this.playerService.switchVisibilityPlaylist(idPlaylist, isPrivate === 'prive');
    }

    onConfirmEditTitlePlaylist(idPlaylist: string, title: string, contentModalConfirmEditTitle: TemplateRef<unknown>) {
        this.modalService.open(contentModalConfirmEditTitle);
        this.currentIdPlaylistEdit = idPlaylist;
        this.playlistTitle = title;
    }

    onEditTitlePlaylist(form: NgForm, modal: NgbActiveModal) {
        if (form.valid) {
            this.httpClient.post(environment.URL_SERVER + 'edit_title',
                {
                    id_playlist: this.currentIdPlaylistEdit,
                    titre: form.form.value.playlist_titre
                },
                environment.httpClientConfig)
                .subscribe({
                    next: (data: { success: boolean, error: string }) => {
                        if (data.success !== undefined && data.success) {
                            this.playerService.editPlaylistTitle(this.currentIdPlaylistEdit, form.form.value.playlist_titre);
                            modal.dismiss();
                        } else {
                            this.error = this.translocoService.translate(data.error);
                        }
                    },
                    error: () => {
                        this.isConnected = false;
                        this.initService.onMessageUnlog();
                    }
                });
        }
    }

    onConfirmDeletePlaylist(idPlaylist: string, contentModalConfirmDeletePlaylist: TemplateRef<unknown>) {
        this.modalService.open(contentModalConfirmDeletePlaylist);
        this.currentIdPlaylistEdit = idPlaylist;
    }

    onDeletePlaylist(modal: NgbActiveModal) {
        this.playerService.deletePlaylist(this.currentIdPlaylistEdit);
        modal.dismiss();
    }

    onDeleteFollow(idPlaylist: string) {
        this.playerService.deleteFollow(idPlaylist);
    }

    onAddVideo(idPlaylist: string, modal: NgbActiveModal) {
        this.playerService.addVideoInPlaylistRequest(idPlaylist, this.addKey, this.addTitle, this.addArtist, this.addDuration);
        modal.dismiss();
    }

    ngOnDestroy() {
        this.subscriptionConnected.unsubscribe();
        this.subscriptionRepeat.unsubscribe();
        this.subscriptionRandom.unsubscribe();
        this.subscriptionIsPlaying.unsubscribe();
        this.subscriptionVolume.unsubscribe();
        this.subscriptionPlayerRunning.unsubscribe();
        this.subscriptionListPlaylist.unsubscribe();
        this.subscriptionListFollow.unsubscribe();
        this.subscriptionChangeKey.unsubscribe();
    }
}
