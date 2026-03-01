import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { ArchiveAssignmentRo, ArchiveMissionToUavAssignmentRo } from '../../models/archive';

interface ComparisonRow {
  title: string;
  type: string;
  suggestedTailId: number | null;
  actualTailId: number | null;
  changed: boolean;
}

function buildComparisonRows(
  suggested: ArchiveMissionToUavAssignmentRo[],
  actual: ArchiveMissionToUavAssignmentRo[],
): ComparisonRow[] {
  const suggestedMap = new Map<string, ArchiveMissionToUavAssignmentRo>();
  for (const a of suggested) {
    suggestedMap.set(a.mission?.title ?? '', a);
  }

  const actualMap = new Map<string, ArchiveMissionToUavAssignmentRo>();
  for (const a of actual) {
    actualMap.set(a.mission?.title ?? '', a);
  }

  const allTitles = new Set([...suggestedMap.keys(), ...actualMap.keys()]);
  const rows: ComparisonRow[] = [];

  for (const title of [...allTitles].sort()) {
    const s = suggestedMap.get(title);
    const a = actualMap.get(title);
    const suggestedTailId = s?.uavTailId ?? null;
    const actualTailId = a?.uavTailId ?? null;

    rows.push({
      title,
      type: s?.mission?.requiredUAVType ?? a?.mission?.requiredUAVType ?? '—',
      suggestedTailId,
      actualTailId,
      changed: suggestedTailId !== actualTailId,
    });
  }

  return rows;
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
