import type { FormGroup } from '@angular/forms';
import type { Dayjs } from 'dayjs';

export interface TimeRangeDialogData {
  from: Date;
  to: Date;
  boundsDisplay: string;
  minBound: Date;
  maxBound: Date;
  useUtcCalendar?: boolean;
}

export interface TimeRangeDialogResult {
  from: Date;
  to: Date;
}

export type TimeRangeFormRawValue = {
  dateRange: { start: Date | null; end: Date | null };
  startTime: string | Date | null | undefined;
  endTime: string | Date | null | undefined;
};

export interface TimeRangeDialogInitialState {
  minDayjs: Dayjs;
  maxDayjs: Dayjs;
  minDateBoundStr: string;
  maxDateBoundStr: string;
  initialPickerStart: Dayjs;
  initialPickerEnd: Dayjs;
  pickerStart: Dayjs;
  pickerEnd: Dayjs;
  rangeForm: FormGroup;
}
