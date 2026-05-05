import type { UAVType } from '../../common/enums';
import type { MissionAssignmentPairing } from '../mission/missionAssignmentPairing.model';

export type AssignmentReviewMapHighlightContext = {
  pairings: MissionAssignmentPairing[];
  selectedTailIdsByMissionId: Map<string, number>;
  uavTypeByTailId: Record<number, UAVType>;
  focusedMissionId: string | null;
  highlightMissionIds: Set<string>;
  highlightMissionTypes: Set<UAVType>;
  highlightUavTypes: Set<UAVType>;
  highlightTailIds: Set<number>;
};
