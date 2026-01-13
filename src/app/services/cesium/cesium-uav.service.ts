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
    positionProperty.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
    positionProperty.forwardExtrapolationDuration = CesiumConstants.EXTRAPOLATION_DURATION_SECONDS;

    const now = Cesium.JulianDate.now();
    const time = Cesium.JulianDate.addSeconds(
      now,
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
      //remove later
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

  public updateUAV(uavId: number, updateData: UAVUpdateData): void {
    const positionProperty = this.uavPositionProperties.get(uavId);
    const entity = this.viewer?.entities.getById(`uav-${uavId}`);
    if (!positionProperty || !this.viewer || !entity) {
      return;
    }

    const now = Cesium.JulianDate.now();
    const time = Cesium.JulianDate.addSeconds(
      now,
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

    this.removeOldSamples(positionProperty, time);
  }

  private removeOldSamples(
    positionProperty: Cesium.SampledPositionProperty,
    currentTime: Cesium.JulianDate
  ): void {
    const oldTime = Cesium.JulianDate.addSeconds(
      currentTime,
      -CesiumConstants.SAMPLE_RETENTION_SECONDS,
      new Cesium.JulianDate()
    );

    const removalInterval = new Cesium.TimeInterval({
      start: Cesium.JulianDate.fromIso8601(CesiumConstants.EPOCH_START_ISO),
      stop: oldTime,
    });

    positionProperty.removeSamples(removalInterval);
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
