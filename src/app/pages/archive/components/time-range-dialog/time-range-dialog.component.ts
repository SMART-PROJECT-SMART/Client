import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OWL_DATE_TIME_FORMATS } from '@danielmoncada/angular-datetime-picker';
import type { Dayjs } from 'dayjs';
import { OWL_TIME_FORMATS } from '../../../../common/constants/owl-datetime.constants';
import { DateTimeUtil } from '../../../../common/utils/date-time.util';
import { DaterangepickerComponent } from 'ngx-daterangepicker-material';
import {
  CalendarDayEndTimeParts,
  CalendarDayStartTimeParts,
  TimeRangeEndTimeLabel,
  TimeRangeStartTimeLabel,
  TimeRangeTimeInputPlaceholder,
} from './time-range-dialog.constants';
import {
  dayjsToUtcDateOnlyAnchor,
  startOfCalendarDayFromMillis,
} from './time-range-dialog-calendar.util';
import { createTimeRangeDialogInitialState } from './time-range-dialog-initial-state.factory';
import {
  TimeRangeDialogData,
  TimeRangeDialogResult,
  TimeRangeFormRawValue,
} from './time-range-dialog.models';
import {
  resolveSelectableRangeWithinBounds,
  utcCalendarDayEndInstant,
  utcCalendarDayStartInstant,
} from '../../utils/time-range-dialog-bounds.util';

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
  providers: [{ provide: OWL_DATE_TIME_FORMATS, useValue: TIME_RANGE_DIALOG_OWL_FORMATS }],
})
export class TimeRangeDialogComponent implements AfterViewInit {
  readonly useUtcCalendar: boolean;
  readonly startTimeLabel = TimeRangeStartTimeLabel;
  readonly endTimeLabel = TimeRangeEndTimeLabel;
  readonly timeInputPlaceholder = TimeRangeTimeInputPlaceholder;
  readonly emptyPickerRanges: Record<string, [Dayjs, Dayjs]> = {};
  readonly rangeForm: FormGroup;
  readonly boundsDisplay: string;
  readonly minDayjs: Dayjs;
  readonly maxDayjs: Dayjs;
  readonly minDateBoundStr: string;
  readonly maxDateBoundStr: string;
  pickerStart: Dayjs;
  pickerEnd: Dayjs | null;

  private readonly initialPickerStart: Dayjs;
  private readonly initialPickerEnd: Dayjs;
  private readonly initialStartTime: Date;
  private readonly initialEndTime: Date;

  private readonly minBound: Date;
  private readonly maxBound: Date;

  @ViewChild(DaterangepickerComponent) private dateRangePicker?: DaterangepickerComponent;

  constructor(
    private readonly dialogRef: MatDialogRef<TimeRangeDialogComponent, TimeRangeDialogResult | undefined>,
    @Inject(MAT_DIALOG_DATA) data: TimeRangeDialogData,
    fb: FormBuilder,
  ) {
    this.useUtcCalendar = data.useUtcCalendar === true;
    this.boundsDisplay = data.boundsDisplay;
    this.minBound = new Date(data.minBound);
    this.maxBound = new Date(data.maxBound);
    const from = new Date(data.from);
    const to = new Date(data.to);
    this.initialStartTime = new Date(from.getTime());
    this.initialEndTime = new Date(to.getTime());

    const initial = createTimeRangeDialogInitialState(fb, from, to, this.minBound, this.maxBound, this.useUtcCalendar);
    this.minDayjs = initial.minDayjs;
    this.maxDayjs = initial.maxDayjs;
    this.minDateBoundStr = initial.minDateBoundStr;
    this.maxDateBoundStr = initial.maxDateBoundStr;
    this.initialPickerStart = initial.initialPickerStart;
    this.initialPickerEnd = initial.initialPickerEnd;
    this.pickerStart = initial.pickerStart;
    this.pickerEnd = initial.pickerEnd;
    this.rangeForm = initial.rangeForm;
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
    if (this.pickerEnd === null) return false;
    if (this.rangeForm.invalid) return false;
    const result = this.buildResult();
    if (result === null || !this.isFiniteRange(result) || result.from > result.to) return false;
    return this.resolveAgainstBounds(result) !== null;
  }

