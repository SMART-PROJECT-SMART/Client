import { TelemetryField } from '../../common/enums';
import { Mission } from './mission.model';

export interface MissionToUavAssignment {
  mission: Mission;
  uavTailId: number;
  startTime: Date;
  uavTelemetrySnapshot: Record<TelemetryField, number>;
}
