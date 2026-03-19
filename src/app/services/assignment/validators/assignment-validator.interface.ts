import type { Violation } from '../../../models';
import type { AssignmentValidationContext } from './assignment-validation-context.interface';

export interface AssignmentValidator {
  validate(context: AssignmentValidationContext): Violation[];
}
