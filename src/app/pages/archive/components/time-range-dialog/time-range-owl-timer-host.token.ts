import { InjectionToken } from '@angular/core';

export interface TimeRangeOwlTimerHost {
  readonly useUtcWallClock: boolean;
}

export const TIME_RANGE_OWL_TIMER_HOST = new InjectionToken<TimeRangeOwlTimerHost>(
  'TIME_RANGE_OWL_TIMER_HOST',
);
