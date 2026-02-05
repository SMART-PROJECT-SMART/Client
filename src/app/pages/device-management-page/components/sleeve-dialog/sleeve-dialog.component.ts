import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClientConstants } from '../../../../common';
import type { SleeveRo } from '../../../../models/Ro/sleeveRo.ro';
import type { CreateSleeveDto } from '../../../../models/dto/createSleeveDto.dto';
import type { UpdateSleeveDto } from '../../../../models/dto/updateSleeveDto.dto';

const { DeviceValidationConstants, ValidationConstants } = ClientConstants;
const { LocationValidation } = ValidationConstants;

interface SleeveDialogData {
  mode: 'create' | 'edit';
  sleeve?: SleeveRo;
}

@Component({
  selector: 'app-sleeve-dialog',
  standalone: false,
  templateUrl: './sleeve-dialog.component.html',
  styleUrl: './sleeve-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SleeveDialogComponent {
  private readonly dialogRef = inject(MatDialogRef);
  private readonly data = inject<SleeveDialogData>(MAT_DIALOG_DATA);

  public readonly isEditMode = this.data.mode === 'edit';
  public readonly LocationValidation = LocationValidation;
  public readonly DeviceValidationConstants = DeviceValidationConstants;
  public readonly ports = signal<number[]>(this.data.sleeve ? [...this.data.sleeve.portNumbers] : []);
  public readonly portInput = new FormControl<number | null>(null);

  public readonly sleeveForm = new FormGroup({
    name: new FormControl<string>(
      { value: this.data.sleeve?.name ?? '', disabled: this.isEditMode },
      [Validators.required, Validators.minLength(DeviceValidationConstants.SLEEVE_NAME_MIN_LENGTH), Validators.maxLength(DeviceValidationConstants.SLEEVE_NAME_MAX_LENGTH)],
    ),
    latitude: new FormControl<number | null>(this.data.sleeve?.location.latitude ?? null, [
      Validators.required,
      Validators.min(LocationValidation.LATITUDE_MIN),
      Validators.max(LocationValidation.LATITUDE_MAX),
    ]),
    longitude: new FormControl<number | null>(this.data.sleeve?.location.longitude ?? null, [
      Validators.required,
      Validators.min(LocationValidation.LONGITUDE_MIN),
      Validators.max(LocationValidation.LONGITUDE_MAX),
    ]),
    altitude: new FormControl<number | null>(this.data.sleeve?.location.altitude ?? null, [
      Validators.required,
      Validators.min(0),
    ]),
  });

  public addPort(): void {
    const value = Number(this.portInput.value);
    this.portInput.markAsTouched();

    if (this.portInput.value === null || isNaN(value)) {
      this.portInput.setErrors({ required: true });
      return;
    }
    if (value < DeviceValidationConstants.PORT_NUMBER_MIN || value > DeviceValidationConstants.PORT_NUMBER_MAX) {
      this.portInput.setErrors({ outOfRange: true });
      return;
    }
    if (this.ports().includes(value)) {
      this.portInput.setErrors({ duplicate: true });
      return;
    }

    this.ports.update((p) => [...p, value]);
    this.portInput.setValue(null);
    this.portInput.setErrors(null);
  }

  public removePort(portToRemove: number): void {
    this.ports.update((ports) => ports.filter((p) => p !== portToRemove));
  }

  public onPortInputChange(): void {
    if (this.portInput.errors) {
      this.portInput.setErrors(null);
    }
  }

  public onSubmit(): void {
    if (this.sleeveForm.invalid || this.ports().length === 0) {
      this.sleeveForm.markAllAsTouched();
      return;
    }

    const location = {
      latitude: this.sleeveForm.value.latitude!,
      longitude: this.sleeveForm.value.longitude!,
      altitude: this.sleeveForm.value.altitude!,
    };

    if (this.isEditMode) {
      const dto: UpdateSleeveDto = {
        location,
        portNumbers: this.ports(),
        assignedToTailId: this.data.sleeve!.assignedToTailId,
      };
      this.dialogRef.close(dto);
    } else {
      const dto: CreateSleeveDto = {
        name: this.sleeveForm.get('name')!.value!,
        location,
        portNumbers: this.ports(),
        assignedToTailId: null,
      };
      this.dialogRef.close(dto);
    }
  }

  public onCancel(): void {
    this.dialogRef.close();
  }
}
