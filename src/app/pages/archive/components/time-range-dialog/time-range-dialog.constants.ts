export const TimeRangePickerBoundDateFormat = 'YYYY-MM-DD' as const;

export const TimeRangeCalendarOutsideMonthCellClass = 'time-range-cal-outside-month';

export const UtcTimeOfDayStringPattern = '^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$';

export const TimeRangeTimesGroupTitle = 'Times';

export const TimeRangeStartTimeLabel = 'Start time';

export const TimeRangeEndTimeLabel = 'End time';

export const TimeRangeStartTimeShortLabel = 'Start';

export const TimeRangeEndTimeShortLabel = 'End';

export const TimeRangeTimeInputPlaceholder = 'HH:mm:ss';

export const TimeRangeResetRangeLabel = 'Reset range';

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
