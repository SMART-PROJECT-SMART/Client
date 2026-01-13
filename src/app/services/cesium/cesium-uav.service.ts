import { Injectable } from '@angular/core';
import * as Cesium from 'cesium';
import { CesiumConstants } from '../../common/constants/cesium.constants';
import type { GeographicPosition } from '../../models/cesium';
import { UAVTelemetryData } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class CesiumUAVService {
  public createUAV(
    viewer: Cesium.Viewer,
    uavId: number,
    position: GeographicPosition
  ): Cesium.Entity {
    const cartesianPosition = Cesium.Cartesian3.fromDegrees(
      position.longitude,
      position.latitude,
      position.height
    );

    const heading = Cesium.Math.toRadians(CesiumConstants.UAV_MODEL_ROTATION_DEGREES);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(
      cartesianPosition,
      new Cesium.HeadingPitchRoll(heading, 0, 0)
    );

    return viewer.entities.add({
      id: `uav-${uavId}`,
      position: cartesianPosition,
      orientation: orientation,
      model: {
        uri: CesiumConstants.UAV_MODEL_PATH,
        minimumPixelSize: CesiumConstants.UAV_MODEL_MINIMUM_PIXEL_SIZE,
        maximumScale: CesiumConstants.UAV_MODEL_MAXIMUM_SCALE,
        scale: CesiumConstants.UAV_MODEL_SCALE,
      },
      ellipse: {
        semiMinorAxis: 5000,
        semiMajorAxis: 5000,
        height: 0,
        material: Cesium.Color.RED.withAlpha(0.5),
        outline: true,
        outlineColor: Cesium.Color.RED,
        outlineWidth: 2,
      },
    });
  }

  public updateUAVPosition(entity: Cesium.Entity, telemetryData: UAVTelemetryData): void {
    const cartesianPosition = Cesium.Cartesian3.fromDegrees(
      telemetryData.fields.Longitude,
      telemetryData.fields.Latitude,
      telemetryData.fields.Altitude
    );

    entity.position = new Cesium.ConstantPositionProperty(cartesianPosition);

    const heading = Cesium.Math.toRadians(CesiumConstants.UAV_MODEL_ROTATION_DEGREES);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(
      cartesianPosition,
      new Cesium.HeadingPitchRoll(heading, 0, 0)
    );
    entity.orientation = new Cesium.ConstantProperty(orientation);
  }

  public removeUAV(viewer: Cesium.Viewer, entity: Cesium.Entity): void {
    viewer.entities.remove(entity);
  }

  public removeAllUAVs(viewer: Cesium.Viewer): void {
    const entitiesToRemove: Cesium.Entity[] = [];

    viewer.entities.values.forEach((entity) => {
      if (entity.id && typeof entity.id === 'string' && entity.id.startsWith('uav-')) {
        entitiesToRemove.push(entity);
      }
    });

    entitiesToRemove.forEach((entity) => {
      viewer.entities.remove(entity);
    });
  }
}
