import type { TelemetryField } from '../../common/enums';

export interface UAVWantedFields {
  tailId: number;
  wantedFields: TelemetryField[];
}
