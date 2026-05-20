import type { MissionAssignmentPairing } from '../mission/missionAssignmentPairing.model';
import type { TelemetryField } from '../../common/enums';
import type { AssignmentFitnessBreakdown } from '../assignment/assignmentFitnessBreakdown.model';
import type { AssignmentPairingInsight } from '../assignment/assignmentPairingInsight.model';

export interface AssignmentAlgorithmRo {
  pairings: MissionAssignmentPairing[];
  uavTelemetryData: Record<number, Record<TelemetryField, number>>;
  fitnessScore: number;
  fitnessBreakdown: AssignmentFitnessBreakdown;
  pairingInsights: AssignmentPairingInsight[];
}
