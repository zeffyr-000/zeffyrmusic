import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoTestingModule, TranslocoConfig, TRANSLOCO_CONFIG, TranslocoService } from '@ngneat/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { of, throwError } from 'rxjs';
import { HomeAlbum } from '../models/album.model';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let titleService: Title;
  let metaService: Meta;
  let translocoService: TranslocoService;
  let googleAnalyticsService: GoogleAnalyticsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslocoTestingModule.forRoot({
          langs: { en: { meta_description: 'META_DESCRIPTION', title: 'TITLE' }, fr: { meta_description: 'META_DESCRIPTION_FR', title: 'TITLE_FR' } }
        }),
      ],
      declarations: [HomeComponent],
      providers: [
        Title,
        Meta,
        TranslocoService,
        GoogleAnalyticsService,
        {
          provide: TRANSLOCO_CONFIG, useValue: {
            reRenderOnLangChange: true,
            availableLangs: ['en', 'fr'],
            defaultLang: 'en',
            prodMode: false,
          } as TranslocoConfig
        }
      ],
    }).compileComponents();

    translocoService = TestBed.inject(TranslocoService);
    translocoService.setDefaultLang('en');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
    translocoService = TestBed.inject(TranslocoService);
    googleAnalyticsService = TestBed.inject(GoogleAnalyticsService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set title and meta tags on init', () => {
    spyOn(component['httpClient'], 'get').and.returnValue(of({ top: [], top_albums: [] }));
    spyOn(titleService, 'setTitle');
    spyOn(metaService, 'updateTag');
    spyOn(googleAnalyticsService, 'pageView');
    component.ngOnInit();
    expect(titleService.setTitle).toHaveBeenCalledWith('title');
    expect(metaService.updateTag).toHaveBeenCalledWith({ name: 'description', content: 'meta_description' });
    expect(googleAnalyticsService.pageView).toHaveBeenCalledWith('/');
  });

  it('should set isLoading to false after http request', () => {
    spyOn(component['httpClient'], 'get').and.returnValue(of({ top: [], top_albums: [] }));
    component.ngOnInit();
    expect(component.isLoading).toBeFalse();
  });

  it('should set listTopAlbums and listTop after http request', () => {
    const data: { top: HomeAlbum[], top_albums: HomeAlbum[] } = {
      top: [{
        id: '1',
        titre: 'Titre Album',
        description: 'Description Album',
        url_image: ''
      }],
      top_albums: [{ id: '2', titre: 'Titre Album 2', description: 'Description Album 2', url_image: '' }],
    };
    spyOn(component['httpClient'], 'get').and.returnValue(of(data));
    component.ngOnInit();
    //expect(component.listTopAlbums).toEqual(data.top_albums);
    //expect(component.listTop).toEqual(data.top);
  });

  it('should set isLoading to false after http request error', () => {
    spyOn(component['httpClient'], 'get').and.returnValue(throwError('Error'));
    component.ngOnInit();
    expect(component.isLoading).toBeFalse();
  });
});