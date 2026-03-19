import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  viewChild,
  inject,
  DestroyRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { merge } from 'rxjs';
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
export class MissionCreateDialogComponent implements AfterViewInit, OnDestroy {
  public readonly stepper = viewChild.required<MatStepper>('stepper');
  private readonly document = inject(DOCUMENT);
  private validOverrideStyle: HTMLStyleElement | null = null;
  private static readonly VALID_OVERRIDE_STYLE_ID = 'mission-stepper-valid-override';

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
      startTime: new FormControl<Date | null>(null, [Validators.required]),
      endDate: new FormControl<Date | null>(null, [Validators.required]),
      endTime: new FormControl<Date | null>(null, [Validators.required]),
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

  private readonly dialogRef = inject(MatDialogRef<MissionCreateDialogComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    this.appendValidOverrideStyle();
  }

  private appendValidOverrideStyle(): void {
    this.validOverrideStyle?.remove();
    this.validOverrideStyle = null;
    const style = this.document.createElement('style');
    style.id = MissionCreateDialogComponent.VALID_OVERRIDE_STYLE_ID;
    style.textContent = `
.mission-stepper.current-step-valid .mat-step-header[aria-selected="true"] .mat-step-icon,
.mission-stepper.current-step-valid .mat-step-header[aria-selected="true"] .mat-step-icon.mat-step-icon-state-edit,
.mission-stepper.current-step-valid .mat-step-header[aria-selected="true"] .mat-step-icon.mat-step-icon-state-number {
  background-color: #66bb6a !important;
  color: #f5f5f5 !important;
}
.mission-stepper.step-1-valid-when-back .mat-horizontal-stepper-header-container .mat-step-header:nth-child(3):not([aria-selected="true"]) .mat-step-icon {
  background-color: #66bb6a !important;
  color: #f5f5f5 !important;
}`;
    this.document.head.appendChild(style);
    this.validOverrideStyle = style;
  }

  ngOnDestroy(): void {
    this.validOverrideStyle?.remove();
    this.validOverrideStyle = null;
  }

  constructor() {
    merge(
      this.basicInfoForm.statusChanges,
      this.timeWindowForm.statusChanges,
      this.locationForm.statusChanges
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());

    merge(
      this.basicInfoForm.valueChanges,
      this.timeWindowForm.valueChanges,
      this.locationForm.valueChanges
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

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

  public onStepChange(): void {
    this.cdr.markForCheck();
    queueMicrotask(() => this.appendValidOverrideStyle());
  }

  private getCurrentForm(): FormGroup {
    const idx = this.stepper().selectedIndex;
    if (idx === 0) return this.basicInfoForm;
    if (idx === 1) return this.timeWindowForm;
    return this.locationForm;
  }

  public isCurrentStepValid(): boolean {
    return this.getCurrentForm().valid;
  }

  public isCurrentStepInvalid(): boolean {
    const form = this.getCurrentForm();
    return form.invalid && (form.touched || form.dirty);
  }

  public isCurrentStepEditing(): boolean {
    return !this.isCurrentStepValid() && !this.isCurrentStepInvalid();
  }

  public isStep0Complete(): boolean {
    return this.stepper().selectedIndex >= 1;
  }

  public isStep1Complete(): boolean {
    return this.stepper().selectedIndex >= 2;
  }

  public isStep1ValidWhenBack(): boolean {
    return this.stepper().selectedIndex === 0 && this.timeWindowForm.valid;
  }
}
