import { Component, signal } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { UAVType, Priority, LocationMode } from '../../../../common/enums';
import { ClientConstants, MILITARY_BASES } from '../../../../common';
import { EnumUtil } from '../../../../common/utils';
import { timeWindowValidator } from '../../../../common/validators';
import type { Mission, MilitaryBase } from '../../../../models';

const { MissionBounds } = ClientConstants.ValidationConstants;

@Component({
  selector: 'app-mission-create-dialog',
  standalone: false,
  templateUrl: './mission-create-dialog.component.html',
  styleUrl: './mission-create-dialog.component.scss',
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
  public readonly militaryBases: MilitaryBase[] = MILITARY_BASES;
  public readonly EnumUtil = EnumUtil;
  public readonly LocationMode = LocationMode;
  public readonly locationMode = signal<LocationMode>(LocationMode.BASE);
  public readonly selectedBase = signal<MilitaryBase | null>(null);

  public readonly basicInfoForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    requiredUAVType: new FormControl('', [Validators.required]),
    priority: new FormControl('', [Validators.required]),
  });

  public readonly timeWindowForm = new FormGroup(
    {
      start: new FormControl('', [Validators.required]),
      end: new FormControl('', [Validators.required]),
    },
    { validators: timeWindowValidator() }
  );

  public readonly locationForm = new FormGroup({
    latitude: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(MissionBounds.LATITUDE_MIN),
      Validators.max(MissionBounds.LATITUDE_MAX),
    ]),
    longitude: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(MissionBounds.LONGITUDE_MIN),
      Validators.max(MissionBounds.LONGITUDE_MAX),
    ]),
    altitude: new FormControl<number | null>(null, [Validators.required]),
  });

  constructor(private readonly dialogRef: MatDialogRef<MissionCreateDialogComponent>) {}

  public onModeChange(mode: LocationMode): void {
    this.locationMode.set(mode);
    if (mode === LocationMode.MANUAL) {
      this.selectedBase.set(null);
      this.locationForm.reset();
    }
  }

  public onBaseSelect(base: MilitaryBase): void {
    this.selectedBase.set(base);
    this.locationForm.patchValue({
      latitude: base.latitude,
      longitude: base.longitude,
      altitude: base.altitude,
    });
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public onSubmit(): void {
    if (this.isFormInvalid()) {
      return;
    }

    const mission: Mission = {
      id: crypto.randomUUID(),
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

    this.dialogRef.close(mission);
  }

  private isFormInvalid(): boolean {
    return this.basicInfoForm.invalid || this.timeWindowForm.invalid || this.locationForm.invalid;
  }
}
