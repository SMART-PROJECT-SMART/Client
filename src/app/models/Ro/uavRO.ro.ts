import { PlatformType } from '../../common/enums/platformType.enum';
export interface UAVRo {
  tailId: number;
  platformType: PlatformType;
  baseLocation: Location;
}
