import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { ArchiveAssignmentRo } from '../../../../models/archive';
import { buildComparisonRows, type ComparisonRow, type RelevantUav } from '../../archive-page/archive-comparison.utils';
import { TelemetryField } from '../../../../common/enums';
import { EnumUtil, TelemetryUtil } from '../../../../common/utils';

const EXCLUDED_TELEMETRY_FIELDS = new Set<string>([
  TelemetryField.TailId,
  TelemetryField.UAVTypeValue,
  TelemetryField.PlatformType,
  TelemetryField.NearestSleeveId,
]);

export interface TelemetryFieldEntry {
  field: TelemetryField;
  label: string;
  unit: string;
}

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
    buildComparisonRows(this.data.suggestedAssignments, this.data.actualAssignments, this.data.allUavTelemetryData);
  readonly changedCount = this.comparisonRows.filter((r) => r.changed).length;
  readonly totalCount = this.comparisonRows.length;
  readonly hasAllUavData = !!this.data.allUavTelemetryData;
  readonly formattedDate = this.data.createdAt
    ? new Date(this.data.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  readonly expandedRows = signal<Set<string>>(new Set());
  readonly selectedCompareUavs = signal<Map<string, number>>(new Map());

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

  getSuggestedUav(row: ComparisonRow): RelevantUav | null {
    return row.relevantUavs.find((u) => u.isSuggested) ?? null;
  }

  getCompareUav(row: ComparisonRow): RelevantUav | null {
    const selectedTailId = this.selectedCompareUavs().get(row.title);
    if (selectedTailId !== undefined) {
      return row.relevantUavs.find((u) => u.tailId === selectedTailId) ?? null;
    }
    return row.relevantUavs.find((u) => u.isActual) ?? null;
  }

  getCompareTailId(row: ComparisonRow): number | null {
    return this.selectedCompareUavs().get(row.title) ?? row.actualTailId;
  }

  onCompareUavChange(missionTitle: string, tailId: number): void {
    const updated = new Map(this.selectedCompareUavs());
    updated.set(missionTitle, tailId);
    this.selectedCompareUavs.set(updated);
  }

  getTelemetryFields(uavs: RelevantUav[]): TelemetryFieldEntry[] {
    const allFields = new Set<string>();
    for (const uav of uavs) {
      for (const field of Object.keys(uav.telemetry)) {
        if (!EXCLUDED_TELEMETRY_FIELDS.has(field)) {
          allFields.add(field);
        }
      }
    }

    return [...allFields].map((field) => ({
      field: field as TelemetryField,
      label: EnumUtil.getTelemetryFieldDisplay(field as TelemetryField),
      unit: TelemetryUtil.getUnit(field as TelemetryField),
    }));
  }

  getLegacyTelemetryFields(
    suggested: Record<string, number> | null,
    actual: Record<string, number> | null,
  ): { field: TelemetryField; label: string; unit: string; suggestedValue: number | null; actualValue: number | null }[] {
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
