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

export function telemetryIntervalClampedToUtcCalendarDay(
  utcDateAnchor: Date,
  minBound: Date,
  maxBound: Date,
): { from: Date; to: Date } | null {
  const dayStart = utcCalendarDayStartInstant(utcDateAnchor);
  const dayEnd = utcCalendarDayEndInstant(utcDateAnchor);
  const lo = Math.max(minBound.getTime(), dayStart.getTime());
  const hi = Math.min(maxBound.getTime(), dayEnd.getTime());
  if (lo > hi) {
    return null;
  }
  return { from: new Date(lo), to: new Date(hi) };
}

export function localCalendarDayStartInstant(anchor: Date): Date {
  return new Date(
    anchor.getFullYear(),
    anchor.getMonth(),
    anchor.getDate(),
    CalendarDayStartTimeParts.hour,
    CalendarDayStartTimeParts.minute,
    CalendarDayStartTimeParts.second,
    CalendarDayStartTimeParts.millisecond,
  );
}

export function localCalendarDayEndInstant(anchor: Date): Date {
  return new Date(
    anchor.getFullYear(),
    anchor.getMonth(),
    anchor.getDate(),
    CalendarDayEndTimeParts.hour,
    CalendarDayEndTimeParts.minute,
    CalendarDayEndTimeParts.second,
    CalendarDayEndTimeParts.millisecond,
  );
}

export function telemetryIntervalClampedToLocalCalendarDay(
  localDateAnchor: Date,
  minBound: Date,
  maxBound: Date,
): { from: Date; to: Date } | null {
  const dayStart = localCalendarDayStartInstant(localDateAnchor);
  const dayEnd = localCalendarDayEndInstant(localDateAnchor);
  const lo = Math.max(minBound.getTime(), dayStart.getTime());
  const hi = Math.min(maxBound.getTime(), dayEnd.getTime());
  if (lo > hi) {
    return null;
  }
  return { from: new Date(lo), to: new Date(hi) };
}
