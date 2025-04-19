import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { HelpPageComponent } from './help-page.component';
import { getTranslocoModule } from 'src/app/transloco-testing.module';

describe('HelpPageComponent', () => {
    let component: HelpPageComponent;
    let fixture: ComponentFixture<HelpPageComponent>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let route: ActivatedRoute;
    let getSpy: jasmine.Spy;

    beforeEach(async () => {
        getSpy = jasmine.createSpy().and.returnValue('test-page');
        await TestBed.configureTestingModule({
            imports: [getTranslocoModule(), HelpPageComponent],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: getSpy } } } }
            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HelpPageComponent);
        component = fixture.componentInstance;
        route = TestBed.inject(ActivatedRoute);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set page on ngOnInit', () => {
        getSpy.and.returnValue('test-page');
        component.ngOnInit();
        expect(component.page).toEqual('test-page');
    });

    it('should set the correct title for install-android', () => {
        getSpy.and.returnValue('install-android');
        component.ngOnInit();
        expect(component.page).toEqual('install-android')
    });

    it('should set the correct title for install-ios', () => {
        getSpy.and.returnValue('install-ios');
        component.ngOnInit();
        expect(component.page).toEqual('install-ios')
    });

    it('should set the correct title for locked-screen', () => {
        getSpy.and.returnValue('locked-screen');
        component.ngOnInit();
        expect(component.page).toEqual('locked-screen')
    });

    it('should set the correct title for listen', () => {
        getSpy.and.returnValue('listen');
        component.ngOnInit();
        expect(component.page).toEqual('listen')
    });

    it('should set the correct title for legal', () => {
        getSpy.and.returnValue('legal');
        component.ngOnInit();
        expect(component.page).toEqual('legal')
    });

    it('should set the correct title for download', () => {
        getSpy.and.returnValue('download');
        component.ngOnInit();
        expect(component.page).toEqual('download')
    });

    it('should set the correct title for issues', () => {
        getSpy.and.returnValue('issues');
        component.ngOnInit();
        expect(component.page).toEqual('issues')
    });
});