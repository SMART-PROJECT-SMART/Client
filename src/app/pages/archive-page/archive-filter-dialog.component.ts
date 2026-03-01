import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UAVType } from '../../common/enums';
import type { ArchiveFilterCriteria } from '../../models/archive';

export interface ArchiveFilterDialogResult {
  loadDate?: string | null;
  criteria: ArchiveFilterCriteria;
}

@Component({
  selector: 'app-archive-filter-dialog',
  standalone: false,
  templateUrl: './archive-filter-dialog.component.html',
  styleUrl: './archive-filter-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchiveFilterDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ArchiveFilterDialogComponent>);
  readonly data: { loadDate?: string | null; criteria: ArchiveFilterCriteria } =
    inject(MAT_DIALOG_DATA, { optional: true }) ?? { criteria: {} };

  readonly missionTypes = Object.values(UAVType);

  readonly form = new FormGroup({
    loadDate: new FormControl<Date | null>(this.data.loadDate ? new Date(this.data.loadDate + 'T12:00:00') : null),
    uavTailId: new FormControl<number | null>(this.data.criteria?.uavTailId ?? null),
    missionType: new FormControl<string | null>(this.data.criteria?.missionType ?? null),
    missionTitle: new FormControl<string | null>(this.data.criteria?.missionTitle ?? null),
  });

  apply(): void {
    const v = this.form.value;
    const d = v.loadDate;
    const loadDate =
      d instanceof Date && !isNaN(d.getTime())
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : null;
    const criteria: ArchiveFilterCriteria = {
      uavTailId: v.uavTailId ?? undefined,
      missionType: v.missionType?.trim() || undefined,
      missionTitle: v.missionTitle?.trim() || undefined,
    };
    this.dialogRef.close({ loadDate, criteria } as ArchiveFilterDialogResult);
  }

  clear(): void {
    this.form.reset({
      loadDate: null,
      uavTailId: null,
      missionType: null,
      missionTitle: null,
    });
    this.dialogRef.close({
      loadDate: null,
      criteria: {},
    } as ArchiveFilterDialogResult);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
