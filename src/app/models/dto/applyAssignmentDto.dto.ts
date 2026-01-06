import { MissionToUavAssignment } from '../missionToUavAssignment.model';

export interface ApplyAssignmentDto {
  suggestedAssignments: MissionToUavAssignment[];
  actualAssignments: MissionToUavAssignment[];
}
