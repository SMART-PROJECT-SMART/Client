import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { DateTimeUtil } from '../utils';
import { ClientConstants } from '../constants/clientConstants.constant';

const { MINIMUM_MISSION_DURATION_MINUTES } = ClientConstants.ValidationConstants.TimeValidation;

export function minimumDurationValidator(minMinutes: number = MINIMUM_MISSION_DURATION_MINUTES): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const startDate = control.get('startDate')?.value;
    const startTime = control.get('startTime')?.value;
    const endDate = control.get('endDate')?.value;
    const endTime = control.get('endTime')?.value;

    if (!startDate || !startTime || !endDate || !endTime) {
      return null;
    }

    const start = DateTimeUtil.combineDateAndTime(startDate, startTime);
    const end = DateTimeUtil.combineDateAndTime(endDate, endTime);
    const diffMinutes = (end.getTime() - start.getTime()) / 60000;

    return diffMinutes < minMinutes
      ? { minimumDuration: { required: minMinutes, actual: Math.floor(diffMinutes) } }
      : null;
  };
}
