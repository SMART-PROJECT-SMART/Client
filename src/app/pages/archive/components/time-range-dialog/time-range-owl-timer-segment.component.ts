import { Platform } from '@angular/cdk/platform';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  DateTimeAdapter,
  OWL_DATE_TIME_FORMATS,
  OWL_DATE_TIME_LOCALE,
  OwlDateTimeModule,
} from '@danielmoncada/angular-datetime-picker';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { TIME_RANGE_OWL_TIMER_FORMATS } from './time-range-owl-timer-formats.constant';
import { TimeRangeOwlTimerDelegatingDateTimeAdapter } from './time-range-owl-timer-delegating-date-time-adapter';
import { TIME_RANGE_OWL_TIMER_HOST } from './time-range-owl-timer-host.token';

@Component({
  selector: 'app-time-range-owl-timer-segment',
  standalone: true,
  imports: [ReactiveFormsModule, OwlDateTimeModule, MatIcon, MatIconButton],
  templateUrl: './time-range-owl-timer-segment.component.html',
  styleUrl: './time-range-owl-timer-segment.component.scss',
  providers: [
    { provide: OWL_DATE_TIME_FORMATS, useValue: TIME_RANGE_OWL_TIMER_FORMATS },
    { provide: TIME_RANGE_OWL_TIMER_HOST, useExisting: TimeRangeOwlTimerSegmentComponent },
    {
      provide: DateTimeAdapter,
      useClass: TimeRangeOwlTimerDelegatingDateTimeAdapter,
      deps: [OWL_DATE_TIME_LOCALE, Platform, TIME_RANGE_OWL_TIMER_HOST],
    },
  ],
})
export class TimeRangeOwlTimerSegmentComponent {
  @Input({ required: true }) control!: FormControl<Date | null>;
  @Input({ required: true }) useUtcWallClock!: boolean;
  @Input({ required: true }) placeholder!: string;
  @Input({ required: true }) ariaLabel!: string;
  @Input({ required: true }) triggerAriaLabel!: string;
}
