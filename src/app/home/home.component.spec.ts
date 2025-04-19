import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, UrlSegment } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { of, throwError } from 'rxjs';
import { HomeAlbum } from '../models/album.model';
import { HomeComponent } from './home.component';
import { NO_ERRORS_SCHEMA, PLATFORM_ID, StateKey, makeStateKey } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { getTranslocoModule } from '../transloco-testing.module';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HOME_DATA_KEY = makeStateKey<any>('randomTop');

describe('HomeComponent', () => {
  function runCommonTests() {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should set isLoading to false after http request', () => {
      spyOn(component['initService'], 'getHomeInit').and.returnValue(of({ top: [], top_albums: [] }));
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
        },
        {
          id: '2',
          titre: 'Titre Album 2',
          description: 'Description Album 2',
          url_image: ''
        }],
        top_albums: [{ id: '2', titre: 'Titre Album 2', description: 'Description Album 2', url_image: '' }],
      };
      spyOn(component['initService'], 'getHomeInit').and.returnValue(of(data));
      component.ngOnInit();
      expect(component['listTopAlbums']).toEqual(data.top_albums);
      expect(component['listTop']).toEqual(data.top);
    });

    it('should set isLoading to false after http request error', () => {
      spyOn(component['initService'], 'getHomeInit').and.returnValue(throwError(() => new Error('Test error')));
      component.ngOnInit();
      expect(component.isLoading).toBeFalse();
    });

    it('should set page to "top" when url is "top"', () => {
      route.snapshot.url = [new UrlSegment('top', {})];
      component.ngOnInit();
      expect(component['page']).toEqual('top');
    });

    it('should set page to "albums" when url is "albums"', () => {
      route.snapshot.url = [new UrlSegment('albums', {})];
      component.ngOnInit();
      expect(component['page']).toEqual('albums');
    });

    it('should set page to "home" when url is not "top" or "albums"', () => {
      route.snapshot.url = [new UrlSegment('not-top-or-albums', {})];
      component.ngOnInit();
      expect(component['page']).toEqual('home');
    });

    it('should correctly filter and sort albums by decade', () => {
      const data: { top: HomeAlbum[], top_albums: HomeAlbum[] } = {
        top: [
          {
            id: '3',
            titre: 'Album sans décennie',
            description: 'Album sans propriété decade',
            url_image: '',
          },
          {
            id: '2',
            titre: 'Album 90s',
            description: 'Album années 90',
            url_image: '',
            decade: true
          },
          {
            id: '1',
            titre: 'Album 80s',
            description: 'Album années 80',
            url_image: '',
            decade: true
          },
          {
            id: '4',
            titre: 'Album 2000s',
            description: 'Album années 2000',
            url_image: '',
            decade: true
          }
        ],
        top_albums: []
      };

      spyOn(component['initService'], 'getHomeInit').and.returnValue(of(data));

      component.ngOnInit();

      expect(component['listTopDecade'].length).toBe(3);

      expect(component['listTopDecade'][0].id).toBe('1');
      expect(component['listTopDecade'][1].id).toBe('2');
      expect(component['listTopDecade'][2].id).toBe('4');

      const albumSansDecade = component['listTopDecade'].find(album => album.id === '3');
      expect(albumSansDecade).toBeUndefined();

      expect(component['listTopDecade'][0].titre).toBe('Album 80s');
      expect(component['listTopDecade'][1].titre).toBe('Album 90s');
      expect(component['listTopDecade'][2].titre).toBe('Album 2000s');
    });
  }

  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let route: ActivatedRoute;

  describe('Browser rendering', () => {
    let titleService: jasmine.SpyObj<Title>;
    let metaService: jasmine.SpyObj<Meta>;
    let googleAnalyticsService: jasmine.SpyObj<GoogleAnalyticsService>;
    let translocoService: TranslocoService;

    beforeEach(async () => {
      titleService = jasmine.createSpyObj('Title', ['setTitle']);
      metaService = jasmine.createSpyObj('Meta', ['updateTag']);
      googleAnalyticsService = jasmine.createSpyObj('GoogleAnalyticsService', ['pageView']);

      await TestBed.configureTestingModule({
        schemas: [NO_ERRORS_SCHEMA],
        imports: [getTranslocoModule(), HomeComponent],
        providers: [
          { provide: Title, useValue: titleService },
          { provide: Meta, useValue: metaService },
          { provide: GoogleAnalyticsService, useValue: googleAnalyticsService },
          { provide: ActivatedRoute, useValue: { snapshot: { url: [] } } },
          { provide: PLATFORM_ID, useValue: 'browser' },
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
        ]
      }).compileComponents();

      translocoService = TestBed.inject(TranslocoService);
      translocoService.setDefaultLang('en');
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
      route = TestBed.inject(ActivatedRoute);
      fixture.detectChanges();
    });

    runCommonTests();

    it('should set title and meta tags on init in browser', () => {
      spyOn(component['initService'], 'getHomeInit').and.returnValue(of({ top: [], top_albums: [] }));
      component.ngOnInit();
      expect(titleService.setTitle).toHaveBeenCalledWith('Écoutez de la Musique Gratuite et Sans Pub - ZeffyrMusic');
      expect(metaService.updateTag).toHaveBeenCalledWith(jasmine.objectContaining({
        name: 'description'
      }));
      expect(googleAnalyticsService.pageView).toHaveBeenCalledWith('/');
    });

    it('should use data from TransferState if available in browser', () => {
      const mockHomeData = {
        top: [{ id: '3', titre: 'TransferState Album', description: 'From TransferState', url_image: '' }],
        top_albums: [] as HomeAlbum[]
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      spyOn(component['transferState'], 'get').and.callFake(<T>(key: StateKey<T>, defaultValue: T) => {
        if (key === HOME_DATA_KEY) {
          return mockHomeData as unknown as T;
        }
        return defaultValue;
      });

      spyOn(component['transferState'], 'remove');

      const initServiceSpy = spyOn(component['initService'], 'getHomeInit').and.returnValue(of(mockHomeData));

      component.ngOnInit();

      expect(component['transferState'].get).toHaveBeenCalled();

      expect(component['listTop'].length).toBe(1);
      expect(component['listTop'][0].titre).toBe('TransferState Album');

      expect(initServiceSpy).toHaveBeenCalled();
      expect(component['transferState'].remove).toHaveBeenCalledWith(HOME_DATA_KEY);
    });
  });

  describe('Server rendering', () => {
    let titleService: jasmine.SpyObj<Title>;
    let metaService: jasmine.SpyObj<Meta>;
    let googleAnalyticsService: jasmine.SpyObj<GoogleAnalyticsService>;
    let translocoService: TranslocoService;

    beforeEach(async () => {
      titleService = jasmine.createSpyObj('Title', ['setTitle']);
      metaService = jasmine.createSpyObj('Meta', ['updateTag']);
      googleAnalyticsService = jasmine.createSpyObj('GoogleAnalyticsService', ['pageView']);

      await TestBed.configureTestingModule({
        schemas: [NO_ERRORS_SCHEMA],
        imports: [getTranslocoModule(), HomeComponent],
        providers: [
          { provide: Title, useValue: titleService },
          { provide: Meta, useValue: metaService },
          { provide: GoogleAnalyticsService, useValue: googleAnalyticsService },
          { provide: ActivatedRoute, useValue: { snapshot: { url: [] } } },
          { provide: PLATFORM_ID, useValue: 'server' },
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
        ]
      }).compileComponents();

      translocoService = TestBed.inject(TranslocoService);
      translocoService.setDefaultLang('en');
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
      route = TestBed.inject(ActivatedRoute);
      fixture.detectChanges();
    });

    runCommonTests();

    it('should set title and meta tags on init in server but not call GA', () => {
      spyOn(component['initService'], 'getHomeInit').and.returnValue(of({ top: [], top_albums: [] }));
      component.ngOnInit();
      expect(titleService.setTitle).toHaveBeenCalledWith('Écoutez de la Musique Gratuite et Sans Pub - ZeffyrMusic');
      expect(metaService.updateTag).toHaveBeenCalledWith(jasmine.objectContaining({
        name: 'description'
      }));

      expect(googleAnalyticsService.pageView).not.toHaveBeenCalled();
    });

    it('should store data in TransferState when on server', () => {
      const mockHomeData = {
        top: [{ id: '1', titre: 'Server Data', description: 'For TransferState', url_image: '' }],
        top_albums: [] as HomeAlbum[]
      };

      spyOn(component['initService'], 'getHomeInit').and.returnValue(of(mockHomeData));

      const transferStateSpy = spyOn(component['transferState'], 'set');

      component.ngOnInit();

      expect(transferStateSpy).toHaveBeenCalled();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const REAL_KEY = makeStateKey<any>('randomTop');

      expect(transferStateSpy.calls.mostRecent().args[0]).toEqual(REAL_KEY);

      expect(transferStateSpy.calls.mostRecent().args[1]).toEqual(mockHomeData.top);
    });
  });
});