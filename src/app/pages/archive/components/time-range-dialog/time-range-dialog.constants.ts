export const TimeRangePickerBoundDateFormat = 'YYYY-MM-DD' as const;

export const TimeRangeCalendarOutsideMonthCellClass = 'time-range-cal-outside-month';

export const UtcTimeOfDayStringPattern = '^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$';

export const TimeRangeTimesGroupTitle = 'Times';

export const TimeRangePanelTitle = 'Select time range';

export const TimeRangePanelCloseButtonAriaLabel = 'Close';

export const TimeRangeValidRangeBannerTitle = 'Valid time range';

export const TimeRangePanelCancelLabel = 'Cancel';

export const TimeRangePanelApplyLabel = 'Apply';

export const TimeRangeOpenPickerAriaLabelLead = 'Open ';

export const TimeRangeOpenPickerAriaLabelTail = ' picker';

export const TimeRangeStartTimeLabel = 'Start time';

export const TimeRangeEndTimeLabel = 'End time';

export const TimeRangeStartTimeShortLabel = 'Start';

export const TimeRangeEndTimeShortLabel = 'End';

export const TimeRangeTimeInputPlaceholder = 'HH:mm:ss';

export const TimeRangeResetRangeLabel = 'Reset range';

export const TimeRangeValidationEndBeforeStartMessage = 'End time must be after start time';

export const TimeRangeValidationStartBeforeFirstSampleMessage =
  'Start is before the earliest available timestamp in the loaded data.';

export const TimeRangeValidationEndAfterLastSampleMessage =
  'End is after the latest available timestamp in the loaded data.';

export const CalendarDayStartTimeParts = {
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0,
} as const;

export const CalendarDayEndTimeParts = {
  hour: 23,
  minute: 59,
  second: 59,
  millisecond: 999,
} as const;

export const TimeRangeOvernightEndDateDayOffset = 1;

export const TimeRangeSelectionDaySpan = {
  Multi: 'multi',
  Single: 'single',
} as const;

export type TimeRangeSelectionDaySpan =
  (typeof TimeRangeSelectionDaySpan)[keyof typeof TimeRangeSelectionDaySpan];
