import type { Viewer } from 'cesium';

export interface CesiumInitializationResult {
  readonly viewer: Viewer;
  readonly success: boolean;
  readonly error?: Error;
}
