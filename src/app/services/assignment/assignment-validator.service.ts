import type { MissionAssignmentPairing, ValidationResult, Violation } from '../../models';
import { ViolationType, UAVType, TelemetryField } from '../../common/enums';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AssignmentValidatorService {
  public validateAssignments(
    pairings: MissionAssignmentPairing[],
    selectedTailIds: Map<string, number>,
    uavTelemetryData: Record<number, Record<string, number>>
  ): ValidationResult {
    const violations: Violation[] = [];

    this.validateTypeMismatches(pairings, selectedTailIds, uavTelemetryData, violations);
    this.validateTimeOverlaps(pairings, selectedTailIds, violations);

    return {
      isValid: violations.length === 0,
      violations: violations,
    };
  }

  private validateTypeMismatches(
    pairings: MissionAssignmentPairing[],
    selectedTailIds: Map<string, number>,
    uavTelemetryData: Record<number, Record<string, number>>,
    violations: Violation[]
  ): void {
    for (const pairing of pairings) {
      const selectedTailId: number = selectedTailIds.get(pairing.mission.id) ?? pairing.tailId;
      const uavTelemetry = uavTelemetryData[selectedTailId];

      if (!uavTelemetry) continue;

      const uavTypeValue: number = uavTelemetry[TelemetryField.UAVTypeValue];
      const uavType: UAVType = Object.values(UAVType)[uavTypeValue] as UAVType;

      if (uavType !== pairing.mission.requiredUAVType) {
        violations.push({
          violationType: ViolationType.TypeMismatch,
          missionId: pairing.mission.id,
          missionTitle: pairing.mission.title,
          description: `UAV-${selectedTailId} type mismatch: mission requires ${pairing.mission.requiredUAVType}, but UAV is ${uavType}`,
        });
      }
    }
  }

  private validateTimeOverlaps(
    pairings: MissionAssignmentPairing[],
    selectedTailIds: Map<string, number>,
    violations: Violation[]
  ): void {
    const uavSchedules: Map<
      number,
      Array<{ missionId: string; missionTitle: string; start: Date; end: Date }>
    > = new Map();

    for (const pairing of pairings) {
      const selectedTailId: number = selectedTailIds.get(pairing.mission.id) ?? pairing.tailId;

      if (!uavSchedules.has(selectedTailId)) {
        uavSchedules.set(selectedTailId, []);
      }

      const schedule = uavSchedules.get(selectedTailId)!;
      const newMission = {
        missionId: pairing.mission.id,
        missionTitle: pairing.mission.title,
        start: new Date(pairing.timeWindow.start),
        end: new Date(pairing.timeWindow.end),
      };

      for (const existingMission of schedule) {
        if (
          this.hasTimeOverlap(
            newMission.start,
            newMission.end,
            existingMission.start,
            existingMission.end
          )
        ) {
          violations.push({
            violationType: ViolationType.TimeOverlap,
            missionId: pairing.mission.id,
            missionTitle: pairing.mission.title,
            description: `UAV-${selectedTailId} has time overlap between "${pairing.mission.title}" and "${existingMission.missionTitle}"`,
          });
        }
      }

      schedule.push(newMission);
    }
  }

  private hasTimeOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && start2 < end1;
  }
}
