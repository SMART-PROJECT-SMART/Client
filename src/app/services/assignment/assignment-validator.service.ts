import { Injectable } from '@angular/core';
import type { MissionAssignmentPairing, ValidationResult, Violation } from '../../models';
import {
  AssignmentValidator,
  AssignmentValidationContext,
  TypeMismatchValidator,
  TimeOverlapValidator,
} from './validators';

@Injectable({
  providedIn: 'root',
})
export class AssignmentValidatorService {
  private readonly validators: AssignmentValidator[];

  constructor(
    typeMismatchValidator: TypeMismatchValidator,
    timeOverlapValidator: TimeOverlapValidator
  ) {
    this.validators = [typeMismatchValidator, timeOverlapValidator];
  }

  public validateAssignments(
    pairings: MissionAssignmentPairing[],
    selectedTailIds: Map<string, number>,
    uavTelemetryData: Record<number, Record<string, number>>
  ): ValidationResult {
    const context: AssignmentValidationContext = {
      pairings,
      selectedTailIds,
      uavTelemetryData,
    };

    const violations = this.runValidators(context);

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  private runValidators(context: AssignmentValidationContext): Violation[] {
    return this.validators.flatMap((validator) => validator.validate(context));
  }
}
