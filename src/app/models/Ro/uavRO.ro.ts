import { PlatformType } from '../../common/enums/platformType.enum';
import type { Location } from '../geographic/location.model';

export interface UAVRo {
  tailId: number;
  platformType: PlatformType;
  baseLocation: Location;
}
