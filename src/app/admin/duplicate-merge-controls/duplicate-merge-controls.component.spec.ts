import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MockedObject } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DuplicateMergeControlsComponent,
  MergeCandidate,
} from './duplicate-merge-controls.component';
import { getTranslocoTestingProviders } from '../../transloco-testing';
import { createRouterMock } from '../../testing/mock-factories';

@Component({
  imports: [DuplicateMergeControlsComponent],
  template: ` <app-duplicate-merge-controls [items]="items()" mergeRoute="/admin/merge-album" /> `,
})
class HostComponent {
  readonly items = signal<MergeCandidate[]>([]);
}

describe('DuplicateMergeControlsComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let control: DuplicateMergeControlsComponent;
  let routerMock: MockedObject<Router>;

  const candidates: MergeCandidate[] = [
    { id: '100', label: '#100 — Album A' },
    { id: '200', label: '#200 — Album B' },
    { id: '300', label: '#300 — Album C' },
  ];

  beforeEach(async () => {
    routerMock = createRouterMock();

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [getTranslocoTestingProviders(), { provide: Router, useValue: routerMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.items.set(candidates);
    fixture.detectChanges();
    control = fixture.debugElement.children[0].componentInstance;
  });

  it('should default source to the first item and target to the second', () => {
    expect(control.mergeModel().sourceId).toBe('100');
    expect(control.mergeModel().targetId).toBe('200');
    expect(control.mergeForm().invalid()).toBe(false);
  });

  it('should be invalid when source and target are the same', () => {
    control.mergeModel.set({ sourceId: '100', targetId: '100' });
    fixture.detectChanges();
    expect(control.mergeForm().invalid()).toBe(true);
  });

  it('should let the admin pick a different pair (3+ group) and navigate', () => {
    control.mergeModel.set({ sourceId: '200', targetId: '300' });
    fixture.detectChanges();

    expect(control.mergeForm().invalid()).toBe(false);
    control.merge();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/merge-album'], {
      queryParams: { source: '200', with: '300' },
    });
  });

  it('should not navigate when the selection is invalid', () => {
    control.mergeModel.set({ sourceId: '100', targetId: '100' });
    fixture.detectChanges();

    control.merge();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should reset defaults when the candidate list changes', () => {
    control.mergeModel.set({ sourceId: '300', targetId: '100' });
    fixture.detectChanges();
    expect(control.mergeModel().sourceId).toBe('300');

    host.items.set([
      { id: '900', label: '#900 — X' },
      { id: '901', label: '#901 — Y' },
    ]);
    fixture.detectChanges();

    expect(control.mergeModel().sourceId).toBe('900');
    expect(control.mergeModel().targetId).toBe('901');
  });
});
