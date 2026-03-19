import { Location } from '../geographic/location.model';

export interface CreateSleeveDto {
  name: string;
  location: Location;
  portNumbers: number[];
  assignedToTailId: number | null;
}
