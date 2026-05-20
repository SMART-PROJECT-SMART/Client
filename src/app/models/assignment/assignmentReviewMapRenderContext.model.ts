import type { TelemetryField } from '../../common/enums';
import type { Mission } from '../mission/mission.model';
import type { MissionAssignmentPairing } from '../mission/missionAssignmentPairing.model';

export type AssignmentReviewMapRenderContext = {
  pairings: MissionAssignmentPairing[];
  selectedMap: Map<string, number>;
  telemetry: Record<number, Record<TelemetryField, number>>;
  missionColors: Map<string, string>;
  tailColors: Map<number, string>;
  activeMissionByTailId: Map<number, Mission>;
  focusedMissionId: string | null;
  compatibleTailIds: Set<number>;
  relativeScoreByTailId: Map<number, number>;
};

