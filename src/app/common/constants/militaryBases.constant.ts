import { MilitaryBranchType } from '../enums';
import type { MilitaryBase } from '../../models';

export const MILITARY_BASES: MilitaryBase[] = [
  { name: 'Tel Nof', type: MilitaryBranchType.IAF, latitude: 31.8370, longitude: 34.8198, altitude: 55 },
  { name: 'Ramat David', type: MilitaryBranchType.IAF, latitude: 32.6651, longitude: 35.1795, altitude: 56 },
  { name: 'Hatzerim', type: MilitaryBranchType.IAF, latitude: 31.2333, longitude: 34.6575, altitude: 221 },
  { name: 'Nevatim', type: MilitaryBranchType.IAF, latitude: 31.2083, longitude: 35.0123, altitude: 400 },
  { name: 'Ramon', type: MilitaryBranchType.IAF, latitude: 30.7761, longitude: 34.6667, altitude: 650 },
  { name: 'Palmachim', type: MilitaryBranchType.IAF, latitude: 31.8994, longitude: 34.6909, altitude: 10 },
  { name: 'Hatzor', type: MilitaryBranchType.IAF, latitude: 31.7575, longitude: 34.7230, altitude: 50 },
  { name: 'Ovda', type: MilitaryBranchType.IAF, latitude: 29.9403, longitude: 34.9358, altitude: 455 },
  { name: 'Sde Dov', type: MilitaryBranchType.IAF, latitude: 32.1147, longitude: 34.7822, altitude: 13 },
];
