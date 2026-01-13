import type { Violation } from './violation.model';

export interface ValidationResult {
  isValid: boolean;
  violations: Violation[];
}
