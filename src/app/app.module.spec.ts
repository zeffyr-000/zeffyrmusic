import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { InitService } from './services/init.service';
import { PlayerService } from './services/player.service';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { NO_ERRORS_SCHEMA, NgZone } from '@angular/core';
import { getTranslocoModule } from './transloco-testing.module';

describe('AppComponent', () => {
    let component: AppComponent;
    let fixture: ComponentFixture<AppComponent>;
    let initServiceMock: Partial<InitService>;
    let playerServiceMock: Partial<PlayerService>;
    let translocoService: TranslocoService;
    let router: Router;
    let ngZone: NgZone;

    beforeEach(async () => {
        initServiceMock = {
            getPing: jasmine.createSpy('getPing'),
            subjectMessageUnlog: new BehaviorSubject<boolean>(false),
        };

        playerServiceMock = jasmine.createSpyObj('PlayerService', ['currentIdTopCharts', 'currentIdPlaylist']);

        await TestBed.configureTestingModule({
            imports: [
                RouterTestingModule.withRoutes([
                    { path: 'test-url', redirectTo: '' }
                ]),
                getTranslocoModule(),
            ],
            declarations: [AppComponent],
            providers: [
                { provide: InitService, useValue: initServiceMock },
                { provide: PlayerService, useValue: playerServiceMock },
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();

        translocoService = TestBed.inject(TranslocoService);
        translocoService.setDefaultLang('en');

    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;

        router = TestBed.inject(Router);
        ngZone = TestBed.inject(NgZone);
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
        component.ngOnDestroy();
        expect(component.subscriptionMessageUnlog.unsubscribe).toHaveBeenCalled();
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

        ngZone.run(() => {
            router.navigate([url]);
        });
    }));

    it('should return true if currentUrl matches the targetUrl for top charts', () => {
        component['playerService'].currentIdTopCharts = '123';
        component.currentUrl = '/top/123';

        const result = component.isRedirectingToCurrentUrl();

        expect(result).toBe(true);
    });

    it('should return false if currentUrl does not match the targetUrl for top charts', () => {
        component['playerService'].currentIdTopCharts = '123';
        component.currentUrl = '/top/456';

        const result = component.isRedirectingToCurrentUrl();

        expect(result).toBe(false);
    });

    it('should return true if currentUrl matches the targetUrl for playlist', () => {
        component['playerService'].currentIdTopCharts = null;
        component['playerService'].currentIdPlaylist = '456';
        component.currentUrl = '/playlist/456';

        const result = component.isRedirectingToCurrentUrl();

        expect(result).toBe(true);
    });

    it('should return false if currentUrl does not match the targetUrl for playlist', () => {
        component['playerService'].currentIdTopCharts = null;
        component['playerService'].currentIdPlaylist = '456';
        component.currentUrl = '/playlist/789';

        const result = component.isRedirectingToCurrentUrl();

        expect(result).toBe(false);
    });

    it('should return false if neither currentIdTopCharts nor currentIdPlaylist are defined', () => {
        component['playerService'].currentIdTopCharts = null;
        component['playerService'].currentIdPlaylist = null;
        component.currentUrl = '/some/other/url';

        const result = component.isRedirectingToCurrentUrl();

        expect(result).toBe(false);
    });
});