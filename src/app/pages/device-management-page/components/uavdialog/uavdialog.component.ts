import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PlatformType, BaseLocation } from '../../../../common/enums';
import { EnumUtil } from '../../../../common/utils';
import { ClientConstants } from '../../../../common';
import type { UAVRo } from '../../../../models/Ro/uavRO.ro';
import type { CreateUAVDto } from '../../../../models/dto/createUAV.dto';
import type { UpdateUAVDto } from '../../../../models/dto/updateUAVDto.dto';

const { DeviceValidationConstants, BaseLocationConfig } = ClientConstants;

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
  public readonly baseLocations = Object.values(BaseLocation);
  public readonly EnumUtil = EnumUtil;
  public readonly DeviceValidationConstants = DeviceValidationConstants;

  public readonly uavForm = new FormGroup({
    tailId: new FormControl<number | null>(
      { value: this.data.uav?.tailId ?? null, disabled: this.isEditMode },
      [
        Validators.required,
        Validators.min(DeviceValidationConstants.TAIL_ID_MIN),
        Validators.max(DeviceValidationConstants.TAIL_ID_MAX),
      ],
    ),
    platformType: new FormControl<string>(this.data.uav?.platformType ?? '', [Validators.required]),
    baseLocation: new FormControl<string>(this.getInitialBaseLocation(), [Validators.required]),
  });

  private getInitialBaseLocation(): string {
    if (this.data.uav?.baseLocation) {
      return BaseLocationConfig.getBaseFromCoordinates(this.data.uav.baseLocation) ?? '';
    }
    return '';
  }

  public onSubmit(): void {
    if (this.uavForm.invalid) {
      this.uavForm.markAllAsTouched();
      return;
    }

    const selectedBase = this.uavForm.value.baseLocation as BaseLocation;
    const baseLocation = BaseLocationConfig.getCoordinates(selectedBase);

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
