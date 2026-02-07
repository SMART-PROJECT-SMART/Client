import { Component, ChangeDetectionStrategy, viewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { UAVType, Priority } from '../../../../common/enums';
import { ClientConstants } from '../../../../common';
import { EnumUtil, DateTimeUtil } from '../../../../common/utils';
import { timeWindowValidator, futureDateValidator } from '../../../../common/validators';
import type { Mission } from '../../../../models';

const { LocationValidation, MissionValidation } = ClientConstants.ValidationConstants;

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
  public readonly stepper = viewChild.required<MatStepper>('stepper');

  public readonly uavTypes: UAVType[] = Object.values(UAVType);
  public readonly priorities: Priority[] = Object.values(Priority);
  public readonly EnumUtil = EnumUtil;
  public readonly LocationValidation = LocationValidation;

  public readonly basicInfoForm = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.maxLength(MissionValidation.TITLE_MAX_LENGTH)]),
    requiredUAVType: new FormControl('', [Validators.required]),
    priority: new FormControl('', [Validators.required]),
  });

  public readonly timeWindowForm = new FormGroup(
    {
      startDate: new FormControl<Date | null>(null, [Validators.required, futureDateValidator()]),
      startTime: new FormControl<string | null>(null, [Validators.required]),
      endDate: new FormControl<Date | null>(null, [Validators.required]),
      endTime: new FormControl<string | null>(null, [Validators.required]),
    },
    {
      validators: [timeWindowValidator()],
    }
  );

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
    if (this.basicInfoForm.invalid) {
      this.stepper().selectedIndex = 0;
      this.basicInfoForm.markAllAsTouched();
      return;
    }
    if (this.timeWindowForm.invalid) {
      this.stepper().selectedIndex = 1;
      this.timeWindowForm.markAllAsTouched();
      return;
    }
    if (this.locationForm.invalid) {
      this.stepper().selectedIndex = 2;
      this.locationForm.markAllAsTouched();
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

  public isFormInvalid(): boolean {
    return this.basicInfoForm.invalid || this.timeWindowForm.invalid || this.locationForm.invalid;
  }
}
