import type { MissionToUavAssignment } from '../missionToUavAssignment.model';

export interface ApplyAssignmentRo {
  suggested: MissionToUavAssignment[];
  actual: MissionToUavAssignment[];
}
