import type { Priority, UAVType } from '../common/enums';
import type { TimeWindow } from './timeWindow.model';
import type { Location } from './location.model';

export interface Mission {
  id: string;
  requiredUAVType: UAVType;
  priority: Priority;
  location: Location;
  timeWindow: TimeWindow;
}
