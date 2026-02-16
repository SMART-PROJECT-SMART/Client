import { Injectable } from '@angular/core';
import * as Cesium from 'cesium';
import { CesiumConstants } from '../../common/constants/cesium.constants';
import { PlatformType } from '../../common/enums/platformType.enum';
import type { UAVUpdateData } from '../../models/cesium';
import { CesiumOrientationHelper } from './helpers/cesium-orientation.helper';
import { CesiumUavHelper } from './helpers/cesium-uav.helper';

const platformTypeValues = Object.values(PlatformType);

@Injectable({
  providedIn: 'root',
})
export class CesiumUAVService {
  private readonly uavPositionProperties = new Map<number, Cesium.SampledPositionProperty>();
  private readonly uavPlatformTypes = new Map<number, PlatformType>();
  private readonly orientationCurrentByUav = new Map<number, Cesium.Quaternion>();
  private readonly orientationTargetByUav = new Map<number, Cesium.Quaternion>();
  private readonly orientationLastUpdateTimeMs = new Map<number, number>();
  private readonly lastLoggedPositionByUav = new Map<
    number,
    { latitude: number; longitude: number; height: number }
  >();
  private viewer?: Cesium.Viewer;

  private resolvePlatformType(platformTypeIndex: number): PlatformType {
    return (platformTypeValues[platformTypeIndex] as PlatformType | undefined)
      ?? PlatformType.Hermes900;
  }

  private getSmoothedOrientation(uavId: number, result?: Cesium.Quaternion): Cesium.Quaternion | undefined {
    const current = this.orientationCurrentByUav.get(uavId);
    const target = this.orientationTargetByUav.get(uavId);
    if (!current || !target) return current ?? target;
    const dot = Math.abs(Cesium.Quaternion.dot(current, target));
    const angleRad = 2 * Math.acos(Math.min(1, dot));
    const isJump = angleRad >= CesiumConstants.ORIENTATION_JUMP_ANGLE_RADIANS;
    if (isJump) {
      const snap = Cesium.Quaternion.clone(target, result ?? new Cesium.Quaternion());
      this.orientationCurrentByUav.set(uavId, Cesium.Quaternion.clone(target, new Cesium.Quaternion()));
      return snap;
    }
    const now = performance.now();
    const lastMs = this.orientationLastUpdateTimeMs.get(uavId) ?? now;
    this.orientationLastUpdateTimeMs.set(uavId, now);
    const deltaMs = Math.min(now - lastMs, CesiumConstants.ORIENTATION_DELTA_MS_CLAMP);
    const durationMs = CesiumConstants.ORIENTATION_SMOOTH_DURATION_MS;
    const blend =
      durationMs <= 0
        ? 1
        : Math.min(1, 1 - Math.exp(-deltaMs / durationMs));
    const out = result ?? new Cesium.Quaternion();
    Cesium.Quaternion.slerp(current, target, blend, out);
    this.orientationCurrentByUav.set(uavId, Cesium.Quaternion.clone(out, new Cesium.Quaternion()));
    return out;
  }

  public createUAV(viewer: Cesium.Viewer, uavId: number, updateData: UAVUpdateData, platformTypeIndex: number): Cesium.Entity {
    this.viewer = viewer;
    const platformType = this.resolvePlatformType(platformTypeIndex);
    this.uavPlatformTypes.set(uavId, platformType);

    const modelUri = CesiumConstants.UAV_MODEL_PATHS[platformType];
    const positionProperty = CesiumUavHelper.createSampledPositionProperty(viewer, updateData);
    this.uavPositionProperties.set(uavId, positionProperty);
    const cartesian = CesiumUavHelper.getCartesian(updateData);
    const yawCorrection = CesiumConstants.UAV_MODEL_YAW_CORRECTIONS[platformType];
    const quaternion = CesiumOrientationHelper.calculateHeadingPitchRollQuaternion(
      updateData,
      cartesian,
      yawCorrection
    );
    const quatClone = Cesium.Quaternion.clone(quaternion, new Cesium.Quaternion());
    this.orientationCurrentByUav.set(uavId, quatClone);
    this.orientationTargetByUav.set(uavId, Cesium.Quaternion.clone(quaternion, new Cesium.Quaternion()));
    const orientationProperty = new Cesium.CallbackProperty(
      (time?: Cesium.JulianDate, result?: Cesium.Quaternion) =>
        this.getSmoothedOrientation(uavId, result),
      false
    );
    return viewer.entities.add({
      id: `${CesiumConstants.UAV_ENTITY_PREFIX_NAME}${uavId}`,
      position: positionProperty,
      orientation: orientationProperty,
      model: {
        uri: modelUri,
        minimumPixelSize: CesiumConstants.UAV_MODEL_MINIMUM_PIXEL_SIZE,
        maximumScale: CesiumConstants.UAV_MODEL_MAXIMUM_SCALE,
        scale: CesiumConstants.UAV_MODEL_SCALE,
      },
    });
  }

