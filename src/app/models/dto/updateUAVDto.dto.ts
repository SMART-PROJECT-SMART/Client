import type { Location } from '../geographic/location.model';

export interface UpdateUAVDto {
  tailId: number;
  platformType: number;
  baseLocation: Location;
}
