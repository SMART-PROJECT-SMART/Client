import { UavToMission } from '../uavToMission.model';

export interface AssignmentAlgorithmRo {
  assignments: UavToMission[];
  fitnessScore: number;
}