  public updateUAV(uavId: number, updateData: UAVUpdateData): void {
    const positionProperty = this.uavPositionProperties.get(uavId);
    if (!positionProperty || !this.viewer) {
      return;
    }
    const entity = this.viewer.entities.getById(
      `${CesiumConstants.UAV_ENTITY_PREFIX_NAME}${uavId}`
    );
    if (!entity) {
      return;
    }
    const pos = updateData.position;
    const last = this.lastLoggedPositionByUav.get(uavId);
    const latLonThreshold = CesiumConstants.POSITION_JUMP_LOG_LAT_LON_DEGREES;
    const heightThreshold = CesiumConstants.POSITION_JUMP_LOG_HEIGHT_METERS;
    const latJump = last !== undefined && Math.abs(pos.latitude - last.latitude) >= latLonThreshold;
    const lonJump = last !== undefined && Math.abs(pos.longitude - last.longitude) >= latLonThreshold;
    const heightJump =
      last !== undefined && Math.abs(pos.height - last.height) >= heightThreshold;
    if (latJump || lonJump || heightJump) {
      console.log('[UAV] large position jump from LTS', {
        uavId,
        previous: last,
        fromLts: pos,
      });
    }
    this.lastLoggedPositionByUav.set(uavId, {
      latitude: pos.latitude,
      longitude: pos.longitude,
      height: pos.height,
    });
    const cartesian = CesiumUavHelper.addSampleToPositionProperty(
      this.viewer,
      positionProperty,
      updateData
    );
    const platformType = this.uavPlatformTypes.get(uavId) ?? PlatformType.Hermes900;
    const yawCorrection = CesiumConstants.UAV_MODEL_YAW_CORRECTIONS[platformType];
    const targetQuat = CesiumOrientationHelper.calculateQuaternion(updateData, cartesian, yawCorrection);
    this.orientationTargetByUav.set(uavId, Cesium.Quaternion.clone(targetQuat, new Cesium.Quaternion()));
  }

  public removeUAV(viewer: Cesium.Viewer, entity: Cesium.Entity): void {
    const id = entity.id;
    if (typeof id === 'string' && id.startsWith(CesiumConstants.UAV_ENTITY_PREFIX_NAME)) {
      const uavId = Number(id.slice(CesiumConstants.UAV_ENTITY_PREFIX_NAME.length));
      this.orientationCurrentByUav.delete(uavId);
      this.orientationTargetByUav.delete(uavId);
      this.orientationLastUpdateTimeMs.delete(uavId);
      this.lastLoggedPositionByUav.delete(uavId);
    }
    viewer.entities.remove(entity);
  }

  public removeAllUAVs(viewer: Cesium.Viewer): void {
    const entitiesToRemove: Cesium.Entity[] = [];
    viewer.entities.values.forEach((entity) => {
      if (entity.id.startsWith(CesiumConstants.UAV_ENTITY_PREFIX_NAME)) {
        entitiesToRemove.push(entity);
      }
    });
    entitiesToRemove.forEach((entity) => {
      viewer.entities.remove(entity);
    });
    this.orientationCurrentByUav.clear();
    this.orientationTargetByUav.clear();
    this.orientationLastUpdateTimeMs.clear();
    this.lastLoggedPositionByUav.clear();
  }
}
