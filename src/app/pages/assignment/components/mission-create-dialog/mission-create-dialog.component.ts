import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { UAVType, Priority } from '../../../../common/enums';
import { ClientConstants } from '../../../../common';
import { EnumUtil } from '../../../../common/utils';
import { timeWindowValidator } from '../../../../common/validators';
import type { Mission } from '../../../../models';

const { LocationValidation } = ClientConstants.ValidationConstants;

@Component({
  selector: 'app-mission-create-dialog',
  standalone: false,
  templateUrl: './mission-create-dialog.component.html',
  styleUrl: './mission-create-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true },
    },
  ],
})
export class MissionCreateDialogComponent {
  public readonly uavTypes: UAVType[] = Object.values(UAVType);
  public readonly priorities: Priority[] = Object.values(Priority);
  public readonly EnumUtil = EnumUtil;
  public readonly LocationValidation = LocationValidation;

  public readonly basicInfoForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    requiredUAVType: new FormControl('', [Validators.required]),
    priority: new FormControl('', [Validators.required]),
  });

  public readonly timeWindowForm = new FormGroup({
    startDate: new FormControl<Date | null>(null, [Validators.required]),
    startTime: new FormControl('', [Validators.required]),
    endDate: new FormControl<Date | null>(null, [Validators.required]),
    endTime: new FormControl('', [Validators.required]),
  });

  public readonly locationForm = new FormGroup({
    latitude: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(LocationValidation.LATITUDE_MIN),
      Validators.max(LocationValidation.LATITUDE_MAX),
    ]),
    longitude: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(LocationValidation.LONGITUDE_MIN),
      Validators.max(LocationValidation.LONGITUDE_MAX),
    ]),
    altitude: new FormControl<number | null>(null, [Validators.required]),
  });

  constructor(private readonly dialogRef: MatDialogRef<MissionCreateDialogComponent>) {}

  public onCancel(): void {
    this.dialogRef.close();
  }

  public onSubmit(): void {
    if (this.isFormInvalid()) {
      return;
    }

    const startDateTime = this.combineDateAndTime(
      this.timeWindowForm.value.startDate!,
      this.timeWindowForm.value.startTime!
    );
    const endDateTime = this.combineDateAndTime(
      this.timeWindowForm.value.endDate!,
      this.timeWindowForm.value.endTime!
    );

    const mission: Mission = {
      id: crypto.randomUUID(),
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

    this.dialogRef.close(mission);
  }

  private combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }

  private isFormInvalid(): boolean {
    return this.basicInfoForm.invalid || this.timeWindowForm.invalid || this.locationForm.invalid;
  }
}
