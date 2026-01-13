import type { Entity } from 'cesium';
import type { GeographicPosition } from '../position/geographic-position.model';

export interface UAVAnimationState {
  readonly isAnimating: boolean;
  readonly currentPosition: GeographicPosition;
  readonly entity: Entity | null;
}
