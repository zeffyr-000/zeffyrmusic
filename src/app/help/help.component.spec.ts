import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpComponent } from './help.component';
import { getTranslocoModule } from '../transloco-testing.module';

describe('HelpComponent', () => {
    let component: HelpComponent;
    let fixture: ComponentFixture<HelpComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HelpComponent],
            imports: [getTranslocoModule()]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HelpComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});