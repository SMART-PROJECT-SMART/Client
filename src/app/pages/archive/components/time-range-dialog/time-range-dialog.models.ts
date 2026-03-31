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
