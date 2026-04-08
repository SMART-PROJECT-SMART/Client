import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  afterNextRender,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import type { Dayjs } from 'dayjs';
import { DateTimeUtil } from '../../../../common/utils/date-time.util';
import { DaterangepickerComponent } from 'ngx-daterangepicker-material';
import {
  CalendarDayEndTimeParts,
  CalendarDayStartTimeParts,
  TimeRangeEndTimeLabel,
  TimeRangeEndTimeShortLabel,
  TimeRangeCalendarOutsideMonthCellClass,
  TimeRangeStartTimeLabel,
  TimeRangeStartTimeShortLabel,
  TimeRangeTimeInputPlaceholder,
  TimeRangeTimesGroupTitle,
  TimeRangeValidationEndAfterLastSampleMessage,
  TimeRangeValidationEndBeforeStartMessage,
  TimeRangeValidationStartBeforeFirstSampleMessage,
} from './time-range-dialog.constants';
import { computeNextCalendarSelection } from './time-range-calendar-selection.util';
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
  isClosedRangeFullyWithinTelemetryBounds,
  utcCalendarDayEndInstant,
  utcCalendarDayStartInstant,
} from '../../utils/time-range-dialog-bounds.util';

@Component({
  selector: 'app-time-range-picker-panel',
  standalone: false,
  templateUrl: './time-range-picker-panel.component.html',
  styleUrl: './time-range-picker-panel.component.scss',
})
export class TimeRangePickerPanelComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input({ required: true }) config!: TimeRangeDialogData;

  @Output() readonly applied = new EventEmitter<TimeRangeDialogResult>();
  @Output() readonly dismiss = new EventEmitter<void>();

  readonly timeRangeCalendarOutsideMonthCellClass = TimeRangeCalendarOutsideMonthCellClass;
  readonly startTimeLabel = TimeRangeStartTimeLabel;
  readonly endTimeLabel = TimeRangeEndTimeLabel;
  readonly timesGroupTitle = TimeRangeTimesGroupTitle;
  readonly startTimeShortLabel = TimeRangeStartTimeShortLabel;
  readonly endTimeShortLabel = TimeRangeEndTimeShortLabel;
  readonly timeInputPlaceholder = TimeRangeTimeInputPlaceholder;
  readonly startTimeOpenPickerAriaLabel = `Open ${TimeRangeStartTimeLabel} picker`;
  readonly endTimeOpenPickerAriaLabel = `Open ${TimeRangeEndTimeLabel} picker`;
  readonly emptyPickerRanges: Record<string, [Dayjs, Dayjs]> = {};
  readonly msgEndBeforeStart = TimeRangeValidationEndBeforeStartMessage;
  readonly msgStartBeforeFirstSample = TimeRangeValidationStartBeforeFirstSampleMessage;
  readonly msgEndAfterLastSample = TimeRangeValidationEndAfterLastSampleMessage;
  rangeForm!: FormGroup;
  boundsDisplay = '';
  minDayjs!: Dayjs;
  maxDayjs!: Dayjs;
  minDateBoundStr = '';
  maxDateBoundStr = '';
  pickerStart!: Dayjs;
  pickerEnd: Dayjs | null = null;
  useUtcCalendar = false;

  private initialPickerStart!: Dayjs;
  private initialPickerEnd!: Dayjs;
  private initialStartTime!: Date;
  private initialEndTime!: Date;
  private minBound!: Date;
  private maxBound!: Date;
  @ViewChild(DaterangepickerComponent) private dateRangePicker?: DaterangepickerComponent;
  @ViewChild('calendarWrap') private calendarWrap?: ElementRef<HTMLElement>;

  private unlistenCalendarCapture?: () => void;
  private pickerSyncSuppressed = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly injector: Injector,
  ) {}

  ngOnInit(): void {
    this.applyConfig(this.config);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && !changes['config'].firstChange && this.config) {
      this.applyConfig(this.config);
      this.scheduleCalendarInteractionSetup();
    }
  }

  ngAfterViewInit(): void {
    this.scheduleCalendarInteractionSetup();
  }

  ngOnDestroy(): void {
    this.unlistenCalendarCapture?.();
  }

  private applyConfig(data: TimeRangeDialogData): void {
    this.useUtcCalendar = data.useUtcCalendar === true;
    this.boundsDisplay = data.boundsDisplay;
    this.minBound = new Date(data.minBound);
    this.maxBound = new Date(data.maxBound);
    const from = new Date(data.from);
    const to = new Date(data.to);
    this.initialStartTime = new Date(from.getTime());
    this.initialEndTime = new Date(to.getTime());

    const initial = createTimeRangeDialogInitialState(
      this.fb,
      from,
      to,
      this.minBound,
      this.maxBound,
      this.useUtcCalendar,
    );
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

  get dateRangeGroup(): FormGroup {
    return this.rangeForm.get('dateRange') as FormGroup;
  }

  get startTimeControl(): FormControl<Date | null> {
    return this.rangeForm.get('startTime') as FormControl<Date | null>;
  }

  get endTimeControl(): FormControl<Date | null> {
    return this.rangeForm.get('endTime') as FormControl<Date | null>;
  }

  get isValid(): boolean {
    if (this.rangeForm.invalid) return false;
    const result = this.buildResult();
    if (result === null || !this.isFiniteRange(result) || result.from > result.to) return false;
    return isClosedRangeFullyWithinTelemetryBounds(result, this.minBound, this.maxBound);
  }

  get isInvalidRange(): boolean {
    const result = this.buildResult();
    return result !== null && this.isFiniteRange(result) && result.from > result.to;
  }

  get isStartBeforeTelemetryBounds(): boolean {
    if (this.isInvalidRange) return false;
    const result = this.buildResult();
    if (result === null || !this.isFiniteRange(result)) return false;
    return result.from.getTime() < this.minBound.getTime();
  }

  get isEndAfterTelemetryBounds(): boolean {
    if (this.isInvalidRange) return false;
    const result = this.buildResult();
    if (result === null || !this.isFiniteRange(result)) return false;
    return result.to.getTime() > this.maxBound.getTime();
  }

  onCancel(): void {
    this.dismiss.emit();
  }

  private scheduleCalendarInteractionSetup(): void {
    afterNextRender(
      () => {
        this.setupCalendarInteraction();
        if (!this.calendarWrap?.nativeElement) {
          queueMicrotask(() => this.setupCalendarInteraction());
        }
      },
      { injector: this.injector },
    );
  }

  private setupCalendarInteraction(): void {
    this.unlistenCalendarCapture?.();
    this.unlistenCalendarCapture = undefined;
    this.ensurePickerCalendarsVisible();
    const el = this.calendarWrap?.nativeElement;
    if (!el) {
      return;
    }
    const handler = (event: Event): void => {
      this.onCalendarWrapCaptureClick(event);
    };
    el.addEventListener('click', handler, true);
    this.unlistenCalendarCapture = () => {
      el.removeEventListener('click', handler, true);
    };
  }

  private onCalendarWrapCaptureClick(event: Event): void {
    const clicked = this.resolveClickedCalendarDayFromEvent(event);
    if (!clicked) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    this.applyCustomCalendarSelection(clicked);
  }

  private resolveClickedCalendarDayFromEvent(event: Event): ReturnType<typeof startOfCalendarDayFromMillis> | null {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return null;
    }
    const td = target.closest('td');
    if (!td || !td.classList.contains('available') || td.classList.contains('disabled')) {
      return null;
    }
    if (td.classList.contains('week')) {
      return null;
    }
    const calendarEl = td.closest('.calendar');
    if (!calendarEl) {
      return null;
    }
    const side = calendarEl.classList.contains('right') ? 'right' : 'left';
    const tr = td.closest('tr');
    const tbody = tr?.parentElement;
    if (!tr || !tbody || tbody.tagName !== 'TBODY') {
      return null;
    }
    const row = Array.from(tbody.children).indexOf(tr);
    const dayCells = Array.from(tr.querySelectorAll('td')).filter((cell) => !cell.classList.contains('week'));
    const col = dayCells.indexOf(td as HTMLTableCellElement);
    if (col < 0) {
      return null;
    }
    const picker = this.dateRangePicker as unknown as {
      calendarVariables?: { left: { calendar: Dayjs[][] }; right: { calendar: Dayjs[][] } };
    };
    const grid = picker.calendarVariables?.[side]?.calendar;
    const rowCells = grid?.[row];
    const cell = rowCells?.[col];
    if (!cell) {
      return null;
    }
    return startOfCalendarDayFromMillis(cell.valueOf(), this.useUtcCalendar);
  }

  private applyCustomCalendarSelection(clickedDay: ReturnType<typeof startOfCalendarDayFromMillis>): void {
    const next = computeNextCalendarSelection(
      clickedDay,
      { start: this.pickerStart, end: this.pickerEnd },
      { start: this.initialPickerStart, end: this.initialPickerEnd },
    );
    this.pickerSyncSuppressed = true;
    try {
      this.pickerStart = next.start;
      this.pickerEnd = next.end;
      this.syncInlinePickerViewFromBindings();
      this.patchDateRangeFromPicker();
    } finally {
      this.pickerSyncSuppressed = false;
    }
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

  onPickerDatesUpdated(period: unknown): void {
    if (this.pickerSyncSuppressed) {
      return;
    }
    const p = period as { startDate: Dayjs | null; endDate: Dayjs | null };
    if (!p.startDate && !p.endDate) {
      this.restoreInitialDateRange();
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
    if (this.pickerSyncSuppressed) {
      return;
    }
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
    if (this.pickerSyncSuppressed) {
      return;
    }
    const emitted = payload as { endDate: { valueOf: () => number } };
    this.pickerEnd = startOfCalendarDayFromMillis(emitted.endDate.valueOf(), this.useUtcCalendar);
  }

  private restoreInitialDateRange(): void {
    this.pickerStart = this.initialPickerStart.clone();
    this.pickerEnd = this.initialPickerEnd.clone();
    this.patchDateRangeFromPicker();
    if (this.useUtcCalendar) {
      this.rangeForm.patchValue({
        startTime: DateTimeUtil.utcWallClockForPicker(this.initialStartTime),
        endTime: DateTimeUtil.utcWallClockForPicker(this.initialEndTime),
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
    if (!isClosedRangeFullyWithinTelemetryBounds(result, this.minBound, this.maxBound)) return;
    this.applied.emit({
      from: result.from,
      to: result.to,
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
    if (nextStart.valueOf() === this.pickerStart.valueOf() && nextEnd.valueOf() === this.pickerEnd!.valueOf()) {
      return;
    }
    this.pickerStart = nextStart;
    this.pickerEnd = nextEnd;
    this.patchDateRangeFromPicker();
  }

  private patchDateRangeFromPicker(): void {
    const start = this.pickerStart.clone().startOf('day');
    if (this.pickerEnd === null) {
      const end = start;
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
      return;
    }
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
      const from = DateTimeUtil.combineUtcDateAndTime(
        startDate,
        timeStart as string | Date,
      );
      const to = DateTimeUtil.combineUtcDateAndTime(endDate, timeEnd as string | Date);
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

}
