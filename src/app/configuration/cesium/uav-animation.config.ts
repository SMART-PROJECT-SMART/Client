import type { GeographicPosition } from '../../models/cesium/position/geographic-position.model';
import type { GeographicBounds } from '../../models/cesium/position/geographic-bounds.model';
import type { AltitudeConstraints } from '../../models/cesium/position/altitude-constraints.model';

export interface UAVAnimationConfig {
  readonly position: GeographicPosition;
  readonly bounds: GeographicBounds;
  readonly altitudeConstraints: AltitudeConstraints;
  readonly waypointInterval: number;
}
