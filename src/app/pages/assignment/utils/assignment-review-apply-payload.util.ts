import type { TelemetryField } from '../../../common/enums';
import type {
  ApplyAssignmentRo,
  MissionAssignmentPairing,
  MissionToUavAssignment,
} from '../../../models';

export function buildApplyAssignmentRoFromReviewState(
  pairings: MissionAssignmentPairing[],
  selectedTailIdsByMissionId: Map<string, number>,
  uavTelemetryData: Record<number, Record<TelemetryField, number>>,
): ApplyAssignmentRo {
  const suggestedAssignments: MissionToUavAssignment[] = pairings.map((p) => ({
    mission: p.mission,
    uavTailId: p.tailId,
    startTime: p.timeWindow.start,
    uavTelemetrySnapshot: uavTelemetryData[p.tailId],
  }));

  const actualAssignments: MissionToUavAssignment[] = pairings.map((p) => {
    const tailId = selectedTailIdsByMissionId.get(p.mission.id) ?? p.tailId;
    return {
      mission: p.mission,
      uavTailId: tailId,
      startTime: p.timeWindow.start,
      uavTelemetrySnapshot: uavTelemetryData[tailId],
    };
  });

  return {
    suggested: suggestedAssignments,
    actual: actualAssignments,
    allUavTelemetryData: uavTelemetryData as Record<string, Record<string, number>>,
  };
}
