import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArtistListComponent } from './artist-list.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('ArtistListComponent', () => {
    let component: ArtistListComponent;
    let fixture: ComponentFixture<ArtistListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ArtistListComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        params: of({ id_artist: '123' })
                    }
                }
            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ArtistListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display artists with anchor', () => {
        component.artists = [
            { id_artist: '1', label: 'Artist 1' },
            { id_artist: '2', label: 'Artist 2' }
        ];
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelectorAll('a').length).toEqual(2);
        expect(compiled.textContent).toContain('Artist 1');
        expect(compiled.textContent).toContain('Artist 2');
    });

    it('should display artists without anchor', () => {
        component.artists = [
            { label: 'Artist 1' },
            { label: 'Artist 2' }
        ];
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelectorAll('a').length).toEqual(0);
        expect(compiled.textContent).toContain('Artist 1');
        expect(compiled.textContent).toContain('Artist 2');
    });
});
