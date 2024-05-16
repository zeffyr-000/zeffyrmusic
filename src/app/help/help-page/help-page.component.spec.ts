import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { HelpPageComponent } from './help-page.component';

describe('HelpPageComponent', () => {
    let component: HelpPageComponent;
    let fixture: ComponentFixture<HelpPageComponent>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let route: ActivatedRoute;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HelpPageComponent],
            imports: [TranslocoModule],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'test-page' } } } }
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
        component.ngOnInit();
        expect(component.page).toEqual('test-page');
    });
});