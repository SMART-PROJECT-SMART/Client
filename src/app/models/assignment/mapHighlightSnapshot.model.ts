import type { UAVType } from '../../common/enums';

export type MapHighlightSnapshot = {
  missionIds: string[];
  missionTypes: UAVType[];
  uavTypes: UAVType[];
  tailIds: number[];
};
