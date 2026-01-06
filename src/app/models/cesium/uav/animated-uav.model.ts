import type { Entity, SampledPositionProperty } from 'cesium';

export interface AnimatedUAV {
  readonly entity: Entity;
  readonly positionProperty: SampledPositionProperty;
}
