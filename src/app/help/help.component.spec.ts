import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpComponent } from './help.component';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('HelpComponent', () => {
  let component: HelpComponent;
  let fixture: ComponentFixture<HelpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpComponent],
      providers: [
        getTranslocoTestingProviders(),
        {
          provide: ActivatedRoute,
          useValue: {
            useValue: {
              params: of({ id_artist: '123' }),
            },
            params: of({ id_artist: '1' }),
            snapshot: {
              paramMap: {
                get: () => '1',
              },
              url: ['artist', '1'],
            },
          },
        },
      ],
    }).compileComponents();
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
