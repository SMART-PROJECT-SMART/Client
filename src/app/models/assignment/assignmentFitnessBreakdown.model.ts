export type AssignmentFitnessBreakdown = {
  telemetryScore: number;
  distanceScore: number;
  priorityScore: number;
  timeOverlapPenalty: number;
  typeMismatchPenalty: number;
  missionCoverageBonus: number;
  activeMissionPenalty: number;
  totalFitnessScore: number;
};
