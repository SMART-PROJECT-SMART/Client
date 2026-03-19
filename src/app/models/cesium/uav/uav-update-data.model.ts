import type { GeographicPosition } from '../position';
import type { UAVOrientation } from '../orientation';

export interface UAVUpdateData {
  readonly position: GeographicPosition;
  readonly orientation: UAVOrientation;
}
