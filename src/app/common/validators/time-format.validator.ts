import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ClientConstants } from '../constants/clientConstants.constant';

const { TIME_FORMAT_PATTERN } = ClientConstants.ValidationConstants.TimeValidation;

export function timeFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    // MatTimepicker returns a Date object, which is always valid
    if (control.value instanceof Date) {
      return null;
    }

    // For string values (backwards compatibility)
    return TIME_FORMAT_PATTERN.test(control.value) ? null : { invalidTimeFormat: true };
  };
}
