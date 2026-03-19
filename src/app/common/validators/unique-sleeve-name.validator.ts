import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function uniqueSleeveNameValidator(existingNames: string[], currentName?: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    if (currentName && control.value.toLowerCase() === currentName.toLowerCase()) return null;
    const duplicate = existingNames.some((name) => name.toLowerCase() === control.value.toLowerCase());
    return duplicate ? { duplicateName: true } : null;
  };
}
