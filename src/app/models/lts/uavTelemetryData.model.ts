import type { TelemetryField } from '../../common/enums';

export interface UAVTelemetryData {
  tailId: number;
  fields: Record<TelemetryField, number>;
}
