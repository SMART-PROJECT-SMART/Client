import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { ArchiveMissionRo } from '../../../../models/archive';

export interface MissionDetailsDialogData {
  mission: ArchiveMissionRo;
}

@Component({
  selector: 'app-mission-details-dialog',
  standalone: false,
  templateUrl: './mission-details-dialog.component.html',
  styleUrl: './mission-details-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionDetailsDialogComponent {
  readonly mission: ArchiveMissionRo;

  constructor(
    private readonly dialogRef: MatDialogRef<MissionDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: MissionDetailsDialogData,
  ) {
    this.mission = data.mission;
  }

  get formattedStartTime(): string {
    return this.formatDateTime(this.mission.timeWindow.start);
  }

  get formattedEndTime(): string {
    return this.formatDateTime(this.mission.timeWindow.end);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  private formatDateTime(value: string): string {
    return new Date(value).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
