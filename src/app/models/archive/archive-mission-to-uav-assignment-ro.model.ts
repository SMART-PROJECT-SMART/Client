import type { ArchiveMissionRo } from './archive-mission-ro.model';

export interface ArchiveMissionToUavAssignmentRo {
  mission: ArchiveMissionRo;
  uavTailId: number;
  startTime: string;
  uavTelemetrySnapshot?: Record<string, number>;
}
