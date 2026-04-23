import type { UAVType } from '../../common/enums';
import type { MissionAssignmentPairing } from '../mission/missionAssignmentPairing.model';

export type AssignmentReviewMapHighlightContext = {
  pairings: MissionAssignmentPairing[];
  selectedTailIdsByMissionId: Map<string, number>;
  highlightMissionIds: Set<string>;
  highlightMissionTypes: Set<UAVType>;
  highlightTailIds: Set<number>;
};
