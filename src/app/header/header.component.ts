import { ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbActiveModal, NgbModal, NgbModalRef, NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { environment } from 'src/environments/environment';
import { InitService } from '../services/init.service';
import { PlayerService } from '../services/player.service';
import { distinctUntilChanged, Subscription } from 'rxjs';
import { UserService } from '../services/user.service';
import { LoginResponse, UserReponse } from '../models/user.model';
import { DOCUMENT, isPlatformBrowser, NgClass } from '@angular/common';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { SwipeDownDirective } from '../directives/swipe-down.directive';
import { AngularDraggableModule } from 'angular2-draggable';
import { UserPlaylist } from '../models/playlist.model';

// eslint-disable-next-line no-var, @typescript-eslint/no-explicit-any
declare var google: any;

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    imports: [NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem, RouterLink, SearchBarComponent, SwipeDownDirective, NgbTooltip, NgClass, AngularDraggableModule, FormsModule, TranslocoPipe]
})
export class HeaderComponent implements OnInit, OnDestroy {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @ViewChild('contentModalLogin') contentModalLogin: TemplateRef<any>;
    @ViewChild('contentModalRegister') contentModalRegister: TemplateRef<unknown>;

    pingInitialized: boolean;
    isConnected: boolean;
    pseudo: string;
    mail: string;
    isRepeat: boolean;
    isRandom: boolean;
    isPlaying: boolean;
    currentTitle: string;
    currentArtist: string;
    currentKey: string;
    listPlaylist: UserPlaylist[];

    subscriptionConnected: Subscription;
    subscriptionRepeat: Subscription;
    subscriptionRandom: Subscription;
    subscriptionIsPlaying: Subscription;
    subscriptionVolume: Subscription;
    subscriptionPlayerRunning: Subscription;
    subscriptionAddVideo: Subscription;
    subscriptionChangeKey: Subscription;
    subscriptionListPlaylist: Subscription;

    valueSliderPlayer: number;
    valueSliderVolume: number;
    currentTimeStr = '0:00';
    totalTimeStr = '0:00';
    onDragingPlayer = false;

    loadVideo = 0;

    isRegistered = false;
    error = '';
    isSuccess = false;
    currentIdPlaylistEdit: string;
    playlistTitle: string;
    addKey: string;
    addArtist: string;
    addTitle: string;
    addDuration: number;
    URL_ASSETS: string;
    isPlayerExpanded = false;
    darkModeEnabled = false;

    @ViewChild('sliderPlayer', {}) sliderPlayerRef: ElementRef;
    @ViewChild('sliderVolume', {}) sliderVolumeRef: ElementRef;

    @ViewChild('contentModalAddVideo', {})
    private readonly contentModalAddVideo: TemplateRef<unknown>;
    public isBrowser: boolean;

    constructor(public activeModal: NgbActiveModal,
        private readonly modalService: NgbModal,
        private readonly initService: InitService,
        public playerService: PlayerService,
        private readonly ref: ChangeDetectorRef,
        private readonly userService: UserService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly googleAnalyticsService: GoogleAnalyticsService,
        private readonly translocoService: TranslocoService,
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document: Document,
        @Inject(PLATFORM_ID) platformId: object) {
        this.isBrowser = isPlatformBrowser(platformId);
        this.pingInitialized = false;
        this.isConnected = false;
        this.URL_ASSETS = environment.URL_ASSETS;
    }

