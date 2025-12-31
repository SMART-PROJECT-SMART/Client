import { Mission } from './mission.model';
import { UAV } from './uav.model';
import { TimeWindow } from './timeWindow.model';

export interface UavToMission {
  mission: Mission;
  uav: UAV;
  timeWindow: TimeWindow;
}
