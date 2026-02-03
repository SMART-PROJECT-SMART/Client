import { Location } from '../geographic/location.model';

export interface UpdateSleeveDto {
  location: Location;
  portNumbers: number[];
  assignedToTailId: number | null;
}