  get isInvalidRange(): boolean {
    const result = this.buildResult();
    return result !== null && this.isFiniteRange(result) && result.from > result.to;
  }

  get isOutOfDataBounds(): boolean {
    const result = this.buildResult();
    if (result === null || !this.isFiniteRange(result) || result.from > result.to) return false;
    return this.resolveAgainstBounds(result) === null;
  }

  onPickerDatesUpdated(period: unknown): void {
    const p = period as { startDate: Dayjs | null; endDate: Dayjs | null };
    if (!p.startDate && !p.endDate) {
      this.restoreInitialDateRangeFromDialogOpen();
      return;
    }
    if (!p.startDate || !p.endDate) {
      return;
    }
    const useUtc = this.useUtcCalendar;
    this.pickerStart = startOfCalendarDayFromMillis(p.startDate.valueOf(), useUtc);
    this.pickerEnd = startOfCalendarDayFromMillis(p.endDate.valueOf(), useUtc);
    this.patchDateRangeFromPicker();
  }

  onPickerStartDateChangedFromLibrary(payload: unknown): void {
    const emitted = payload as { startDate: { valueOf: () => number } };
    const picker = this.dateRangePicker;
    const useUtc = this.useUtcCalendar;
    this.pickerStart = startOfCalendarDayFromMillis(emitted.startDate.valueOf(), useUtc);
    if (!picker?.endDate) {
      this.pickerEnd = null;
    } else {
      this.pickerEnd = startOfCalendarDayFromMillis(picker.endDate.valueOf(), useUtc);
    }
  }

  onPickerEndDateChangedFromLibrary(payload: unknown): void {
    const emitted = payload as { endDate: { valueOf: () => number } };
    this.pickerEnd = startOfCalendarDayFromMillis(emitted.endDate.valueOf(), this.useUtcCalendar);
  }

  private restoreInitialDateRangeFromDialogOpen(): void {
    this.pickerStart = this.initialPickerStart.clone();
    this.pickerEnd = this.initialPickerEnd.clone();
    this.patchDateRangeFromPicker();
    if (this.useUtcCalendar) {
      this.rangeForm.patchValue({
        startTime: DateTimeUtil.utcTimeStringFromDate(this.initialStartTime),
        endTime: DateTimeUtil.utcTimeStringFromDate(this.initialEndTime),
      });
    } else {
      this.rangeForm.patchValue({
        startTime: DateTimeUtil.localTimeOfDayForPicker(this.initialStartTime),
        endTime: DateTimeUtil.localTimeOfDayForPicker(this.initialEndTime),
      });
    }
    this.syncInlinePickerViewFromBindings();
  }

  private syncInlinePickerViewFromBindings(): void {
    const picker = this.dateRangePicker;
    if (!picker) {
      return;
    }
    picker.startDate = this.pickerStart;
    (picker as unknown as { endDate: Dayjs | null }).endDate = this.pickerEnd;
    picker.updateView();
  }

  onApply(): void {
    const result = this.buildResult();
    if (!result || !this.isFiniteRange(result) || result.from > result.to) return;
    const clamped = this.resolveAgainstBounds(result);
    if (!clamped) return;
    this.dialogRef.close({
      from: clamped.from,
      to: clamped.to,
    });
  }

  private syncPickerModelIntoForm(): void {
    const picker = this.dateRangePicker;
    if (this.pickerEnd === null) {
      return;
    }
    if (!picker?.startDate) {
      this.patchDateRangeFromPicker();
      return;
    }
    if (!picker.endDate) {
      picker.setEndDate(picker.startDate);
    }
    const useUtc = this.useUtcCalendar;
    const nextStart = startOfCalendarDayFromMillis(picker.startDate.valueOf(), useUtc);
    const nextEnd = startOfCalendarDayFromMillis(picker.endDate.valueOf(), useUtc);
    if (nextStart.valueOf() === this.pickerStart.valueOf() && nextEnd.valueOf() === this.pickerEnd.valueOf()) {
      return;
    }
    this.pickerStart = nextStart;
    this.pickerEnd = nextEnd;
    this.patchDateRangeFromPicker();
  }

