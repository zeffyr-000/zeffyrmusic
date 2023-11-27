import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { InitService } from './services/init.service';
import { PlayerService } from './services/player.service';
import { TranslocoTestingModule, TranslocoConfig, TRANSLOCO_CONFIG, TranslocoService } from '@ngneat/transloco';
import { BehaviorSubject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';

describe('AppComponent', () => {
    let component: AppComponent;
    let fixture: ComponentFixture<AppComponent>;
    let initServiceMock: Partial<InitService>;
    let playerServiceMock: Partial<PlayerService>;
    let translocoService: TranslocoService;
    let router: Router;

    beforeEach(async () => {
        initServiceMock = {
            getPing: jasmine.createSpy('getPing'),
            subjectMessageUnlog: new BehaviorSubject<boolean>(false),
        };

        playerServiceMock = {
            subjectMessageTap: new BehaviorSubject<boolean>(false),
        };

        await TestBed.configureTestingModule({
            imports: [
                RouterTestingModule.withRoutes([
                    { path: 'test-url', redirectTo: '' }
                ]),
                TranslocoTestingModule.forRoot({
                    langs: { en: { meta_description: 'META_DESCRIPTION', title: 'TITLE' }, fr: { meta_description: 'META_DESCRIPTION_FR', title: 'TITLE_FR' } }
                })],
            declarations: [AppComponent],
            providers: [
                { provide: InitService, useValue: initServiceMock },
                { provide: PlayerService, useValue: playerServiceMock },
                {
                    provide: TRANSLOCO_CONFIG, useValue: {
                        reRenderOnLangChange: true,
                        availableLangs: ['en', 'fr'],
                        defaultLang: 'en',
                        prodMode: false,
                    } as TranslocoConfig
                },
            ],
        }).compileComponents();

        translocoService = TestBed.inject(TranslocoService);
        translocoService.setDefaultLang('en');

    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;

        router = TestBed.inject(Router);
        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;

        fixture.detectChanges();
    });

    it('should create the app component', () => {
        expect(component).toBeTruthy();
    });

    it('should call getPing method on InitService', () => {
        expect(initServiceMock.getPing).toHaveBeenCalled();
    });

    it('should subscribe to subjectMessageUnlog on InitService', () => {
        expect(component.showMessageUnlog).toBeFalse();
        initServiceMock.subjectMessageUnlog.next(true);
        expect(component.showMessageUnlog).toBeTrue();
    });

    it('should subscribe to subjectMessageTap on PlayerService', () => {
        expect(component.showTapVideoYT).toBeFalse();
        playerServiceMock.subjectMessageTap.next(true);
        expect(component.showTapVideoYT).toBeTrue();
    });

    it('should set document lang on ngOnInit', () => {
        component.ngOnInit();
        expect(document.documentElement.lang).toBe('en');
    });

    it('should set isOnline to false when offline event is triggered', () => {
        window.dispatchEvent(new Event('offline'));
        expect(component.isOnline).toBeFalse();
    });

    it('should set isOnline to true when online event is triggered', () => {
        window.dispatchEvent(new Event('online'));
        expect(component.isOnline).toBeTrue();
    });

    it('should unsubscribe from subscriptions on ngOnDestroy', () => {
        spyOn(component.subscriptionMessageUnlog, 'unsubscribe');
        spyOn(component.subscriptionMessageTap, 'unsubscribe');
        component.ngOnDestroy();
        expect(component.subscriptionMessageUnlog.unsubscribe).toHaveBeenCalled();
        expect(component.subscriptionMessageTap.unsubscribe).toHaveBeenCalled();
    });

    it('should set canonical link on NavigationEnd', fakeAsync(() => {
        const link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);

        const setAttributeSpy = spyOn(link, 'setAttribute');
        const url = '/test-url';

        router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                tick();
                expect(setAttributeSpy).toHaveBeenCalledWith('href', location.origin + url);
            }
        });

        router.navigate([url]);
    }));
});