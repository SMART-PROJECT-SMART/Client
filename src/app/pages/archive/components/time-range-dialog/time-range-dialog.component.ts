import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OWL_DATE_TIME_FORMATS } from '@danielmoncada/angular-datetime-picker';
import { OWL_TIME_FORMATS } from '../../../../common/constants/owl-datetime.constants';
import { DateTimeUtil } from '../../../../common/utils/date-time.util';

const TIME_RANGE_DIALOG_OWL_FORMATS = {
  ...OWL_TIME_FORMATS,
  timePickerInput: {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  } as Intl.DateTimeFormatOptions,
};

export interface TimeRangeDialogData {
  from: Date;
  to: Date;
  boundsDisplay: string;
  minBound: Date;
  maxBound: Date;
}

export interface TimeRangeDialogResult {
  from: Date;
  to: Date;
}

@Component({
  selector: 'app-time-range-dialog',
  standalone: false,
  templateUrl: './time-range-dialog.component.html',
  styleUrl: './time-range-dialog.component.scss',
  providers: [
    { provide: OWL_DATE_TIME_FORMATS, useValue: TIME_RANGE_DIALOG_OWL_FORMATS },
  ],
})
export class TimeRangeDialogComponent {
  readonly rangeForm: FormGroup;
  readonly boundsDisplay: string;
  private readonly minBound: Date;
  private readonly maxBound: Date;

  constructor(
    private readonly dialogRef: MatDialogRef<TimeRangeDialogComponent, TimeRangeDialogResult | undefined>,
    @Inject(MAT_DIALOG_DATA) data: TimeRangeDialogData,
    fb: FormBuilder,
  ) {
    this.boundsDisplay = data.boundsDisplay;
    this.minBound = new Date(data.minBound);
    this.maxBound = new Date(data.maxBound);
    const from = new Date(data.from);
    const to = new Date(data.to);
    this.rangeForm = fb.group({
      startDate: [from, Validators.required],
      startTime: [new Date(from.getTime())],
      endDate: [to, Validators.required],
      endTime: [new Date(to.getTime())],
    });
  }

  get isValid(): boolean {
    if (this.rangeForm.invalid) return false;
    const result = this.buildResult();
    if (result === null || !this.isFiniteRange(result) || result.from > result.to) return false;
    return this.isWithinDataBounds(result);
  }

  get isInvalidRange(): boolean {
    const result = this.buildResult();
    return result !== null && this.isFiniteRange(result) && result.from > result.to;
  }

  get isOutOfDataBounds(): boolean {
    const result = this.buildResult();
    if (result === null || !this.isFiniteRange(result) || result.from > result.to) return false;
    return !this.isWithinDataBounds(result);
  }

  onApply(): void {
    const result = this.buildResult();
    if (!result || !this.isFiniteRange(result) || result.from > result.to) return;
    if (!this.isWithinDataBounds(result)) return;
    const fromMs = Math.max(result.from.getTime(), this.minBound.getTime());
    const toMs = Math.min(result.to.getTime(), this.maxBound.getTime());
    this.dialogRef.close({
      from: new Date(fromMs),
      to: new Date(toMs),
    });
  }

  private buildResult(): TimeRangeDialogResult | null {
    const { startDate, startTime, endDate, endTime } = this.rangeForm.getRawValue();
    if (!startDate || !endDate) return null;
    const timeStart = startTime as string | Date | null | undefined;
    const timeEnd = endTime as string | Date | null | undefined;
    if (timeStart === null || timeStart === undefined || timeEnd === null || timeEnd === undefined) {
      return null;
    }
    if (typeof timeStart === 'string' && timeStart.trim() === '') return null;
    if (typeof timeEnd === 'string' && timeEnd.trim() === '') return null;
    const from = DateTimeUtil.combineDateAndTime(startDate as Date, timeStart);
    const to = DateTimeUtil.combineDateAndTime(endDate as Date, timeEnd);
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime())) return null;
    return { from, to };
  }

  private isFiniteRange(result: TimeRangeDialogResult): boolean {
    return Number.isFinite(result.from.getTime()) && Number.isFinite(result.to.getTime());
  }

  private isWithinDataBounds(result: TimeRangeDialogResult): boolean {
    const toSec = (ms: number) => Math.floor(ms / 1000);
    const startSec = toSec(result.from.getTime());
    const endSec = toSec(result.to.getTime());
    const minSec = toSec(this.minBound.getTime());
    const maxSec = toSec(this.maxBound.getTime());
    return startSec >= minSec && endSec <= maxSec;
  }
}
