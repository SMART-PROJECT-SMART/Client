import { Platform } from '@angular/cdk/platform';
import { Inject, Injectable, Optional } from '@angular/core';
import {
  DateTimeAdapter,
  NativeDateTimeAdapter,
  OWL_DATE_TIME_LOCALE,
} from '@danielmoncada/angular-datetime-picker';

const SUPPORTS_INTL = typeof Intl !== 'undefined';

function stripDirectionalityCharacters(str: string): string {
  return str.replace(/[\u200e\u200f]/g, '');
}

@Injectable()
export class UtcWallClockDateTimeAdapter extends NativeDateTimeAdapter {
  constructor(
    @Optional() @Inject(OWL_DATE_TIME_LOCALE) owlDateTimeLocale: string | null,
    platform: Platform,
  ) {
    super(owlDateTimeLocale ?? '', platform);
  }

  override getYear(date: Date): number {
    return date.getUTCFullYear();
  }

  override getMonth(date: Date): number {
    return date.getUTCMonth();
  }

  override getDate(date: Date): number {
    return date.getUTCDate();
  }

  override getDay(date: Date): number {
    return date.getUTCDay();
  }

  override getHours(date: Date): number {
    return date.getUTCHours();
  }

  override getMinutes(date: Date): number {
    return date.getUTCMinutes();
  }

  override getSeconds(date: Date): number {
    return date.getUTCSeconds();
  }

  override differenceInCalendarDays(dateLeft: Date, dateRight: Date): number {
    if (!this.isValid(dateLeft) || !this.isValid(dateRight)) {
      return null as unknown as number;
    }
    const leftMs = Date.UTC(
      dateLeft.getUTCFullYear(),
      dateLeft.getUTCMonth(),
      dateLeft.getUTCDate(),
    );
    const rightMs = Date.UTC(
      dateRight.getUTCFullYear(),
      dateRight.getUTCMonth(),
      dateRight.getUTCDate(),
    );
    return Math.round((leftMs - rightMs) / this.millisecondsInDay);
  }

  override getNumDaysInMonth(date: Date): number {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();
    return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  }

  override isSameDay(dateLeft: Date, dateRight: Date): boolean {
    if (!this.isValid(dateLeft) || !this.isValid(dateRight)) {
      return false;
    }
    return (
      dateLeft.getUTCFullYear() === dateRight.getUTCFullYear() &&
      dateLeft.getUTCMonth() === dateRight.getUTCMonth() &&
      dateLeft.getUTCDate() === dateRight.getUTCDate()
    );
  }

  override addCalendarMonths(date: Date, amount: number): Date {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + Number(amount);
    const d = date.getUTCDate();
    const h = date.getUTCHours();
    const mi = date.getUTCMinutes();
    const s = date.getUTCSeconds();
    const ms = date.getUTCMilliseconds();
    const daysInTarget = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const day = Math.min(d, daysInTarget);
    return new Date(Date.UTC(y, m, day, h, mi, s, ms));
  }

  override addCalendarDays(date: Date, amount: number): Date {
    const result = this.clone(date);
    result.setUTCDate(result.getUTCDate() + Number(amount));
    return result;
  }

  override setHours(date: Date, amount: number): Date {
    const result = this.clone(date);
    result.setUTCHours(amount);
    return result;
  }

  override setMinutes(date: Date, amount: number): Date {
    const result = this.clone(date);
    result.setUTCMinutes(amount);
    return result;
  }

  override setSeconds(date: Date, amount: number): Date {
    const result = this.clone(date);
    result.setUTCSeconds(amount);
    return result;
  }

  override createDate(
    year: number,
    month: number,
    date: number,
    hours = 0,
    minutes = 0,
    seconds = 0,
  ): Date {
    if (month < 0 || month > 11) {
      throw new Error(`Invalid month index "${month}". Month index has to be between 0 and 11.`);
    }
    if (date < 1) {
      throw new Error(`Invalid date "${date}". Date has to be greater than 0.`);
    }
    if (hours < 0 || hours > 23) {
      throw new Error(`Invalid hours "${hours}". Hours has to be between 0 and 23.`);
    }
    if (minutes < 0 || minutes > 59) {
      throw new Error(`Invalid minutes "${minutes}". Minutes has to between 0 and 59.`);
    }
    if (seconds < 0 || seconds > 59) {
      throw new Error(`Invalid seconds "${seconds}". Seconds has to be between 0 and 59.`);
    }
    const result = new Date(Date.UTC(year, month, date, hours, minutes, seconds));
    if (result.getUTCMonth() !== month) {
      throw new Error(`Invalid date "${date}" for month with index "${month}".`);
    }
    return result;
  }

  override format(date: Date, displayFormat: Intl.DateTimeFormatOptions): string {
    if (!this.isValid(date)) {
      throw new Error('JSNativeDate: Cannot format invalid date.');
    }
    if (SUPPORTS_INTL) {
      const opts = { ...displayFormat, timeZone: 'utc' };
      const dtf = new Intl.DateTimeFormat(this.getLocale(), opts);
      return stripDirectionalityCharacters(dtf.format(date));
    }
    return stripDirectionalityCharacters(date.toUTCString());
  }
}

export function createTimeRangeOwlTimerDateAdapter(
  locale: string | null | undefined,
  platform: Platform,
  useUtcWallClock: boolean,
): DateTimeAdapter<Date> {
  return useUtcWallClock
    ? new UtcWallClockDateTimeAdapter(locale ?? null, platform)
    : new NativeDateTimeAdapter(locale ?? '', platform);
}
