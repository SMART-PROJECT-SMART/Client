import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { ArchiveAssignmentRo } from '../../../../models/archive';
import { buildComparisonRows } from '../../archive-page/archive-comparison.utils';

@Component({
  selector: 'app-archive-diff-dialog',
  standalone: false,
  templateUrl: './archive-diff-dialog.component.html',
  styleUrl: './archive-diff-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchiveDiffDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ArchiveDiffDialogComponent>);
  readonly data: ArchiveAssignmentRo = inject(MAT_DIALOG_DATA, { optional: true }) ?? {
    suggestedAssignments: [],
    actualAssignments: [],
    createdAt: '',
  };

  readonly comparisonRows = computed(() =>
    buildComparisonRows(this.data.suggestedAssignments, this.data.actualAssignments)
  );

  readonly hasChanges = computed(() =>
    this.comparisonRows().some(r => r.changed)
  );

  readonly changedCount = computed(() =>
    this.comparisonRows().filter(r => r.changed).length
  );

  readonly totalCount = computed(() =>
    this.comparisonRows().length
  );

  readonly formattedDate = computed(() => {
    const raw = this.data.createdAt;
    if (!raw) return '';
    const d = new Date(raw);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  });

  close(): void {
    this.dialogRef.close();
  }
}
