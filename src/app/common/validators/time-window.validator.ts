import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { DateTimeUtil } from '../utils';

export function timeWindowValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const startDateControl = control.get('startDate');
    const startTimeControl = control.get('startTime');
    const endDateControl = control.get('endDate');
    const endTimeControl = control.get('endTime');

    if (!startDateControl || !startTimeControl || !endDateControl || !endTimeControl) {
      return null;
    }

    const startDate = startDateControl.value;
    const startTime = startTimeControl.value;
    const endDate = endDateControl.value;
    const endTime = endTimeControl.value;

    if (!startDate || !startTime || !endDate || !endTime) {
      return null;
    }

    const start = DateTimeUtil.combineDateAndTime(startDate, startTime);
    const end = DateTimeUtil.combineDateAndTime(endDate, endTime);

    if (start >= end) {
      return { timeWindowInvalid: true };
    }

    return null;
  };
}
