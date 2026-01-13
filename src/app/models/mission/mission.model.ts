import { Priority, UAVType } from '../../common/enums';
import { TimeWindow } from '../geographic/timeWindow.model';
import { Location } from '../geographic/location.model';

export interface Mission {
  id: string;
  title: string;
  requiredUAVType: UAVType;
  priority: Priority;
  location: Location;
  timeWindow: TimeWindow;
}
