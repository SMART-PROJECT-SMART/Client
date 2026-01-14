import { Injectable } from '@angular/core';
import * as Cesium from 'cesium';
import { CesiumConstants } from '../../common/constants/cesium.constants';
import type { UAVUpdateData } from '../../models/cesium';
import { CesiumOrientationHelper } from './helpers/cesium-orientation.helper';
import { CesiumInterpolationConfig } from '../../configuration/cesium/cesium-interpolation-config.config';

@Injectable({
  providedIn: 'root',
})
export class CesiumUAVService {
  private readonly uavPositionProperties = new Map<number, Cesium.SampledPositionProperty>();
  private viewer?: Cesium.Viewer;
  private interpolationConfig: CesiumInterpolationConfig;
  constructor() {
    this.interpolationConfig = {
      interpolationAlgorithm: Cesium.LinearApproximation,
      interpolationDegree: CesiumConstants.POSITION_INTERPOLATION_DEGREE,
    };
  }
  public createUAV(viewer: Cesium.Viewer, uavId: number, updateData: UAVUpdateData): Cesium.Entity {
    this.viewer = viewer;
    const positionProperty = new Cesium.SampledPositionProperty();
    positionProperty.setInterpolationOptions(this.interpolationConfig);
    positionProperty.forwardExtrapolationType = Cesium.ExtrapolationType.EXTRAPOLATE;
    positionProperty.backwardExtrapolationType = Cesium.ExtrapolationType.EXTRAPOLATE;
    const clockTime = viewer.clock.currentTime;
    const time = Cesium.JulianDate.addSeconds(
      clockTime,
      CesiumConstants.SAMPLE_TIME_BUFFER_SECONDS,
      new Cesium.JulianDate()
    );
    const cartesian = Cesium.Cartesian3.fromDegrees(
      updateData.position.longitude,
      updateData.position.latitude,
      updateData.position.height
    );
    positionProperty.addSample(time, cartesian);
    this.uavPositionProperties.set(uavId, positionProperty);
    const quaternion = CesiumOrientationHelper.calculateHeadingPitchRollQuaternion(
      updateData,
      cartesian
    );
    return viewer.entities.add({
      id: `uav-${uavId}`,
      position: positionProperty,
      orientation: new Cesium.ConstantProperty(quaternion),
      model: {
        uri: CesiumConstants.UAV_MODEL_PATH,
        minimumPixelSize: CesiumConstants.UAV_MODEL_MINIMUM_PIXEL_SIZE,
        maximumScale: CesiumConstants.UAV_MODEL_MAXIMUM_SCALE,
        scale: CesiumConstants.UAV_MODEL_SCALE,
      },
    });
  }

  public updateUAV(uavId: number, updateData: UAVUpdateData): void {
    const positionProperty = this.uavPositionProperties.get(uavId);
    const entity = this.viewer?.entities.getById(`uav-${uavId}`);
    if (!positionProperty || !this.viewer || !entity) {
      return;
    }

    const clockTime = this.viewer.clock.currentTime;
    const time = Cesium.JulianDate.addSeconds(
      clockTime,
      CesiumConstants.SAMPLE_TIME_BUFFER_SECONDS,
      new Cesium.JulianDate()
    );
    const cartesian = Cesium.Cartesian3.fromDegrees(
      updateData.position.longitude,
      updateData.position.latitude,
      updateData.position.height
    );

    positionProperty.addSample(time, cartesian);

    entity.orientation = new Cesium.ConstantProperty(
      CesiumOrientationHelper.calculateQuaternion(updateData, cartesian)
    );
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