    ngOnInit() {
        this.subscriptionConnected = this.initService.subjectConnectedChange.subscribe(data => {
            this.pingInitialized = data.pingInitialized;
            this.isConnected = data.isConnected;
            this.pseudo = data.pseudo;
            this.mail = data.mail;
            this.darkModeEnabled = data.darkModeEnabled;

            this.translocoService.setActiveLang(data.language);

            if (data.darkModeEnabled) {
                this.renderer.setAttribute(this.document.body, 'data-bs-theme', 'dark');
            } else {
                this.renderer.removeAttribute(this.document.body, 'data-bs-theme');
            }
        });

        this.subscriptionRepeat = this.playerService.subjectRepeatChange.subscribe(isRepeat => { this.isRepeat = isRepeat; }
        );

        this.subscriptionRandom = this.playerService.subjectRandomChange.subscribe(isRandom => { this.isRandom = isRandom; });

        this.subscriptionIsPlaying = this.playerService.subjectIsPlayingChange.subscribe(isPlaying => {
            this.isPlaying = isPlaying;
            this.ref.detectChanges();
        }
        );

        this.subscriptionVolume = this.playerService.subjectVolumeChange.subscribe(volume => {
            this.valueSliderVolume = volume;
            if (this.isBrowser) {
                this.sliderVolumeRef.nativeElement.style.transform = 'none';
            }
        }
        );

        this.subscriptionPlayerRunning = this.playerService.subjectPlayerRunningChange?.pipe(
            distinctUntilChanged((prev, curr) => prev && curr && prev.equals(curr))
        ).subscribe(data => {
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

        this.subscriptionListPlaylist = this.playerService.subjectListPlaylist.subscribe(data => {
            this.listPlaylist = data;
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

    onClickSliderVolume(e: { offsetX: number; }) {
        this.onUpdateVolume(e.offsetX);
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

    expandPlayer() {
        this.isPlayerExpanded = true;
    }

    collapsePlayer() {
        this.isPlayerExpanded = false;
    }

    openModal(content: TemplateRef<unknown>) {
        this.modalService.open(content, { size: 'lg' });
    }

    onSubmitRegister(form: NgForm) {
        if (form.valid) {
            this.userService.register(form.form.value)
                .subscribe((data: UserReponse) => {
                    if (data.success !== undefined && data.success) {
                        this.isRegistered = true;

                        this.googleAnalyticsService.pageView('/inscription/succes');
                    } else {
                        this.error = this.translocoService.translate(data?.error || 'generic_error');
                    }
                });
        }
    }

    onLogIn(form: NgForm, modal: NgbActiveModal, token: string) {
        if (token || form.valid) {
            this.userService.login(form?.form?.value, token)
                .subscribe((data: LoginResponse) => {
                    if (data.success !== undefined && data.success) {
                        this.isConnected = true;

                        this.initService.loginSuccess(data.pseudo, data.id_perso, data.mail, data.dark_mode_enabled, data.language);

                        this.mail = data.mail;

                        this.playerService.onLoadListLogin(data.liste_playlist, data.liste_suivi, data.like_video);

                        if (modal) {
                            modal.dismiss('');
                        } else {
                            this.modalService.dismissAll();
                        }
                    } else {
                        this.error = this.translocoService.translate(data?.error || 'generic_error');
                    }
                });
        }
    }

    onLogout() {
        this.userService.logout()
            .subscribe((data: UserReponse) => {
                if (data.success !== undefined && data.success) {
                    this.initService.logOut();
                    const url = this.router.url;
                    const urlProtected = this.router.config?.filter(route => route.canActivate !== undefined).map(route => route.path);
                    if (urlProtected?.includes(url.split('/')[1])) {
                        this.router.navigate(['/']);
                    }
                }
            });
    }

    onSubmitResetPass(form: NgForm) {
        if (form.valid) {
            this.userService.resetPass(form.form.value)
                .subscribe((data: UserReponse) => {
                    if (data.success !== undefined && data.success) {
                        this.isSuccess = true;
                    } else {
                        this.error = this.translocoService.translate(data?.error || 'generic_error');
                    }
                });
        }
    }

    onAddVideo(idPlaylist: string, modal: NgbActiveModal) {
        this.playerService.addVideoInPlaylistRequest(idPlaylist, this.addKey, this.addTitle, this.addArtist, this.addDuration);
        modal.dismiss();
    }

    openModalLogin() {
        const modalRef: NgbModalRef = this.modalService.open(this.contentModalLogin, { size: 'lg' });
        modalRef.result.then(
            () => this.renderGoogleSignInButton(),
            () => this.renderGoogleSignInButton()
        );

        setTimeout(() => {
            this.renderGoogleSignInButton();
        }, 0);
    }

    renderGoogleSignInButton() {
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            google.accounts.id.initialize({
                client_id: environment.GOOGLE_CLIENT_ID,
                callback: this.handleCredentialResponse.bind(this)
            });
            google.accounts.id.renderButton(
                document.getElementById('google-signin-button-header'),
                {}
            );
        }
    }

    handleCredentialResponse(response: { credential: string }) {
        this.onLogIn(null, null, response.credential);
    }

    renderGoogleRegisterButton() {
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            google.accounts.id.initialize({
                client_id: environment.GOOGLE_CLIENT_ID,
                callback: this.handleCredentialResponse.bind(this)
            });
            google.accounts.id.renderButton(
                document.getElementById('google-register-button-header'),
                {}
            );
        }
    }

    openModalRegister() {
        const modalRef: NgbModalRef = this.modalService.open(this.contentModalRegister, { size: 'lg' });
        modalRef.result.then(
            () => this.renderGoogleRegisterButton(),
            () => this.renderGoogleRegisterButton()
        );

        setTimeout(() => {
            this.renderGoogleRegisterButton();
        }, 0);
    }

    ngOnDestroy() {
        this.subscriptionConnected.unsubscribe();
        this.subscriptionRepeat.unsubscribe();
        this.subscriptionRandom.unsubscribe();
        this.subscriptionIsPlaying.unsubscribe();
        this.subscriptionVolume.unsubscribe();
        this.subscriptionPlayerRunning.unsubscribe();
        this.subscriptionChangeKey.unsubscribe();
        this.subscriptionListPlaylist.unsubscribe();
    }
}
