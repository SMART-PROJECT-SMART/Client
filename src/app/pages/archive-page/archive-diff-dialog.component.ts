import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { ArchiveAssignmentRo, ArchiveMissionToUavAssignmentRo } from '../../models/archive';

function formatAssignmentLine(a: ArchiveMissionToUavAssignmentRo): string {
  const title = a.mission?.title ?? '—';
  const type = a.mission?.requiredUAVType ?? '—';
  return `${title}\t${type}\tTail ${a.uavTailId}`;
}

function assignmentLines(list: ArchiveMissionToUavAssignmentRo[]): string {
  const sorted = [...(list ?? [])].sort((x, y) => {
    const t = (x.mission?.title ?? '').localeCompare(y.mission?.title ?? '');
    if (t !== 0) return t;
    return x.uavTailId - y.uavTailId;
  });
  return sorted.map(formatAssignmentLine).join('\n') || '(none)';
}

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

  readonly beforeText = computed(() =>
    assignmentLines(this.data?.suggestedAssignments ?? [])
  );
  readonly afterText = computed(() =>
    assignmentLines(this.data?.actualAssignments ?? [])
  );

  close(): void {
    this.dialogRef.close();
  }
}
