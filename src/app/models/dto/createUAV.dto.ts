import { PlatformType } from '../../common/enums';
import type { Location } from '../geographic/location.model';

export interface CreateUAVDto {
  tailId: number;
  platformType: PlatformType;
  baseLocation: Location;
}
