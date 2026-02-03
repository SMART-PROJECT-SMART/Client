import { AbstractControl, ValidationErrors } from '@angular/forms';

export function uniqueTailIdValidator(existingTailIds: number[], currentTailId?: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const tailId = Number(control.value);
    if (currentTailId && tailId === currentTailId) return null;
    return existingTailIds.includes(tailId) ? { tailIdExists: { value: tailId } } : null;
  };
}
