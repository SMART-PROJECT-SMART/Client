import type { Location } from '../geographic/location.model';

export interface CreateUAVDto {
  tailId: number;
  platformType: number;
  baseLocation: Location;
}
