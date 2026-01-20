import { MilitaryBranchType } from '../common/enums';

export interface MilitaryBase {
  name: string;
  type: MilitaryBranchType;
  latitude: number;
  longitude: number;
  altitude: number;
}
