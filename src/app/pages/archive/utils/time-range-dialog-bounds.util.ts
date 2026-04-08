import {
  CalendarDayEndTimeParts,
  CalendarDayStartTimeParts,
} from '../components/time-range-dialog/time-range-dialog.constants';
import type { TimeRangeDialogResult } from '../components/time-range-dialog/time-range-dialog.models';

export function isClosedRangeFullyWithinTelemetryBounds(
  result: TimeRangeDialogResult,
  minBound: Date,
  maxBound: Date,
): boolean {
  const fromMs = result.from.getTime();
  const toMs = result.to.getTime();
  const minMs = minBound.getTime();
  const maxMs = maxBound.getTime();
  return fromMs >= minMs && toMs <= maxMs;
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
