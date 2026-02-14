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
  private viewer?: Cesium.Viewer;

  private resolvePlatformType(platformTypeIndex: number): PlatformType {
    return (platformTypeValues[platformTypeIndex] as PlatformType | undefined)
      ?? PlatformType.Hermes900;
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
    return viewer.entities.add({
      id: `${CesiumConstants.UAV_ENTITY_PREFIX_NAME}${uavId}`,
      position: positionProperty,
      orientation: new Cesium.ConstantProperty(quaternion),
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
    const cartesian = CesiumUavHelper.addSampleToPositionProperty(
      this.viewer,
      positionProperty,
      updateData
    );
    const platformType = this.uavPlatformTypes.get(uavId) ?? PlatformType.Hermes900;
    const yawCorrection = CesiumConstants.UAV_MODEL_YAW_CORRECTIONS[platformType];
    entity.orientation = new Cesium.ConstantProperty(
      CesiumOrientationHelper.calculateQuaternion(updateData, cartesian, yawCorrection)
    );
  }

  public removeUAV(viewer: Cesium.Viewer, entity: Cesium.Entity): void {
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
  }
}
