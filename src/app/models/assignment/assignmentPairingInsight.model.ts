import type { AssignmentPairingAlternative } from './assignmentPairingAlternative.model';

export type AssignmentPairingInsight = {
  missionId: string;
  suggestedTailId: number;
  telemetryScore: number;
  distanceScore: number;
  priorityScore: number;
  typeMismatchPenalty: number;
  activeMissionPenalty: number;
  totalScore: number;
  alternatives: AssignmentPairingAlternative[];
};
