import { ViolationType } from '../../common/enums';

export interface Violation {
  violationType: ViolationType;
  missionId: string;
  missionTitle: string;
  description: string;
}
