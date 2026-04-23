import { ClientConstants } from '../../../common';
import type { AssignmentFitnessBreakdown } from '../../../models/assignment/assignmentFitnessBreakdown.model';
import type { AssignmentFitnessBreakdownItem } from '../../../models/assignment/assignmentFitnessBreakdownItem.model';

const { AssignmentPageConstants } = ClientConstants;

export function buildFitnessBreakdownItems(
  breakdown: AssignmentFitnessBreakdown,
): AssignmentFitnessBreakdownItem[] {
  return [
    {
      label: AssignmentPageConstants.FIT_BREAKDOWN_TELEMETRY_LABEL,
      value: breakdown.telemetryScore,
    },
    {
      label: AssignmentPageConstants.FIT_BREAKDOWN_DISTANCE_LABEL,
      value: breakdown.distanceScore,
    },
    {
      label: AssignmentPageConstants.FIT_BREAKDOWN_PRIORITY_LABEL,
      value: breakdown.priorityScore,
    },
    {
      label: AssignmentPageConstants.FIT_BREAKDOWN_OVERLAP_LABEL,
      value: breakdown.timeOverlapPenalty,
    },
    {
      label: AssignmentPageConstants.FIT_BREAKDOWN_MISMATCH_LABEL,
      value: breakdown.typeMismatchPenalty,
    },
    {
      label: AssignmentPageConstants.FIT_BREAKDOWN_COVERAGE_LABEL,
      value: breakdown.missionCoverageBonus,
    },
    {
      label: AssignmentPageConstants.FIT_BREAKDOWN_ACTIVE_LABEL,
      value: breakdown.activeMissionPenalty,
    },
  ];
}
