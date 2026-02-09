import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function uniqueTailIdValidator(existingTailIds: number[], currentTailId?: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const tailId = Number(control.value);
    if (currentTailId !== undefined && tailId === currentTailId) return null;
    return existingTailIds.includes(tailId) ? { duplicateTailId: true } : null;
  };
}
