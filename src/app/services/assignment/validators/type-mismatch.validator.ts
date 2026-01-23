import { Injectable } from '@angular/core';
import type { Violation } from '../../../models';
import { ViolationType, UAVType, TelemetryField } from '../../../common/enums';
import type { AssignmentValidationContext } from './assignment-validation-context.interface';
import type { AssignmentValidator } from './assignment-validator.interface';

@Injectable({
  providedIn: 'root',
})
export class TypeMismatchValidator implements AssignmentValidator {
  private readonly uavTypesArray: UAVType[] = Object.values(UAVType);

  public validate(context: AssignmentValidationContext): Violation[] {
    const violations: Violation[] = [];

    for (const pairing of context.pairings) {
      const violation = this.checkTypeMismatch(pairing, context);
      if (violation) {
        violations.push(violation);
      }
    }

    return violations;
  }

  private checkTypeMismatch(
    pairing: { mission: { id: string; title: string; requiredUAVType: UAVType }; tailId: number },
    context: AssignmentValidationContext
  ): Violation | null {
    const selectedTailId = context.selectedTailIds.get(pairing.mission.id) ?? pairing.tailId;
    const uavTelemetry = context.uavTelemetryData[selectedTailId];

    if (!uavTelemetry) {
      return null;
    }

    const uavTypeValue = uavTelemetry[TelemetryField.UAVTypeValue];
    const uavType = this.uavTypesArray[uavTypeValue] as UAVType;

    if (uavType !== pairing.mission.requiredUAVType) {
      return {
        violationType: ViolationType.TypeMismatch,
        missionId: pairing.mission.id,
        missionTitle: pairing.mission.title,
        description: `UAV-${selectedTailId} type mismatch: mission requires ${pairing.mission.requiredUAVType}, but UAV is ${uavType}`,
      };
    }

    return null;
  }
}
