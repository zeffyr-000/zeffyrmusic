import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { submit } from '@angular/forms/signals';
import { of, throwError } from 'rxjs';
import type { MockedObject } from 'vitest';
import { ReportAlbumModalComponent } from './report-album-modal.component';
import { ReportAlbumResponse } from 'src/app/models/report-album.model';
import { ReportAlbumService } from 'src/app/services/report-album.service';
import { UiStore } from 'src/app/store';
import { getTranslocoTestingProviders } from 'src/app/transloco-testing';
import {
  createNgbActiveModalMock,
  createReportAlbumServiceMock,
} from 'src/app/testing/mock-factories';

describe('ReportAlbumModalComponent', () => {
  let component: ReportAlbumModalComponent;
  let fixture: ComponentFixture<ReportAlbumModalComponent>;
  let activeModalMock: MockedObject<NgbActiveModal>;
  let reportAlbumServiceMock: MockedObject<ReportAlbumService>;
  let uiStoreMock: {
    showSuccess: ReturnType<typeof vi.fn>;
    showInfo: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    activeModalMock = createNgbActiveModalMock();
    reportAlbumServiceMock = createReportAlbumServiceMock();
    uiStoreMock = { showSuccess: vi.fn(), showInfo: vi.fn(), showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ReportAlbumModalComponent],
      providers: [
        { provide: NgbActiveModal, useValue: activeModalMock },
        { provide: ReportAlbumService, useValue: reportAlbumServiceMock },
        { provide: UiStore, useValue: uiStoreMock },
        getTranslocoTestingProviders(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportAlbumModalComponent);
    component = fixture.componentInstance;
    component.idPlaylist = '42';
    fixture.detectChanges();
  });

  it('should create with no reason selected and an invalid form', () => {
    expect(component).toBeTruthy();
    expect(component.reportModel().reason).toBe('');
    expect(component.reportForm().invalid()).toBe(true);
    expect(component.errorMessage()).toBe('');
  });

  it('should expose the three report reasons in order', () => {
    expect(component.reasons).toEqual(['missing_tracks', 'wrong_titles', 'wrong_album']);
  });

  it('should not call the service when no reason is selected', async () => {
    await submit(component.reportForm);

    expect(reportAlbumServiceMock.reportAlbum).not.toHaveBeenCalled();
    expect(component.reportForm().invalid()).toBe(true);
  });

  it('should send the report, notify success and close on success', async () => {
    component.reportModel.set({ reason: 'missing_tracks' });
    reportAlbumServiceMock.reportAlbum.mockReturnValue(of({ success: true }));

    await submit(component.reportForm);

    expect(reportAlbumServiceMock.reportAlbum).toHaveBeenCalledWith({
      id_playlist: '42',
      reason: 'missing_tracks',
    });
    expect(uiStoreMock.showSuccess).toHaveBeenCalledTimes(1);
    expect(activeModalMock.close).toHaveBeenCalledWith('missing_tracks');
    expect(component.errorMessage()).toBe('');
  });

  it('should acknowledge already_reported with an info notification and close', async () => {
    component.reportModel.set({ reason: 'wrong_titles' });
    reportAlbumServiceMock.reportAlbum.mockReturnValue(
      of({ success: false, error: 'already_reported' })
    );

    await submit(component.reportForm);

    expect(uiStoreMock.showInfo).toHaveBeenCalledTimes(1);
    expect(activeModalMock.close).toHaveBeenCalledWith('wrong_titles');
    expect(component.errorMessage()).toBe('');
  });

  it('should show an inline error and stay open on album_not_found', async () => {
    component.reportModel.set({ reason: 'wrong_album' });
    reportAlbumServiceMock.reportAlbum.mockReturnValue(
      of({ success: false, error: 'album_not_found' })
    );

    await submit(component.reportForm);

    expect(component.errorMessage()).toBe('This album no longer exists.');
    expect(activeModalMock.close).not.toHaveBeenCalled();
  });

  it('should fall back to the generic error for an unknown slug', async () => {
    component.reportModel.set({ reason: 'missing_tracks' });
    // Deliberately off-contract: the cast is the point — the server is not bound
    // by ReportAlbumError, so the runtime fallback must still hold.
    reportAlbumServiceMock.reportAlbum.mockReturnValue(
      of({ success: false, error: 'boom' } as unknown as ReportAlbumResponse)
    );

    await submit(component.reportForm);

    expect(component.errorMessage()).toBe('An error occurred, please try again later.');
    expect(activeModalMock.close).not.toHaveBeenCalled();
  });

  it('should fall back to the generic error when no slug is returned', async () => {
    component.reportModel.set({ reason: 'missing_tracks' });
    reportAlbumServiceMock.reportAlbum.mockReturnValue(of({ success: false }));

    await submit(component.reportForm);

    expect(component.errorMessage()).toBe('An error occurred, please try again later.');
    expect(activeModalMock.close).not.toHaveBeenCalled();
  });

  it('should show the generic error when the request throws', async () => {
    component.reportModel.set({ reason: 'missing_tracks' });
    reportAlbumServiceMock.reportAlbum.mockReturnValue(throwError(() => new Error('Network')));

    await submit(component.reportForm);

    expect(component.errorMessage()).toBe('An error occurred, please try again later.');
    expect(activeModalMock.close).not.toHaveBeenCalled();
  });
});
