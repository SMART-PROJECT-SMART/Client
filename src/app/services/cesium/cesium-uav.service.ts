import { Injectable } from '@angular/core';
import * as Cesium from 'cesium';
import { CesiumConstants } from '../../common/constants/cesium.constants';
import type { GeographicPosition } from '../../models/cesium';

@Injectable({
  providedIn: 'root',
})
export class CesiumUAVService {
  public addStaticUAV(
    viewer: Cesium.Viewer,
    longitude: number,
    latitude: number,
    height: number
  ): Cesium.Entity {
    const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
    const heading = Cesium.Math.toRadians(CesiumConstants.UAV_MODEL_ROTATION_DEGREES);
    const pitch = 0;
    const roll = 0;
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(
      position,
      new Cesium.HeadingPitchRoll(heading, pitch, roll)
    );

    return viewer.entities.add({
      position: position,
      orientation: orientation,
      model: {
        uri: CesiumConstants.UAV_MODEL_PATH,
        minimumPixelSize: CesiumConstants.UAV_MODEL_MINIMUM_PIXEL_SIZE,
        maximumScale: CesiumConstants.UAV_MODEL_MAXIMUM_SCALE,
        scale: CesiumConstants.UAV_MODEL_SCALE,
      },
    });
  }

  public removeUAV(viewer: Cesium.Viewer, entity: Cesium.Entity | null): void {
    if (entity) {
      viewer.entities.remove(entity);
    }
  }

  public createUAVAtPosition(viewer: Cesium.Viewer, position: GeographicPosition): Cesium.Entity {
    return this.addStaticUAV(viewer, position.longitude, position.latitude, position.height);
  }
}
