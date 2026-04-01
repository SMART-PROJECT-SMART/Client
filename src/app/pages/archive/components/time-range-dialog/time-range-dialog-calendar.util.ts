import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export function stripToDateOnlyLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function stripToDateOnlyUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function startOfCalendarDayFromMillis(ms: number, useUtcCalendar: boolean): Dayjs {
  if (useUtcCalendar) {
    return dayjs.utc(ms).startOf('day');
  }
  return dayjs(ms).startOf('day');
}

export function calendarDayStartForDate(d: Date, useUtcCalendar: boolean): Dayjs {
  if (useUtcCalendar) {
    return dayjs.utc(d).startOf('day');
  }
  return dayjs(stripToDateOnlyLocal(d)).startOf('day');
}

export function dayjsToUtcDateOnlyAnchor(d: Dayjs): Date {
  return new Date(Date.UTC(d.year(), d.month(), d.date()));
}
