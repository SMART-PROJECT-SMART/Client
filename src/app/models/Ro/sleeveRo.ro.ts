import { Location } from '../geographic/location.model';
export interface SleeveRo {
  name: string;
  location: Location;
  portNumbers: number[];
  assignedToTailId: number | null;
}
