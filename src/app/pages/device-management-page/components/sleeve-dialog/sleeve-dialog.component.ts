import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClientConstants } from '../../../../common';
import { uniqueSleeveNameValidator } from '../../../../common/validators';
import type { SleeveRo } from '../../../../models/Ro/sleeveRo.ro';
import type { CreateSleeveDto } from '../../../../models/dto/createSleeveDto.dto';
import type { UpdateSleeveDto } from '../../../../models/dto/updateSleeveDto.dto';

const { DeviceValidationConstants, ValidationConstants } = ClientConstants;
const { LocationValidation } = ValidationConstants;

interface SleeveDialogData {
  mode: 'create' | 'edit';
  sleeve?: SleeveRo;
  existingSleeves?: SleeveRo[];
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
  public readonly ports = signal<number[]>(
    this.data.sleeve
      ? [...this.data.sleeve.portNumbers.slice(0, DeviceValidationConstants.SLEEVE_PORT_COUNT)]
      : [],
  );
  public readonly portsInteracted = signal(false);
  public readonly portInput = new FormControl<number | null>(null);

  public readonly sleeveForm = new FormGroup({
    name: new FormControl<string>(this.data.sleeve?.name ?? '', [
      Validators.required,
      Validators.minLength(DeviceValidationConstants.SLEEVE_NAME_MIN_LENGTH),
      Validators.maxLength(DeviceValidationConstants.SLEEVE_NAME_MAX_LENGTH),
      uniqueSleeveNameValidator(
        (this.data.existingSleeves ?? []).map((s) => s.name),
        this.isEditMode ? this.data.sleeve?.name : undefined,
      ),
    ]),
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
  });

  private isPortUsedByOthers(port: number): boolean {
    const existingSleeves = this.data.existingSleeves ?? [];
    return existingSleeves.some((s) =>
      s.name !== this.data.sleeve?.name && s.portNumbers.includes(port)
    );
  }

  public addPort(): void {
    if (this.ports().length >= DeviceValidationConstants.SLEEVE_PORT_COUNT) return;
    this.portInput.markAsTouched();
    const error = this.validatePort();
    if (error) {
      this.portInput.setErrors(error);
      return;
    }

    this.ports.update((p) => [...p, Number(this.portInput.value)]);
    this.portInput.setValue(null);
    this.portInput.setErrors(null);
    this.portsInteracted.set(true);
  }

  private validatePort(): Record<string, boolean> | null {
    const value = Number(this.portInput.value);

    if (this.portInput.value === null || isNaN(value)) return { required: true };
    if (value < DeviceValidationConstants.PORT_NUMBER_MIN || value > DeviceValidationConstants.PORT_NUMBER_MAX) return { outOfRange: true };
    if (this.ports().includes(value)) return { duplicate: true };
    if (this.isPortUsedByOthers(value)) return { usedByOther: true };

    return null;
  }

  public removePort(portToRemove: number): void {
    this.ports.update((ports) => ports.filter((p) => p !== portToRemove));
    this.portsInteracted.set(true);
  }

  public onPortInputChange(): void {
    if (this.portInput.value === null) {
      this.portInput.setErrors(null);
      return;
    }
    const error = this.validatePort();
    this.portInput.setErrors(error?.['required'] ? null : error);
  }

  public onSubmit(): void {
    if (this.sleeveForm.invalid || this.ports().length !== DeviceValidationConstants.SLEEVE_PORT_COUNT) {
      this.sleeveForm.markAllAsTouched();
      return;
    }

    const location = {
      latitude: this.sleeveForm.value.latitude!,
      longitude: this.sleeveForm.value.longitude!,
      altitude: 0,
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
