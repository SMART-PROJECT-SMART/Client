import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OWL_DATE_TIME_FORMATS } from '@danielmoncada/angular-datetime-picker';
import dayjs, { Dayjs } from 'dayjs';
import { OWL_TIME_FORMATS } from '../../../../common/constants/owl-datetime.constants';
import { DateTimeUtil } from '../../../../common/utils/date-time.util';
import { DaterangepickerComponent } from 'ngx-daterangepicker-material';
import {
  TimeRangeFlexOffsetByKey,
  TimeRangeFlexPill,
  TimeRangeFlexPillKey,
  TimeRangeFlexPillLabels,
  TimeRangeFlexPillOrder,
  TimeRangePickerBoundDateFormat,
} from './time-range-dialog.constants';
import { TimeRangeDialogData, TimeRangeDialogResult } from './time-range-dialog.models';

const TIME_RANGE_DIALOG_OWL_FORMATS = {
  ...OWL_TIME_FORMATS,
  timePickerInput: {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  } as Intl.DateTimeFormatOptions,
};

@Component({
  selector: 'app-time-range-dialog',
  standalone: false,
  templateUrl: './time-range-dialog.component.html',
  styleUrl: './time-range-dialog.component.scss',
  providers: [
    { provide: OWL_DATE_TIME_FORMATS, useValue: TIME_RANGE_DIALOG_OWL_FORMATS },
  ],
})
export class TimeRangeDialogComponent implements AfterViewInit {
  readonly emptyPickerRanges: Record<string, [Dayjs, Dayjs]> = {};
  readonly rangeForm: FormGroup;
  readonly boundsDisplay: string;
  readonly minDayjs: Dayjs;
  readonly maxDayjs: Dayjs;
  readonly minDateBoundStr: string;
  readonly maxDateBoundStr: string;
  readonly flexPillKeys = TimeRangeFlexPillOrder;
  readonly flexPillLabels = TimeRangeFlexPillLabels;
  readonly flexPill = TimeRangeFlexPill;
  pickerStart: Dayjs;
  pickerEnd: Dayjs;

  private readonly initialPickerStart: Dayjs;
  private readonly initialPickerEnd: Dayjs;
  private readonly initialStartTime: Date;
  private readonly initialEndTime: Date;

  selectedFlexKey: TimeRangeFlexPillKey | null = TimeRangeFlexPill.EXACT;

  private readonly minBound: Date;
  private readonly maxBound: Date;

  @ViewChild(DaterangepickerComponent) private dateRangePicker?: DaterangepickerComponent;

  constructor(
    private readonly dialogRef: MatDialogRef<TimeRangeDialogComponent, TimeRangeDialogResult | undefined>,
    @Inject(MAT_DIALOG_DATA) data: TimeRangeDialogData,
    fb: FormBuilder,
  ) {
    this.boundsDisplay = data.boundsDisplay;
    this.minBound = new Date(data.minBound);
    this.maxBound = new Date(data.maxBound);
    this.minDayjs = dayjs(this.stripToDateOnly(this.minBound)).startOf('day');
    this.maxDayjs = dayjs(this.stripToDateOnly(this.maxBound)).startOf('day');
    this.minDateBoundStr = this.minDayjs.format(TimeRangePickerBoundDateFormat);
    this.maxDateBoundStr = this.maxDayjs.format(TimeRangePickerBoundDateFormat);
    const from = new Date(data.from);
    const to = new Date(data.to);
    const startDateOnly = this.stripToDateOnly(from);
    const endDateOnly = this.stripToDateOnly(to);
    this.initialPickerStart = dayjs(startDateOnly).startOf('day');
    this.initialPickerEnd = dayjs(endDateOnly).startOf('day');
    this.pickerStart = this.initialPickerStart.clone();
    this.pickerEnd = this.initialPickerEnd.clone();
    this.initialStartTime = new Date(from.getTime());
    this.initialEndTime = new Date(to.getTime());
    this.rangeForm = fb.group({
      dateRange: fb.group({
        start: [startDateOnly, Validators.required],
        end: [endDateOnly, Validators.required],
      }),
      startTime: [new Date(from.getTime())],
      endTime: [new Date(to.getTime())],
    });
  }

