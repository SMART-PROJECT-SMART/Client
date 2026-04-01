import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OWL_DATE_TIME_FORMATS } from '@danielmoncada/angular-datetime-picker';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { OWL_TIME_FORMATS } from '../../../../common/constants/owl-datetime.constants';
import { DateTimeUtil } from '../../../../common/utils/date-time.util';
import { DaterangepickerComponent } from 'ngx-daterangepicker-material';
import {
  CalendarDayEndTimeParts,
  CalendarDayStartTimeParts,
  TimeRangeEndTimeLabel,
  TimeRangePickerBoundDateFormat,
  TimeRangeResetRangeLabel,
  TimeRangeStartTimeLabel,
  TimeRangeTimeInputPlaceholder,
  UtcTimeOfDayStringPattern,
} from './time-range-dialog.constants';
import { TimeRangeDialogData, TimeRangeDialogResult } from './time-range-dialog.models';

dayjs.extend(utc);

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
  readonly resetRangeLabel = TimeRangeResetRangeLabel;
  readonly timeInputPlaceholder = TimeRangeTimeInputPlaceholder;
  readonly emptyPickerRanges: Record<string, [Dayjs, Dayjs]> = {};
  readonly rangeForm: FormGroup;
  readonly boundsDisplay: string;
  readonly minDayjs: Dayjs;
  readonly maxDayjs: Dayjs;
  readonly minDateBoundStr: string;
  readonly maxDateBoundStr: string;
  pickerStart: Dayjs;
  pickerEnd: Dayjs;

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

    if (this.useUtcCalendar) {
      this.minDayjs = dayjs.utc(this.minBound).startOf('day');
      this.maxDayjs = dayjs.utc(this.maxBound).startOf('day');
      this.minDateBoundStr = this.minDayjs.format(TimeRangePickerBoundDateFormat);
      this.maxDateBoundStr = this.maxDayjs.format(TimeRangePickerBoundDateFormat);
      const startDateOnly = this.stripToDateOnlyUtc(from);
      const endDateOnly = this.stripToDateOnlyUtc(to);
      this.initialPickerStart = dayjs.utc(from).startOf('day');
      this.initialPickerEnd = dayjs.utc(to).startOf('day');
      this.pickerStart = this.initialPickerStart.clone();
      this.pickerEnd = this.initialPickerEnd.clone();
      this.rangeForm = fb.group({
        dateRange: fb.group({
          start: [startDateOnly, Validators.required],
          end: [endDateOnly, Validators.required],
        }),
        startTime: [
          DateTimeUtil.utcTimeStringFromDate(from),
          [Validators.required, Validators.pattern(UtcTimeOfDayStringPattern)],
        ],
        endTime: [
          DateTimeUtil.utcTimeStringFromDate(to),
          [Validators.required, Validators.pattern(UtcTimeOfDayStringPattern)],
        ],
      });
    } else {
      this.minDayjs = dayjs(this.stripToDateOnlyLocal(this.minBound)).startOf('day');
      this.maxDayjs = dayjs(this.stripToDateOnlyLocal(this.maxBound)).startOf('day');
      this.minDateBoundStr = this.minDayjs.format(TimeRangePickerBoundDateFormat);
      this.maxDateBoundStr = this.maxDayjs.format(TimeRangePickerBoundDateFormat);
      const startDateOnly = this.stripToDateOnlyLocal(from);
      const endDateOnly = this.stripToDateOnlyLocal(to);
      this.initialPickerStart = dayjs(startDateOnly).startOf('day');
      this.initialPickerEnd = dayjs(endDateOnly).startOf('day');
      this.pickerStart = this.initialPickerStart.clone();
      this.pickerEnd = this.initialPickerEnd.clone();
      this.rangeForm = fb.group({
        dateRange: fb.group({
          start: [startDateOnly, Validators.required],
          end: [endDateOnly, Validators.required],
        }),
        startTime: [DateTimeUtil.localTimeOfDayForPicker(from)],
        endTime: [DateTimeUtil.localTimeOfDayForPicker(to)],
      });
    }
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
    return this.intersectResultWithBoundsOrUtcCalendarEnvelope(result) !== null;
  }

  get isInvalidRange(): boolean {
    const result = this.buildResult();
    return result !== null && this.isFiniteRange(result) && result.from > result.to;
  }

  get isOutOfDataBounds(): boolean {
    const result = this.buildResult();
    if (result === null || !this.isFiniteRange(result) || result.from > result.to) return false;
    return this.intersectResultWithBoundsOrUtcCalendarEnvelope(result) === null;
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
    if (this.useUtcCalendar) {
      this.pickerStart = dayjs.utc(p.startDate.valueOf()).startOf('day');
      this.pickerEnd = dayjs.utc(p.endDate.valueOf()).startOf('day');
    } else {
      this.pickerStart = dayjs(p.startDate.valueOf()).startOf('day');
      this.pickerEnd = dayjs(p.endDate.valueOf()).startOf('day');
    }
    this.patchDateRangeFromPicker();
  }

  resetRangeToInitial(): void {
    this.restoreInitialDateRangeFromDialogOpen();
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
    picker.endDate = this.pickerEnd;
    picker.updateView();
  }

  onApply(): void {
    const result = this.buildResult();
    if (!result || !this.isFiniteRange(result) || result.from > result.to) return;
    const clamped = this.intersectResultWithBoundsOrUtcCalendarEnvelope(result);
    if (!clamped) return;
    this.dialogRef.close({
      from: clamped.from,
      to: clamped.to,
    });
  }

  private syncPickerModelIntoForm(): void {
    const picker = this.dateRangePicker;
    if (!picker?.startDate) {
      this.patchDateRangeFromPicker();
      return;
    }
    if (!picker.endDate) {
      picker.setEndDate(picker.startDate);
    }
    let nextStart;
    let nextEnd;
    if (this.useUtcCalendar) {
      nextStart = dayjs.utc(picker.startDate.valueOf()).startOf('day');
      nextEnd = dayjs.utc(picker.endDate.valueOf()).startOf('day');
    } else {
      nextStart = dayjs(picker.startDate.valueOf()).startOf('day');
      nextEnd = dayjs(picker.endDate.valueOf()).startOf('day');
    }
    if (nextStart.valueOf() === this.pickerStart.valueOf() && nextEnd.valueOf() === this.pickerEnd.valueOf()) {
      return;
    }
    this.pickerStart = nextStart;
    this.pickerEnd = nextEnd;
    this.patchDateRangeFromPicker();
  }

  private patchDateRangeFromPicker(): void {
    if (this.useUtcCalendar) {
      const start = this.pickerStart.clone().startOf('day');
      const end = this.pickerEnd.clone().startOf('day');
      this.pickerStart = start;
      this.pickerEnd = end;
      this.dateRangeGroup.patchValue({
        start: this.toUtcDateOnlyAnchor(start),
        end: this.toUtcDateOnlyAnchor(end),
      });
    } else {
      const start = this.pickerStart.clone().startOf('day');
      const end = this.pickerEnd.clone().startOf('day');
      this.pickerStart = start;
      this.pickerEnd = end;
      this.dateRangeGroup.patchValue({
        start: start.toDate(),
        end: end.toDate(),
      });
    }
  }

  private buildResult(): TimeRangeDialogResult | null {
    this.syncPickerModelIntoForm();
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
    if (this.useUtcCalendar) {
      const from = DateTimeUtil.combineUtcDateAndTime(startDate, timeStart as string);
      const to = DateTimeUtil.combineUtcDateAndTime(endDate, timeEnd as string);
      if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime())) return null;
      if (from.getTime() > to.getTime() && this.sameUtcCalendarDay(startDate, endDate)) {
        return {
          from: this.utcStartOfCalendarDay(startDate),
          to: this.utcEndOfCalendarDay(endDate),
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

  private utcStartOfCalendarDay(anchor: Date): Date {
    return new Date(
      Date.UTC(
        anchor.getUTCFullYear(),
        anchor.getUTCMonth(),
        anchor.getUTCDate(),
        CalendarDayStartTimeParts.hour,
        CalendarDayStartTimeParts.minute,
        CalendarDayStartTimeParts.second,
        CalendarDayStartTimeParts.millisecond,
      ),
    );
  }

  private utcEndOfCalendarDay(anchor: Date): Date {
    return new Date(
      Date.UTC(
        anchor.getUTCFullYear(),
        anchor.getUTCMonth(),
        anchor.getUTCDate(),
        CalendarDayEndTimeParts.hour,
        CalendarDayEndTimeParts.minute,
        CalendarDayEndTimeParts.second,
        CalendarDayEndTimeParts.millisecond,
      ),
    );
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

  private intersectResultWithBoundsOrUtcCalendarEnvelope(
    result: TimeRangeDialogResult,
  ): TimeRangeDialogResult | null {
    const direct = this.intersectResultWithBounds(result);
    if (direct !== null) {
      return direct;
    }
    if (!this.useUtcCalendar) {
      return null;
    }
    const raw = this.rangeForm.getRawValue() as { dateRange: { start: Date | null; end: Date | null } };
    const startDate = raw.dateRange?.start;
    const endDate = raw.dateRange?.end;
    if (!startDate || !endDate) {
      return null;
    }
    const envelope: TimeRangeDialogResult = {
      from: this.utcStartOfCalendarDay(startDate),
      to: this.utcEndOfCalendarDay(endDate),
    };
    return this.intersectResultWithBounds(envelope);
  }

  private intersectResultWithBounds(result: TimeRangeDialogResult): TimeRangeDialogResult | null {
    const fromMs = Math.max(result.from.getTime(), this.minBound.getTime());
    const toMs = Math.min(result.to.getTime(), this.maxBound.getTime());
    if (fromMs > toMs) {
      return null;
    }
    return { from: new Date(fromMs), to: new Date(toMs) };
  }

  private stripToDateOnlyLocal(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private stripToDateOnlyUtc(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  private toUtcDateOnlyAnchor(d: Dayjs): Date {
    return new Date(Date.UTC(d.year(), d.month(), d.date()));
  }
}
