import { PlatformType } from '../../common/enums';
import type { Location } from '../geographic/location.model';

export interface UpdateUAVDto {
  tailId: number;
  platformType: PlatformType;
  baseLocation: Location;
}
