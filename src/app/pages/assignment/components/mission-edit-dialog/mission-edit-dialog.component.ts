import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UAVType, Priority } from '../../../../common/enums';
import { ClientConstants } from '../../../../common';
import { EnumUtil, DateTimeUtil } from '../../../../common/utils';
import { timeWindowValidator } from '../../../../common/validators';
import type { Mission } from '../../../../models';

const { LocationValidation } = ClientConstants.ValidationConstants;

export interface MissionEditDialogData {
  mission: Mission;
}

@Component({
  selector: 'app-mission-edit-dialog',
  standalone: false,
  templateUrl: './mission-edit-dialog.component.html',
  styleUrl: './mission-edit-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionEditDialogComponent {
  public readonly uavTypes: UAVType[] = Object.values(UAVType);
  public readonly priorities: Priority[] = Object.values(Priority);
  public readonly EnumUtil = EnumUtil;
  public readonly LocationValidation = LocationValidation;
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

    const startDate = new Date(mission.timeWindow.start);
    const endDate = new Date(mission.timeWindow.end);

    this.timeWindowForm = new FormGroup({
      startDate: new FormControl<Date>(startDate, [Validators.required]),
      startTime: new FormControl(DateTimeUtil.formatTimeForInput(startDate), [Validators.required]),
      endDate: new FormControl<Date>(endDate, [Validators.required]),
      endTime: new FormControl(DateTimeUtil.formatTimeForInput(endDate), [Validators.required]),
    });

    this.locationForm = new FormGroup({
      latitude: new FormControl<number>(mission.location.latitude, [
        Validators.required,
        Validators.min(LocationValidation.LATITUDE_MIN),
        Validators.max(LocationValidation.LATITUDE_MAX),
      ]),
      longitude: new FormControl<number>(mission.location.longitude, [
        Validators.required,
        Validators.min(LocationValidation.LONGITUDE_MIN),
        Validators.max(LocationValidation.LONGITUDE_MAX),
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

    const startDateTime = DateTimeUtil.combineDateAndTime(
      this.timeWindowForm.value.startDate!,
      this.timeWindowForm.value.startTime!
    );
    const endDateTime = DateTimeUtil.combineDateAndTime(
      this.timeWindowForm.value.endDate!,
      this.timeWindowForm.value.endTime!
    );

    const updatedMission: Mission = {
      id: this.data.mission.id,
      title: this.basicInfoForm.value.title!,
      requiredUAVType: this.basicInfoForm.value.requiredUAVType as UAVType,
      priority: this.basicInfoForm.value.priority as Priority,
      timeWindow: {
        start: startDateTime,
        end: endDateTime,
      },
      location: {
        latitude: this.locationForm.value.latitude!,
        longitude: this.locationForm.value.longitude!,
        altitude: this.locationForm.value.altitude!,
      },
    };

    this.dialogRef.close(updatedMission);
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
