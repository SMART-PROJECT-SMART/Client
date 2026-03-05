import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { ArchiveAssignmentRo } from '../../../../models/archive';
import { buildComparisonRows, type ComparisonRow } from '../../archive-page/archive-comparison.utils';
import { TelemetryField } from '../../../../common/enums';
import { EnumUtil, TelemetryUtil } from '../../../../common/utils';

const EXCLUDED_TELEMETRY_FIELDS = new Set<string>([
  TelemetryField.TailId,
  TelemetryField.UAVTypeValue,
  TelemetryField.PlatformType,
  TelemetryField.NearestSleeveId,
]);

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

  readonly EnumUtil = EnumUtil;
  readonly TelemetryUtil = TelemetryUtil;

  readonly comparisonRows: ComparisonRow[] =
    buildComparisonRows(this.data.suggestedAssignments, this.data.actualAssignments);
  readonly changedCount = this.comparisonRows.filter((r) => r.changed).length;
  readonly totalCount = this.comparisonRows.length;
  readonly formattedDate = this.data.createdAt
    ? new Date(this.data.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  readonly expandedRows = signal<Set<string>>(new Set());

  isRowExpanded(title: string): boolean {
    return this.expandedRows().has(title);
  }

  toggleRow(title: string): void {
    const expanded = new Set(this.expandedRows());
    if (expanded.has(title)) {
      expanded.delete(title);
    } else {
      expanded.add(title);
    }
    this.expandedRows.set(expanded);
  }

  getTelemetryComparisonRows(
    suggested: Record<string, number> | null,
    actual: Record<string, number> | null,
  ): TelemetryComparisonEntry[] {
    const allFields = new Set<string>([
      ...Object.keys(suggested ?? {}),
      ...Object.keys(actual ?? {}),
    ]);

    return [...allFields]
      .filter((field) => !EXCLUDED_TELEMETRY_FIELDS.has(field))
      .map((field) => ({
        field: field as TelemetryField,
        label: EnumUtil.getTelemetryFieldDisplay(field as TelemetryField),
        unit: TelemetryUtil.getUnit(field as TelemetryField),
        suggestedValue: suggested?.[field] ?? null,
        actualValue: actual?.[field] ?? null,
      }));
  }

  close(): void {
    this.dialogRef.close();
  }
}

export interface TelemetryComparisonEntry {
  field: TelemetryField;
  label: string;
  unit: string;
  suggestedValue: number | null;
  actualValue: number | null;
}
