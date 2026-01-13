import type { MissionAssignmentPairing } from '../mission/missionAssignmentPairing.model';
import type { TelemetryField } from '../../common/enums';

export interface AssignmentAlgorithmRo {
  pairings: MissionAssignmentPairing[];
  uavTelemetryData: Record<number, Record<TelemetryField, number>>;
  fitnessScore: number;
}
