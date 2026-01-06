import { UAV } from './uav.model';
import { TimeWindow } from '../geographic/timeWindow.model';
import { Mission } from '../mission/mission.model';

export interface UavToMission {
  mission: Mission;
  uav: UAV;
  timeWindow: TimeWindow;
}
