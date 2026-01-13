import type { Mission } from './mission.model';
import type { TimeWindow } from '../geographic/timeWindow.model';

export interface MissionAssignmentPairing {
  mission: Mission;
  tailId: number;
  timeWindow: TimeWindow;
}
