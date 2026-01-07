import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { HelpPageComponent } from './help-page.component';
import { getTranslocoTestingProviders } from 'src/app/transloco-testing';

describe('HelpPageComponent', () => {
  let component: HelpPageComponent;
  let fixture: ComponentFixture<HelpPageComponent>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let route: ActivatedRoute;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let getSpy: any;

  beforeEach(async () => {
    getSpy = vi.fn().mockReturnValue('test-page');
    await TestBed.configureTestingModule({
      imports: [HelpPageComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: getSpy } } } },
      ],
    }).compileComponents();
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
    getSpy.mockReturnValue('test-page');
    component.ngOnInit();
    expect(component.page).toEqual('test-page');
  });

  it('should set the correct title for install-android', () => {
    getSpy.mockReturnValue('install-android');
    component.ngOnInit();
    expect(component.page).toEqual('install-android');
  });

  it('should set the correct title for install-ios', () => {
    getSpy.mockReturnValue('install-ios');
    component.ngOnInit();
    expect(component.page).toEqual('install-ios');
  });

  it('should set the correct title for locked-screen', () => {
    getSpy.mockReturnValue('locked-screen');
    component.ngOnInit();
    expect(component.page).toEqual('locked-screen');
  });

  it('should set the correct title for listen', () => {
    getSpy.mockReturnValue('listen');
    component.ngOnInit();
    expect(component.page).toEqual('listen');
  });

  it('should set the correct title for legal', () => {
    getSpy.mockReturnValue('legal');
    component.ngOnInit();
    expect(component.page).toEqual('legal');
  });

  it('should set the correct title for download', () => {
    getSpy.mockReturnValue('download');
    component.ngOnInit();
    expect(component.page).toEqual('download');
  });

  it('should set the correct title for issues', () => {
    getSpy.mockReturnValue('issues');
    component.ngOnInit();
    expect(component.page).toEqual('issues');
  });
});
