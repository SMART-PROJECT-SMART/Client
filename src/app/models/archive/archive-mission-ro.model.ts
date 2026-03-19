import type { Location } from '../geographic/location.model';
import type { TimeWindow } from '../geographic/timeWindow.model';

export interface ArchiveTimeWindow {
  start: string;
  end: string;
}

export interface ArchiveMissionRo {
  id: string;
  title: string;
  requiredUAVType: string;
  priority: string;
  timeWindow: ArchiveTimeWindow;
  location: Location;
}
