import type { MissionTelemetryRo } from './mission-telemetry-ro.model';

export interface MissionTelemetryPageRo {
  items: MissionTelemetryRo[];
  totalCount: number;
}
