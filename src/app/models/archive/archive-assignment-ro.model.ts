import type { ArchiveMissionToUavAssignmentRo } from './archive-mission-to-uav-assignment-ro.model';

export interface ArchiveAssignmentRo {
  suggestedAssignments: ArchiveMissionToUavAssignmentRo[];
  actualAssignments: ArchiveMissionToUavAssignmentRo[];
  allUavTelemetryData?: Record<string, Record<string, number>>;
  createdAt: string;
}
