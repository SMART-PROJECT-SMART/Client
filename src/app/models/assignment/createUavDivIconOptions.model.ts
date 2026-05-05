import type { UAVType } from '../../common/enums';

export type CreateUavDivIconOptions = {
  isOnActiveMission?: boolean;
  opacity?: number;
  uavType?: UAVType;
  relativeScoreText?: string | null;
};

