import type { GeographicPosition } from '../position/geographic-position.model';

export interface CameraDestination {
  readonly position: GeographicPosition;
  readonly duration?: number;
}
