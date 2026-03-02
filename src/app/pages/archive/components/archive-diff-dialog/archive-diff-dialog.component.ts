import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { ArchiveAssignmentRo } from '../../../../models/archive';
import { buildComparisonRows, type ComparisonRow } from '../../archive-page/archive-comparison.utils';

@Component({
  selector: 'app-archive-diff-dialog',
  standalone: false,
  templateUrl: './archive-diff-dialog.component.html',
  styleUrl: './archive-diff-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchiveDiffDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ArchiveDiffDialogComponent>);
  private readonly data: ArchiveAssignmentRo = inject(MAT_DIALOG_DATA, { optional: true }) ?? {
    suggestedAssignments: [],
    actualAssignments: [],
    createdAt: '',
  };

  readonly comparisonRows: ComparisonRow[] =
    buildComparisonRows(this.data.suggestedAssignments, this.data.actualAssignments);
  readonly changedCount = this.comparisonRows.filter((r) => r.changed).length;
  readonly totalCount = this.comparisonRows.length;
  readonly formattedDate = this.data.createdAt
    ? new Date(this.data.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  close(): void {
    this.dialogRef.close();
  }
}
