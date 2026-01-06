import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function timeWindowValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const startControl = control.get('start');
    const endControl = control.get('end');

    if (!startControl || !endControl) {
      return null;
    }

    const start = startControl.value;
    const end = endControl.value;

    if (!start || !end) {
      return null;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate >= endDate) {
      const error = { timeWindowInvalid: true };
      startControl.setErrors({ ...startControl.errors, ...error });
      endControl.setErrors({ ...endControl.errors, ...error });
      return error;
    }

    if (startControl.hasError('timeWindowInvalid')) {
      const { timeWindowInvalid, ...remainingErrors } = startControl.errors || {};
      startControl.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
    }

    if (endControl.hasError('timeWindowInvalid')) {
      const { timeWindowInvalid, ...remainingErrors } = endControl.errors || {};
      endControl.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
    }

    return null;
  };
}
