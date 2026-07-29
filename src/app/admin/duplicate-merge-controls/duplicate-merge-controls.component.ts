import { Component, inject, input, linkedSignal } from '@angular/core';
import { form, FormField, FormRoot, required, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

/** A selectable candidate within a duplicate group. */
export interface MergeCandidate {
  id: string;
  label: string;
}

/**
 * Lets the admin pick, within a duplicate group, which item is the source
 * (kept) and which is the duplicate to merge, then opens the merge page with
 * both sides preselected. Shared by the duplicate-albums and duplicate-artists
 * pages via the `items` / `mergeRoute` inputs.
 */
@Component({
  selector: 'app-duplicate-merge-controls',
  templateUrl: './duplicate-merge-controls.component.html',
  styleUrl: './duplicate-merge-controls.component.scss',
  imports: [FormField, FormRoot, TranslocoPipe],
})
export class DuplicateMergeControlsComponent {
  private readonly router = inject(Router);
  private readonly translocoService = inject(TranslocoService);

  readonly items = input.required<MergeCandidate[]>();
  readonly mergeRoute = input.required<string>();

  // Defaults follow the candidate list (first two items) and reset whenever it
  // changes, while remaining user-editable in between (linkedSignal semantics).
  readonly mergeModel = linkedSignal(() => ({
    sourceId: this.items()[0]?.id ?? '',
    targetId: this.items()[1]?.id ?? '',
  }));

  readonly mergeForm = form(this.mergeModel, schema => {
    required(schema.sourceId);
    required(schema.targetId);
    // Source and duplicate must be two different items.
    validate(schema.targetId, ({ value }) =>
      value() && value() === this.mergeModel().sourceId
        ? {
            kind: 'sameItem',
            message: this.translocoService.translate('admin_duplicate_same_item'),
          }
        : null
    );
  });

  merge(): void {
    if (this.mergeForm().invalid()) {
      return;
    }
    const { sourceId, targetId } = this.mergeModel();
    this.router.navigate([this.mergeRoute()], {
      queryParams: { source: sourceId, with: targetId },
    });
  }
}
