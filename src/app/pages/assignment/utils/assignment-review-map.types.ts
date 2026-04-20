import type { Mission } from '../../../models';

export type CreateUavDivIconOptions = {
  isOnActiveMission?: boolean;
};

export type BuildUavTooltipOptions = {
  activeMission?: Mission | null;
};

