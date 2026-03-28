export const TimeRangePickerBoundDateFormat = 'YYYY-MM-DD' as const;

export const TimeRangeFlexPill = {
  EXACT: 'exact',
  D1: 'd1',
  D2: 'd2',
  D3: 'd3',
  D7: 'd7',
} as const;

export type TimeRangeFlexPillKey = (typeof TimeRangeFlexPill)[keyof typeof TimeRangeFlexPill];

export const TimeRangeFlexPillLabels: Record<TimeRangeFlexPillKey, string> = {
  [TimeRangeFlexPill.EXACT]: 'Exact dates',
  [TimeRangeFlexPill.D1]: '± 1 day',
  [TimeRangeFlexPill.D2]: '± 2 days',
  [TimeRangeFlexPill.D3]: '± 3 days',
  [TimeRangeFlexPill.D7]: '± 7 days',
};

export const TimeRangeFlexPillOrder: TimeRangeFlexPillKey[] = [
  TimeRangeFlexPill.EXACT,
  TimeRangeFlexPill.D1,
  TimeRangeFlexPill.D2,
  TimeRangeFlexPill.D3,
  TimeRangeFlexPill.D7,
];

export const TimeRangeFlexOffsetByKey: Partial<Record<TimeRangeFlexPillKey, number>> = {
  [TimeRangeFlexPill.D1]: 1,
  [TimeRangeFlexPill.D2]: 2,
  [TimeRangeFlexPill.D3]: 3,
  [TimeRangeFlexPill.D7]: 7,
};
