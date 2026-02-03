import { PlatformType } from '../../common/enums';

export interface UpdateUAVDto {
  tailId: number;
  platformType: PlatformType;
  baseLocation: Location;
}
