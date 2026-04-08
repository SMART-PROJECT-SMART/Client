import { Platform } from '@angular/cdk/platform';
import { Inject, Injectable, Optional } from '@angular/core';
import { NativeDateTimeAdapter, OWL_DATE_TIME_LOCALE } from '@danielmoncada/angular-datetime-picker';
import { TIME_RANGE_OWL_TIMER_HOST, type TimeRangeOwlTimerHost } from './time-range-owl-timer-host.token';
import { UtcWallClockDateTimeAdapter } from './utc-wall-clock-date-time-adapter';

@Injectable()
export class TimeRangeOwlTimerDelegatingDateTimeAdapter extends NativeDateTimeAdapter {
  private readonly utcWall: UtcWallClockDateTimeAdapter;
  private readonly localWall: NativeDateTimeAdapter;

  constructor(
    @Optional() @Inject(OWL_DATE_TIME_LOCALE) owlDateTimeLocale: string | null,
    platform: Platform,
    @Inject(TIME_RANGE_OWL_TIMER_HOST) private readonly host: TimeRangeOwlTimerHost,
  ) {
    super(owlDateTimeLocale ?? '', platform);
    this.utcWall = new UtcWallClockDateTimeAdapter(owlDateTimeLocale ?? null, platform);
    this.localWall = new NativeDateTimeAdapter(owlDateTimeLocale ?? '', platform);
  }

  private active(): NativeDateTimeAdapter {
    return this.host.useUtcWallClock === true ? this.utcWall : this.localWall;
  }

  override setLocale(locale: string): void {
    super.setLocale(locale);
    this.utcWall.setLocale(locale);
    this.localWall.setLocale(locale);
  }

  override getYear(date: Date): number {
    return this.active().getYear(date);
  }

  override getMonth(date: Date): number {
    return this.active().getMonth(date);
  }

  override getDay(date: Date): number {
    return this.active().getDay(date);
  }

  override getDate(date: Date): number {
    return this.active().getDate(date);
  }

  override getHours(date: Date): number {
    return this.active().getHours(date);
  }

  override getMinutes(date: Date): number {
    return this.active().getMinutes(date);
  }

  override getSeconds(date: Date): number {
    return this.active().getSeconds(date);
  }

  override getTime(date: Date): number {
    return this.active().getTime(date);
  }

  override getNumDaysInMonth(date: Date): number {
    return this.active().getNumDaysInMonth(date);
  }

  override differenceInCalendarDays(dateLeft: Date, dateRight: Date): number {
    return this.active().differenceInCalendarDays(dateLeft, dateRight);
  }

  override getYearName(date: Date): string {
    return this.active().getYearName(date);
  }

  override getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    return this.active().getMonthNames(style);
  }

  override getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    return this.active().getDayOfWeekNames(style);
  }

  override getDateNames(): string[] {
    return this.active().getDateNames();
  }

  override toIso8601(date: Date): string {
    return this.active().toIso8601(date);
  }

  override isEqual(dateLeft: Date, dateRight: Date): boolean {
    return this.active().isEqual(dateLeft, dateRight);
  }

  override isSameDay(dateLeft: Date, dateRight: Date): boolean {
    return this.active().isSameDay(dateLeft, dateRight);
  }

  override isValid(date: Date): boolean {
    return this.active().isValid(date);
  }

  override invalid(): Date {
    return this.active().invalid();
  }

  override isDateInstance(obj: unknown): boolean {
    return this.active().isDateInstance(obj);
  }

  override addCalendarYears(date: Date, amount: number): Date {
    return this.active().addCalendarYears(date, amount);
  }

  override addCalendarMonths(date: Date, amount: number): Date {
    return this.active().addCalendarMonths(date, amount);
  }

  override addCalendarDays(date: Date, amount: number): Date {
    return this.active().addCalendarDays(date, amount);
  }

  override setHours(date: Date, amount: number): Date {
    return this.active().setHours(date, amount);
  }

  override setMinutes(date: Date, amount: number): Date {
    return this.active().setMinutes(date, amount);
  }

  override setSeconds(date: Date, amount: number): Date {
    return this.active().setSeconds(date, amount);
  }

  override createDate(
    year: number,
    month: number,
    date: number,
    hours?: number,
    minutes?: number,
    seconds?: number,
  ): Date {
    return this.active().createDate(year, month, date, hours, minutes, seconds);
  }

  override clone(date: Date): Date {
    return this.active().clone(date);
  }

  override now(): Date {
    return this.active().now();
  }

  override format(date: Date, displayFormat: unknown): string {
    return this.active().format(date, displayFormat);
  }

  override parse(value: unknown, parseFormat: unknown): Date | null {
    return this.active().parse(value, parseFormat);
  }

  override deserialize(value: unknown): Date | null {
    return this.active().deserialize(value);
  }
}
