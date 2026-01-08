import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  PLATFORM_ID,
  Renderer2,
  TemplateRef,
  ViewChild,
  DOCUMENT,
  inject,
  effect,
} from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalRef,
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownItem,
  NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { environment } from 'src/environments/environment';
import { InitService } from '../services/init.service';
import { PlayerService } from '../services/player.service';
import { UserLibraryService } from '../services/user-library.service';
import { AuthStore, UserDataStore, PlayerStore, QueueStore, UiStore } from '../store';
import { UserService } from '../services/user.service';
import { LoginResponse, UserReponse } from '../models/user.model';
import { isPlatformBrowser } from '@angular/common';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { SwipeDownDirective } from '../directives/swipe-down.directive';
import { AngularDraggableModule } from 'angular2-draggable';
import '../models/google-identity.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    RouterLink,
    SearchBarComponent,
    SwipeDownDirective,
    NgbTooltip,
    FormsModule,
    TranslocoPipe,
    AngularDraggableModule,
  ],
})
export class HeaderComponent {
  activeModal = inject(NgbActiveModal);
  private readonly modalService = inject(NgbModal);
  private readonly initService = inject(InitService);
  readonly authStore = inject(AuthStore);
  readonly userDataStore = inject(UserDataStore);
  readonly playerStore = inject(PlayerStore);
  readonly queueStore = inject(QueueStore);
  readonly uiStore = inject(UiStore);
  playerService = inject(PlayerService);
  readonly userLibraryService = inject(UserLibraryService);
  private readonly ref = inject(ChangeDetectorRef);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly googleAnalyticsService = inject(GoogleAnalyticsService);
  private readonly translocoService = inject(TranslocoService);
  private renderer = inject(Renderer2);
  private document = inject<Document>(DOCUMENT);

  @ViewChild('contentModalLogin') contentModalLogin: TemplateRef<unknown>;
  @ViewChild('contentModalRegister') contentModalRegister: TemplateRef<unknown>;
  @ViewChild('sliderPlayer', {}) sliderPlayerRef: ElementRef;
  @ViewChild('sliderVolume', {}) sliderVolumeRef: ElementRef;
  @ViewChild('contentModalAddVideo', {})
  private readonly contentModalAddVideo: TemplateRef<unknown>;

  onDragingPlayer = false;
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

  public isBrowser: boolean;

