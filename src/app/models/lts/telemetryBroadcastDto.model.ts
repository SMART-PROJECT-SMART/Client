import type { UAVTelemetryData } from './uavTelemetryData.model';

export interface TelemetryBroadcastDto {
  uavData: UAVTelemetryData[];
}
