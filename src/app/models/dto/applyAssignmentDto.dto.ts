import { MissionToUavAssignment } from '../mission/missionToUavAssignment.model';

export interface ApplyAssignmentDto {
  suggestedAssignments: MissionToUavAssignment[];
  actualAssignments: MissionToUavAssignment[];
}
