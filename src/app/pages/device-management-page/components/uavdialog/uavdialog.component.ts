import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PlatformType } from '../../../../common/enums';
import { EnumUtil } from '../../../../common/utils';
import { ClientConstants } from '../../../../common';
import type { UAVRo } from '../../../../models/Ro/uavRO.ro';
import type { CreateUAVDto } from '../../../../models/dto/createUAV.dto';
import type { UpdateUAVDto } from '../../../../models/dto/updateUAVDto.dto';

const { DeviceValidationConstants, ValidationConstants } = ClientConstants;
const { LocationValidation } = ValidationConstants;

interface UAVDialogData {
  mode: 'create' | 'edit';
  uav?: UAVRo;
}

@Component({
  selector: 'app-uav-dialog',
  standalone: false,
  templateUrl: './uavdialog.component.html',
  styleUrl: './uavdialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UAVDialogComponent {
  private readonly dialogRef = inject(MatDialogRef);
  private readonly data = inject<UAVDialogData>(MAT_DIALOG_DATA);

  public readonly isEditMode = this.data.mode === 'edit';
  public readonly platformTypes = Object.values(PlatformType);
  public readonly EnumUtil = EnumUtil;
  public readonly LocationValidation = LocationValidation;
  public readonly DeviceValidationConstants = DeviceValidationConstants;

  public readonly uavForm = new FormGroup({
    tailId: new FormControl<number | null>(
      { value: this.data.uav?.tailId ?? null, disabled: this.isEditMode },
      [Validators.required, Validators.min(DeviceValidationConstants.TAIL_ID_MIN), Validators.max(DeviceValidationConstants.TAIL_ID_MAX)],
    ),
    platformType: new FormControl<string>(this.data.uav?.platformType ?? '', [Validators.required]),
    latitude: new FormControl<number | null>(this.data.uav?.baseLocation.latitude ?? null, [
      Validators.required,
      Validators.min(LocationValidation.LATITUDE_MIN),
      Validators.max(LocationValidation.LATITUDE_MAX),
    ]),
    longitude: new FormControl<number | null>(this.data.uav?.baseLocation.longitude ?? null, [
      Validators.required,
      Validators.min(LocationValidation.LONGITUDE_MIN),
      Validators.max(LocationValidation.LONGITUDE_MAX),
    ]),
    altitude: new FormControl<number | null>(this.data.uav?.baseLocation.altitude ?? null, [
      Validators.required,
      Validators.min(0),
    ]),
  });

  public onSubmit(): void {
    if (this.uavForm.invalid) {
      this.uavForm.markAllAsTouched();
      return;
    }

    const baseLocation = {
      latitude: this.uavForm.value.latitude!,
      longitude: this.uavForm.value.longitude!,
      altitude: this.uavForm.value.altitude!,
    };

    if (this.isEditMode) {
      const dto: UpdateUAVDto = {
        tailId: this.data.uav!.tailId,
        platformType: this.uavForm.value.platformType as PlatformType,
        baseLocation,
      };
      this.dialogRef.close(dto);
    } else {
      const dto: CreateUAVDto = {
        tailId: this.uavForm.get('tailId')!.value!,
        platformType: this.uavForm.value.platformType as PlatformType,
        baseLocation,
      };
      this.dialogRef.close(dto);
    }
  }

  public onCancel(): void {
    this.dialogRef.close();
  }
}
