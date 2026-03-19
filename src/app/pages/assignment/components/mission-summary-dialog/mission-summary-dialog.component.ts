import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EnumUtil } from '../../../../common/utils';
import type { Mission } from '../../../../models';

export interface MissionSummaryDialogData {
  mission: Mission;
}

@Component({
  selector: 'app-mission-summary-dialog',
  standalone: false,
  templateUrl: './mission-summary-dialog.component.html',
  styleUrl: './mission-summary-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionSummaryDialogComponent {
  public readonly mission: Mission;
  public readonly EnumUtil = EnumUtil;

  constructor(
    private readonly dialogRef: MatDialogRef<MissionSummaryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: MissionSummaryDialogData
  ) {
    this.mission = data.mission;
  }

  public get formattedStartTime(): string {
    return this.formatDateTime(this.mission.timeWindow.start);
  }

  public get formattedEndTime(): string {
    return this.formatDateTime(this.mission.timeWindow.end);
  }

  public onClose(): void {
    this.dialogRef.close();
  }

  private formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