  ngAfterViewInit(): void {
    this.ensurePickerCalendarsVisible();
  }

  private ensurePickerCalendarsVisible(): void {
    const picker = this.dateRangePicker;
    if (!picker) {
      return;
    }
    picker.ranges = this.emptyPickerRanges;
    picker.renderRanges();
    picker.updateView();
  }

  get dateRangeGroup(): FormGroup {
    return this.rangeForm.get('dateRange') as FormGroup;
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

  onPickerDatesUpdated(period: { startDate: Dayjs; endDate: Dayjs }): void {
    this.pickerStart = period.startDate;
    this.pickerEnd = period.endDate;
    this.patchDateRangeFromPicker();
    this.selectedFlexKey = null;
  }

  applyExact(): void {
    this.pickerStart = this.initialPickerStart.clone();
    this.pickerEnd = this.initialPickerEnd.clone();
    this.rangeForm.patchValue({
      dateRange: {
        start: this.pickerStart.toDate(),
        end: this.pickerEnd.toDate(),
      },
      startTime: new Date(this.initialStartTime.getTime()),
      endTime: new Date(this.initialEndTime.getTime()),
    });
    this.selectedFlexKey = TimeRangeFlexPill.EXACT;
  }

  applyFlexOffset(key: TimeRangeFlexPillKey): void {
    const offset = TimeRangeFlexOffsetByKey[key];
    if (offset === undefined) {
      return;
    }
    const s = this.pickerStart.startOf('day');
    const e = this.pickerEnd.startOf('day');
    const daySpan = e.diff(s, 'day');
    const mid = s.add(Math.floor(daySpan / 2), 'day');
    let ns = mid.subtract(offset, 'day').startOf('day');
    let ne = mid.add(offset, 'day').startOf('day');
    ns = this.clampDayjsToBounds(ns);
    ne = this.clampDayjsToBounds(ne);
    if (ns.isAfter(ne)) {
      const t = ns;
      ns = ne;
      ne = t;
    }
    this.pickerStart = ns;
    this.pickerEnd = ne;
    this.patchDateRangeFromPicker();
    this.selectedFlexKey = key;
  }

  isPillActive(key: TimeRangeFlexPillKey): boolean {
    return this.selectedFlexKey === key;
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

  private patchDateRangeFromPicker(): void {
    this.dateRangeGroup.patchValue({
      start: this.pickerStart.toDate(),
      end: this.pickerEnd.toDate(),
    });
  }

  private buildResult(): TimeRangeDialogResult | null {
    const raw = this.rangeForm.getRawValue() as {
      dateRange: { start: Date | null; end: Date | null };
      startTime: string | Date | null | undefined;
      endTime: string | Date | null | undefined;
    };
    const startDate = raw.dateRange?.start;
    const endDate = raw.dateRange?.end;
    if (!startDate || !endDate) return null;
    const timeStart = raw.startTime;
    const timeEnd = raw.endTime;
    if (timeStart === null || timeStart === undefined || timeEnd === null || timeEnd === undefined) {
      return null;
    }
    if (typeof timeStart === 'string' && timeStart.trim() === '') return null;
    if (typeof timeEnd === 'string' && timeEnd.trim() === '') return null;
    const from = DateTimeUtil.combineDateAndTime(startDate, timeStart);
    const to = DateTimeUtil.combineDateAndTime(endDate, timeEnd);
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

  private stripToDateOnly(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private clampDayjsToBounds(d: Dayjs): Dayjs {
    if (d.isBefore(this.minDayjs)) {
      return this.minDayjs.clone();
    }
    if (d.isAfter(this.maxDayjs)) {
      return this.maxDayjs.clone();
    }
    return d;
  }
}
