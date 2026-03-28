export interface TimeRangeDialogData {
  from: Date;
  to: Date;
  boundsDisplay: string;
  minBound: Date;
  maxBound: Date;
}

export interface TimeRangeDialogResult {
  from: Date;
  to: Date;
}
