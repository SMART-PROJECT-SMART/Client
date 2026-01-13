import { Injectable } from '@angular/core';
import * as Cesium from 'cesium';
import { CesiumConstants } from '../../common/constants/cesium.constants';
import type { UAVUpdateData } from '../../models/cesium';

@Injectable({
  providedIn: 'root',
})
export class CesiumUAVService {
  private readonly uavPositionProperties = new Map<number, Cesium.SampledPositionProperty>();
  private readonly uavOrientationProperties = new Map<number, Cesium.SampledProperty>();
  public createUAV(
    viewer: Cesium.Viewer,
    uavId: number,
    updateData: UAVUpdateData
  ): Cesium.Entity {
    console.log('[UAVService] Creating UAV', uavId, 'with position:', updateData.position, 'orientation:', updateData.orientation);

    const positionProperty = new Cesium.SampledPositionProperty();
    const orientationProperty = new Cesium.SampledProperty(Cesium.Quaternion);

    positionProperty.setInterpolationOptions({
      interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
      interpolationDegree: CesiumConstants.POSITION_INTERPOLATION_DEGREE,
    });

    positionProperty.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
    positionProperty.forwardExtrapolationDuration = CesiumConstants.EXTRAPOLATION_DURATION_SECONDS;

    orientationProperty.setInterpolationOptions({
      interpolationAlgorithm: Cesium.LinearApproximation,
      interpolationDegree: CesiumConstants.ORIENTATION_INTERPOLATION_DEGREE,
    });

    orientationProperty.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
    orientationProperty.forwardExtrapolationDuration = CesiumConstants.EXTRAPOLATION_DURATION_SECONDS;

    const time = Cesium.JulianDate.now();
    const cartesian = Cesium.Cartesian3.fromDegrees(
      updateData.position.longitude,
      updateData.position.latitude,
      updateData.position.height
    );

    console.log('[UAVService] Cartesian position:', cartesian);

    positionProperty.addSample(time, cartesian);

    const heading = Cesium.Math.toRadians(updateData.orientation.yaw + CesiumConstants.UAV_MODEL_HEADING_OFFSET_DEGREES);
    const pitch = Cesium.Math.toRadians(updateData.orientation.pitch);
    const roll = Cesium.Math.toRadians(updateData.orientation.roll);

    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    const quaternion = Cesium.Transforms.headingPitchRollQuaternion(cartesian, hpr);

    console.log('[UAVService] Quaternion:', quaternion);

    orientationProperty.addSample(time, quaternion);

    this.uavPositionProperties.set(uavId, positionProperty);
    this.uavOrientationProperties.set(uavId, orientationProperty);

    console.log('[UAVService] Stored properties for UAV', uavId);

    return viewer.entities.add({
      id: `uav-${uavId}`,
      position: positionProperty,
      orientation: orientationProperty,
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

  public updateUAV(uavId: number, updateData: UAVUpdateData): void {
    console.log('[UAVService] updateUAV called for UAV', uavId);

    const positionProperty = this.uavPositionProperties.get(uavId);
    const orientationProperty = this.uavOrientationProperties.get(uavId);

    console.log('[UAVService] Position property:', positionProperty, 'Orientation property:', orientationProperty);

    if (!positionProperty || !orientationProperty) {
      console.warn('[UAVService] Properties not found for UAV', uavId, '- cannot update');
      return;
    }

    console.log('[UAVService] Adding sample for UAV', uavId, 'with position:', updateData.position, 'orientation:', updateData.orientation);

    const time = Cesium.JulianDate.now();
    const cartesian = Cesium.Cartesian3.fromDegrees(
      updateData.position.longitude,
      updateData.position.latitude,
      updateData.position.height
    );

    positionProperty.addSample(time, cartesian);

    const heading = Cesium.Math.toRadians(updateData.orientation.yaw + CesiumConstants.UAV_MODEL_HEADING_OFFSET_DEGREES);
    const pitch = Cesium.Math.toRadians(updateData.orientation.pitch);
    const roll = Cesium.Math.toRadians(updateData.orientation.roll);

    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    const quaternion = Cesium.Transforms.headingPitchRollQuaternion(cartesian, hpr);

    orientationProperty.addSample(time, quaternion);

    this.removeOldSamples(positionProperty, orientationProperty, time);
  }

  private removeOldSamples(
    positionProperty: Cesium.SampledPositionProperty,
    orientationProperty: Cesium.SampledProperty,
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
    orientationProperty.removeSamples(removalInterval);
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
