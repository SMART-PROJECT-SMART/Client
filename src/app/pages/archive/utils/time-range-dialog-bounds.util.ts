import {
  CalendarDayEndTimeParts,
  CalendarDayStartTimeParts,
} from '../components/time-range-dialog/time-range-dialog.constants';
import type { TimeRangeDialogResult } from '../components/time-range-dialog/time-range-dialog.models';

export function intersectClosedTimeRangeWithBounds(
  result: TimeRangeDialogResult,
  minBound: Date,
  maxBound: Date,
): TimeRangeDialogResult | null {
  const fromMs = Math.max(result.from.getTime(), minBound.getTime());
  const toMs = Math.min(result.to.getTime(), maxBound.getTime());
  if (fromMs > toMs) {
    return null;
  }
  return { from: new Date(fromMs), to: new Date(toMs) };
}

export function utcCalendarDayStartInstant(anchor: Date): Date {
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

export function utcCalendarDayEndInstant(anchor: Date): Date {
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

export function utcCalendarEnvelopeSpan(startDate: Date, endDate: Date): TimeRangeDialogResult {
  return {
    from: utcCalendarDayStartInstant(startDate),
    to: utcCalendarDayEndInstant(endDate),
  };
}

export function resolveSelectableRangeWithinBounds(args: {
  direct: TimeRangeDialogResult;
  useUtcCalendar: boolean;
  calendarStartDate: Date | null;
  calendarEndDate: Date | null;
  minBound: Date;
  maxBound: Date;
}): TimeRangeDialogResult | null {
  const intersected = intersectClosedTimeRangeWithBounds(args.direct, args.minBound, args.maxBound);
  if (intersected !== null) {
    return intersected;
  }
  if (!args.useUtcCalendar || !args.calendarStartDate || !args.calendarEndDate) {
    return null;
  }
  const envelope = utcCalendarEnvelopeSpan(args.calendarStartDate, args.calendarEndDate);
  return intersectClosedTimeRangeWithBounds(envelope, args.minBound, args.maxBound);
}
