import { Priority } from '../common/enums/priority.enum';
import { UAVType } from '../common/enums/uavType.enum';
import type { TimeWindow } from './timeWindow.model';
import type { Location } from './location.model';

export interface Mission {
  id: string;
  requiredUAVType: UAVType;
  missionPriority: Priority;
  location: Location;
  timeWindow: TimeWindow;
}
