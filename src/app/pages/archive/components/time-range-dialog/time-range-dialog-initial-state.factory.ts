import { FormBuilder, Validators } from '@angular/forms';
import { DateTimeUtil } from '../../../../common/utils/date-time.util';
import {
  calendarDayStartForDate,
  stripToDateOnlyLocal,
  stripToDateOnlyUtc,
} from './time-range-dialog-calendar.util';
import {
  TimeRangePickerBoundDateFormat,
  UtcTimeOfDayStringPattern,
} from './time-range-dialog.constants';
import type { TimeRangeDialogInitialState } from './time-range-dialog.models';

export function createTimeRangeDialogInitialState(
  fb: FormBuilder,
  from: Date,
  to: Date,
  minBound: Date,
  maxBound: Date,
  useUtcCalendar: boolean,
): TimeRangeDialogInitialState {
  if (useUtcCalendar) {
    const minDayjs = calendarDayStartForDate(minBound, true);
    const maxDayjs = calendarDayStartForDate(maxBound, true);
    const startDateOnly = stripToDateOnlyUtc(from);
    const endDateOnly = stripToDateOnlyUtc(to);
    const initialPickerStart = calendarDayStartForDate(from, true);
    const initialPickerEnd = calendarDayStartForDate(to, true);
    const pickerStart = initialPickerStart.clone();
    const pickerEnd = initialPickerEnd.clone();
    const rangeForm = fb.group({
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
    return {
      minDayjs,
      maxDayjs,
      minDateBoundStr: minDayjs.format(TimeRangePickerBoundDateFormat),
      maxDateBoundStr: maxDayjs.format(TimeRangePickerBoundDateFormat),
      initialPickerStart,
      initialPickerEnd,
      pickerStart,
      pickerEnd,
      rangeForm,
    };
  }

  const minDayjs = calendarDayStartForDate(minBound, false);
  const maxDayjs = calendarDayStartForDate(maxBound, false);
  const startDateOnly = stripToDateOnlyLocal(from);
  const endDateOnly = stripToDateOnlyLocal(to);
  const initialPickerStart = calendarDayStartForDate(from, false);
  const initialPickerEnd = calendarDayStartForDate(to, false);
  const pickerStart = initialPickerStart.clone();
  const pickerEnd = initialPickerEnd.clone();
  const rangeForm = fb.group({
    dateRange: fb.group({
      start: [startDateOnly, Validators.required],
      end: [endDateOnly, Validators.required],
    }),
    startTime: [DateTimeUtil.localTimeOfDayForPicker(from)],
    endTime: [DateTimeUtil.localTimeOfDayForPicker(to)],
  });
  return {
    minDayjs,
    maxDayjs,
    minDateBoundStr: minDayjs.format(TimeRangePickerBoundDateFormat),
    maxDateBoundStr: maxDayjs.format(TimeRangePickerBoundDateFormat),
    initialPickerStart,
    initialPickerEnd,
    pickerStart,
    pickerEnd,
    rangeForm,
  };
}