  private patchDateRangeFromPicker(): void {
    if (this.pickerEnd === null) {
      return;
    }
    const start = this.pickerStart.clone().startOf('day');
    const end = this.pickerEnd.clone().startOf('day');
    this.pickerStart = start;
    this.pickerEnd = end;
    if (this.useUtcCalendar) {
      this.dateRangeGroup.patchValue({
        start: dayjsToUtcDateOnlyAnchor(start),
        end: dayjsToUtcDateOnlyAnchor(end),
      });
    } else {
      this.dateRangeGroup.patchValue({
        start: start.toDate(),
        end: end.toDate(),
      });
    }
  }

  private buildResult(): TimeRangeDialogResult | null {
    this.syncPickerModelIntoForm();
    const raw = this.rangeForm.getRawValue() as TimeRangeFormRawValue;
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
    if (this.useUtcCalendar) {
      const from = DateTimeUtil.combineUtcDateAndTime(startDate, timeStart as string);
      const to = DateTimeUtil.combineUtcDateAndTime(endDate, timeEnd as string);
      if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime())) return null;
      if (from.getTime() > to.getTime() && this.sameUtcCalendarDay(startDate, endDate)) {
        return {
          from: utcCalendarDayStartInstant(startDate),
          to: utcCalendarDayEndInstant(endDate),
        };
      }
      return { from, to };
    }
    const from = DateTimeUtil.combineDateAndTime(startDate, timeStart);
    const to = DateTimeUtil.combineDateAndTime(endDate, timeEnd);
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime())) return null;
    if (from.getTime() > to.getTime() && this.sameLocalCalendarDay(startDate, endDate)) {
      return {
        from: this.localStartOfCalendarDay(startDate),
        to: this.localEndOfCalendarDay(endDate),
      };
    }
    return { from, to };
  }

  private localStartOfCalendarDay(anchor: Date): Date {
    return new Date(
      anchor.getFullYear(),
      anchor.getMonth(),
      anchor.getDate(),
      CalendarDayStartTimeParts.hour,
      CalendarDayStartTimeParts.minute,
      CalendarDayStartTimeParts.second,
      CalendarDayStartTimeParts.millisecond,
    );
  }

  private localEndOfCalendarDay(anchor: Date): Date {
    return new Date(
      anchor.getFullYear(),
      anchor.getMonth(),
      anchor.getDate(),
      CalendarDayEndTimeParts.hour,
      CalendarDayEndTimeParts.minute,
      CalendarDayEndTimeParts.second,
      CalendarDayEndTimeParts.millisecond,
    );
  }

  private sameUtcCalendarDay(a: Date, b: Date): boolean {
    return (
      a.getUTCFullYear() === b.getUTCFullYear() &&
      a.getUTCMonth() === b.getUTCMonth() &&
      a.getUTCDate() === b.getUTCDate()
    );
  }

  private sameLocalCalendarDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private isFiniteRange(result: TimeRangeDialogResult): boolean {
    return Number.isFinite(result.from.getTime()) && Number.isFinite(result.to.getTime());
  }

  private resolveAgainstBounds(direct: TimeRangeDialogResult): TimeRangeDialogResult | null {
    const raw = this.rangeForm.getRawValue() as TimeRangeFormRawValue;
    return resolveSelectableRangeWithinBounds({
      direct,
      useUtcCalendar: this.useUtcCalendar,
      calendarStartDate: raw.dateRange?.start ?? null,
      calendarEndDate: raw.dateRange?.end ?? null,
      minBound: this.minBound,
      maxBound: this.maxBound,
    });
  }
}