  constructor() {
    const platformId = inject(PLATFORM_ID);

    this.isBrowser = isPlatformBrowser(platformId);
    this.URL_ASSETS = environment.URL_ASSETS;

    effect(() => {
      const data = this.uiStore.addVideoData();
      if (data) {
        this.addKey = data.key;
        this.addArtist = data.artist;
        this.addTitle = data.title;
        this.addDuration = data.duration;

        this.openModal(this.contentModalAddVideo);
      }
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

  onDragMovingPlayer(e: { x: number }) {
    this.onDragingPlayer = true;
    this.onUpdateSliderPlayer(e.x);
    if (this.sliderPlayerRef?.nativeElement) {
      this.sliderPlayerRef.nativeElement.style.left = 'auto';
    }
  }

  onDragEndPlayer(e: { x: number }) {
    this.onDragingPlayer = false;
    this.onUpdateSliderPlayer(e.x);
    if (this.sliderPlayerRef?.nativeElement) {
      this.sliderPlayerRef.nativeElement.style.transform = 'none';
    }
  }

  onClickSliderPlayer(e: { offsetX: number }) {
    this.onUpdateSliderPlayer(e.offsetX);
    if (this.sliderPlayerRef?.nativeElement) {
      this.sliderPlayerRef.nativeElement.style.transform = 'none';
    }
  }

  onUpdateSliderPlayer(value: number) {
    // Guard: sliderPlayerRef can be null during SSR or before AfterViewInit
    if (!this.sliderPlayerRef?.nativeElement) {
      return;
    }
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

  onDragMovingVolume(e: { x: number }) {
    this.playerService.updateVolume(e.x);
    if (this.sliderVolumeRef?.nativeElement) {
      this.sliderVolumeRef.nativeElement.style.left = 'auto';
    }
  }

  onDragEndVolume(e: { x: number }) {
    this.onUpdateVolume(e.x);
    if (this.sliderVolumeRef?.nativeElement) {
      this.sliderVolumeRef.nativeElement.style.transform = 'none';
    }
  }

  onClickSliderVolume(e: { offsetX: number }) {
    this.onUpdateVolume(e.offsetX);
    if (this.sliderVolumeRef?.nativeElement) {
      this.sliderVolumeRef.nativeElement.style.transform = 'none';
    }
  }

  onUpdateVolume(value: number) {
    // Guard: sliderVolumeRef can be null during SSR or before AfterViewInit
    if (!this.sliderVolumeRef?.nativeElement) {
      return;
    }
    const size = this.sliderVolumeRef.nativeElement.parentNode.offsetWidth;
    if (value < 0) {
      value = 0;
    }

    if (value > size) {
      value = size;
    }

    const volume = Math.round((100 * value) / size);

    this.playerService.updateVolume(volume);
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

  dismissAndOpenModal(modal: NgbModalRef, content: TemplateRef<unknown>) {
    modal.dismiss('');
    this.openModal(content);
  }

  dismissAndOpenLogin(modal: NgbModalRef) {
    modal.dismiss('');
    this.openModalLogin();
  }

  onSubmitRegister(form: NgForm) {
    if (form.valid) {
      this.userService.register(form.form.value).subscribe((data: UserReponse) => {
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
      this.userService.login(form?.form?.value, token).subscribe((data: LoginResponse) => {
        if (data.success !== undefined && data.success) {
          // Login via AuthStore
          this.authStore.login(
            { pseudo: data.pseudo, idPerso: data.id_perso, mail: data.mail },
            {
              darkModeEnabled: data.dark_mode_enabled,
              language: data.language as 'fr' | 'en',
            }
          );

          // Keep InitService.loginSuccess for compatibility
          this.initService.loginSuccess(
            data.pseudo,
            data.id_perso,
            data.mail,
            data.dark_mode_enabled,
            data.language
          );

          this.playerService.onLoadListLogin(
            data.liste_playlist,
            data.liste_suivi,
            data.like_video
          );

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
    this.userService.logout().subscribe((data: UserReponse) => {
      if (data.success !== undefined && data.success) {
        // Logout via AuthStore
        this.authStore.logout();

        // Keep InitService.logOut for compatibility
        this.initService.logOut();

        const url = this.router.url;
        const urlProtected = this.router.config
          ?.filter(route => route.canActivate !== undefined)
          .map(route => route.path);
        if (urlProtected?.includes(url.split('/')[1])) {
          this.router.navigate(['/']);
        }
      }
    });
  }

  onSubmitResetPass(form: NgForm) {
    if (form.valid) {
      this.userService.resetPass(form.form.value).subscribe((data: UserReponse) => {
        if (data.success !== undefined && data.success) {
          this.isSuccess = true;
        } else {
          this.error = this.translocoService.translate(data?.error || 'generic_error');
        }
      });
    }
  }

  onAddVideo(idPlaylist: string, modal: NgbActiveModal) {
    this.playerService.addVideoInPlaylistRequest(
      idPlaylist,
      this.addKey,
      this.addTitle,
      this.addArtist,
      this.addDuration
    );
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
        callback: this.handleCredentialResponse.bind(this),
      });
      google.accounts.id.renderButton(document.getElementById('google-signin-button-header')!, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
      });
    }
  }

  handleCredentialResponse(response: { credential: string }) {
    this.onLogIn(null, null, response.credential);
  }

  renderGoogleRegisterButton() {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: environment.GOOGLE_CLIENT_ID,
        callback: this.handleCredentialResponse.bind(this),
      });
      google.accounts.id.renderButton(document.getElementById('google-register-button-header')!, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
      });
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
}
