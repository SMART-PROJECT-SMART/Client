import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ClientConstants } from '../constants/clientConstants.constant';

export function portNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const portNumbers = Array.isArray(control.value) ? control.value : [control.value];
    for (const portNumber of portNumbers) {
      if (
        portNumber < ClientConstants.DeviceValidationConstants.PORT_NUMBER_MIN ||
        portNumber > ClientConstants.DeviceValidationConstants.PORT_NUMBER_MAX
      ) {
        return {
          invalidPortNumber: {
            value: portNumber,
            min: ClientConstants.DeviceValidationConstants.PORT_NUMBER_MIN,
            max: ClientConstants.DeviceValidationConstants.PORT_NUMBER_MAX,
          },
        };
      }
    }
    return null;
  };
}
