import { UAV } from '../../../models/uav/uav.model';
import { UAVDisplay } from '../../../models/uav/uavDisplay.model';
export class UAVMapper {
  public static fromUAVToUAVDisplay(uav: UAV): UAVDisplay {
    return {
      tailId: uav.tailId,
    };
  }
}
