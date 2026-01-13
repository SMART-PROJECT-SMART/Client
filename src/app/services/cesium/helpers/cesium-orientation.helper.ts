import { UAVUpdateData } from '../../../models/cesium';
import * as Cesium from 'cesium';

export class CesiumOrientationHelper {
  public static calculateQuaternion(
    updateData: UAVUpdateData,
    cartesian: Cesium.Cartesian3
  ): Cesium.Quaternion {
    const heading = Cesium.Math.toRadians(updateData.orientation.yaw + 90);
    const pitch = Cesium.Math.toRadians(updateData.orientation.pitch);
    const roll = Cesium.Math.toRadians(updateData.orientation.roll);
    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    const quaternion = Cesium.Transforms.headingPitchRollQuaternion(cartesian, hpr);
    return quaternion;
  }
  public static calculateHeadingPitchRollQuaternion(
    updateData: UAVUpdateData,
    cartesian: Cesium.Cartesian3
  ): Cesium.Quaternion {
    const heading = Cesium.Math.toRadians(updateData.orientation.yaw);
    const pitch = Cesium.Math.toRadians(updateData.orientation.pitch);
    const roll = Cesium.Math.toRadians(updateData.orientation.roll);
    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    return Cesium.Transforms.headingPitchRollQuaternion(cartesian, hpr);
  }
}
