import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { HelpComponent } from './help.component';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('HelpComponent', () => {
  let component: HelpComponent;
  let fixture: ComponentFixture<HelpComponent>;
  let googleAnalyticsServiceMock: { pageView: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    googleAnalyticsServiceMock = { pageView: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [HelpComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: GoogleAnalyticsService, useValue: googleAnalyticsServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
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

  it('should track pageView on init', () => {
    expect(googleAnalyticsServiceMock.pageView).toHaveBeenCalledWith('/help', expect.any(String));
  });
});
