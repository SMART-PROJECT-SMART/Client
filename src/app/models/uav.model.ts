import { UAVType, TelemetryField } from '../common/enums';

export interface UAV {
  tailId: number;
  uavType: UAVType;
  telemetryData: Record<TelemetryField, number>;
}
