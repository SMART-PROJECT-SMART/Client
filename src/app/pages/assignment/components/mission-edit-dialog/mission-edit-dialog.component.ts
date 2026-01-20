import { Component, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UAVType, Priority } from '../../../../common/enums';
import { ClientConstants } from '../../../../common';
import { EnumUtil } from '../../../../common/utils';
import { timeWindowValidator } from '../../../../common/validators';
import type { Mission } from '../../../../models';

const { MissionBounds } = ClientConstants.ValidationConstants;

export interface MissionEditDialogData {
  mission: Mission;
}

@Component({
  selector: 'app-mission-edit-dialog',
  standalone: false,
  templateUrl: './mission-edit-dialog.component.html',
  styleUrl: './mission-edit-dialog.component.scss',
})
export class MissionEditDialogComponent {
  public readonly uavTypes: UAVType[] = Object.values(UAVType);
  public readonly priorities: Priority[] = Object.values(Priority);
  public readonly EnumUtil = EnumUtil;
  public readonly missionTitle: string;

  public readonly basicInfoForm: FormGroup;
  public readonly timeWindowForm: FormGroup;
  public readonly locationForm: FormGroup;

  constructor(
    private readonly dialogRef: MatDialogRef<MissionEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private readonly data: MissionEditDialogData
  ) {
    const mission = this.data.mission;
    this.missionTitle = mission.title;

    this.basicInfoForm = new FormGroup({
      title: new FormControl(mission.title, [Validators.required]),
      requiredUAVType: new FormControl(mission.requiredUAVType, [Validators.required]),
      priority: new FormControl(mission.priority, [Validators.required]),
    });

    this.timeWindowForm = new FormGroup(
      {
        start: new FormControl(this.formatDateForInput(mission.timeWindow.start), [Validators.required]),
        end: new FormControl(this.formatDateForInput(mission.timeWindow.end), [Validators.required]),
      },
      { validators: timeWindowValidator() }
    );

    this.locationForm = new FormGroup({
      latitude: new FormControl<number>(mission.location.latitude, [
        Validators.required,
        Validators.min(MissionBounds.LATITUDE_MIN),
        Validators.max(MissionBounds.LATITUDE_MAX),
      ]),
      longitude: new FormControl<number>(mission.location.longitude, [
        Validators.required,
        Validators.min(MissionBounds.LONGITUDE_MIN),
        Validators.max(MissionBounds.LONGITUDE_MAX),
      ]),
      altitude: new FormControl<number>(mission.location.altitude, [Validators.required]),
    });
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public onSave(): void {
    if (this.isFormInvalid()) {
      this.markAllAsTouched();
      return;
    }

    const updatedMission: Mission = {
      id: this.data.mission.id,
      title: this.basicInfoForm.value.title!,
      requiredUAVType: this.basicInfoForm.value.requiredUAVType as UAVType,
      priority: this.basicInfoForm.value.priority as Priority,
      timeWindow: {
        start: new Date(this.timeWindowForm.value.start!),
        end: new Date(this.timeWindowForm.value.end!),
      },
      location: {
        latitude: this.locationForm.value.latitude!,
        longitude: this.locationForm.value.longitude!,
        altitude: this.locationForm.value.altitude!,
      },
    };

    this.dialogRef.close(updatedMission);
  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private isFormInvalid(): boolean {
    return this.basicInfoForm.invalid || this.timeWindowForm.invalid || this.locationForm.invalid;
  }

  private markAllAsTouched(): void {
    this.basicInfoForm.markAllAsTouched();
    this.timeWindowForm.markAllAsTouched();
    this.locationForm.markAllAsTouched();
  }
}
