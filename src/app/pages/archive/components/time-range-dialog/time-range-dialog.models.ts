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
