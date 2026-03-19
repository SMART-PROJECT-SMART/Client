import type { MissionAssignmentPairing } from '../../../models';

export interface AssignmentValidationContext {
  pairings: MissionAssignmentPairing[];
  selectedTailIds: Map<string, number>;
  uavTelemetryData: Record<number, Record<string, number>>;
}
