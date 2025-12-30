import { Priority } from '../enums/priority.enum';
import { UAVType } from '../enums/uavType.enum';
import { TimeWindow } from './timeWindow.model';

export interface Mission {
  id: string;
  requiredUAVType: UAVType;
  missionPriority: Priority;
  location: Location;
  timeWindow: TimeWindow;
}
