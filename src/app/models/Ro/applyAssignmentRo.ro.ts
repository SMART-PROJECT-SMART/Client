import type { MissionToUavAssignment } from '../mission/missionToUavAssignment.model';

export interface ApplyAssignmentRo {
  suggested: MissionToUavAssignment[];
  actual: MissionToUavAssignment[];
}
