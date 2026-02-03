import { PlatformType } from '../../common/enums';

export interface CreateUAVDto {
  tailId: number;
  platformType: PlatformType;
  baseLocation: Location;
}
